/**
 * FirstCrop Manufacturing Agent
 * LangGraph-based research agent for manufacturing ERP
 */

import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { PrismaClient } from '@firstcrop/db';
import { TaskQueue } from './lib/tasks';
import { evidenceScorer } from './lib/evidence';
import { ManufacturingTools } from './tools/manufacturing';

// ─── State Definition ─────────────────────────────────────────────────────

interface AgentState {
  messages: Array<{ role: string; content: string }>;
  currentTask: any | null;
  tools: ManufacturingTools;
  taskQueue: TaskQueue;
  prisma: PrismaClient;
  results: any[];
  errors: string[];
}

// ─── Agent Class ──────────────────────────────────────────────────────────

export class ManufacturingAgent {
  private prisma: PrismaClient;
  private taskQueue: TaskQueue;
  private tools: ManufacturingTools;
  private llm: ChatOpenAI;
  private graph: StateGraph<AgentState>;

  constructor() {
    this.prisma = new PrismaClient();
    this.taskQueue = new TaskQueue(this.prisma);
    this.tools = new ManufacturingTools(this.prisma);

    // Initialize LLM (use environment variable for API key)
    this.llm = new ChatOpenAI({
      modelName: process.env.AGENT_MODEL || 'gpt-4o-mini',
      temperature: 0,
    });

    // Build the agent graph
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<AgentState> {
    // Define state annotation
    const StateAnnotation = Annotation.Root({
      messages: Annotation<Array<{ role: string; content: string }>>,
      currentTask: Annotation<any | null>,
      tools: Annotation<ManufacturingTools>,
      taskQueue: Annotation<TaskQueue>,
      prisma: Annotation<PrismaClient>,
      results: Annotation<any[]>,
      errors: Annotation<string[]>,
    });

    // Build workflow graph
    const workflow = new StateGraph(StateAnnotation)
      .addNode('fetchTask', this.fetchTask.bind(this))
      .addNode('analyzeTask', this.analyzeTask.bind(this))
      .addNode('executeTool', this.executeTool.bind(this))
      .addNode('processResult', this.processResult.bind(this))
      .addNode('handleError', this.handleError.bind(this))
      .addEdge(START, 'fetchTask')
      .addConditionalEdges('fetchTask', this.shouldProcessTask, {
        process: 'analyzeTask',
        idle: END,
      })
      .addEdge('analyzeTask', 'executeTool')
      .addConditionalEdges('executeTool', this.didSucceed, {
        success: 'processResult',
        failure: 'handleError',
      })
      .addEdge('processResult', 'fetchTask')
      .addEdge('handleError', 'fetchTask');

    return workflow;
  }

  // ─── Node Functions ────────────────────────────────────────────────────

  private async fetchTask(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '';
      const task = await this.taskQueue.getNextTask(organizationId, 'agent-worker');

      if (!task) {
        return { currentTask: null };
      }

      return {
        currentTask: task,
        messages: [
          ...state.messages,
          { role: 'system', content: `Processing task: ${task.title}` },
        ],
      };
    } catch (error) {
      return {
        errors: [...state.errors, `Failed to fetch task: ${error}`],
      };
    }
  }

  private shouldProcessTask(state: AgentState): string {
    return state.currentTask ? 'process' : 'idle';
  }

  private async analyzeTask(state: AgentState): Promise<Partial<AgentState>> {
    const task = state.currentTask;

    // Determine which tool to use based on task kind
    const toolMap: Record<string, string> = {
      'EXPIRY_ALERT': 'checkBatchExpiry',
      'REORDER_RAW_MATERIAL': 'recommendReorder',
      'COMPLIANCE_CHECK': 'verifyCompliance',
      'QC_REVIEW': 'analyzeQCTrends',
      'PRODUCTION_REVIEW': 'generateProductionSchedule',
      'DISPATCH_REMINDER': 'trackColdChain',
    };

    const toolName = toolMap[task.kind] || 'unknown';

    return {
      messages: [
        ...state.messages,
        { role: 'assistant', content: `Using tool: ${toolName}` },
      ],
    };
  }

  private async executeTool(state: AgentState): Promise<Partial<AgentState>> {
    const task = state.currentTask;
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '';

    try {
      let result: any;

      switch (task.kind) {
        case 'EXPIRY_ALERT':
          result = await this.tools.getExpiringBatches(organizationId);
          break;

        case 'REORDER_RAW_MATERIAL':
          result = await this.tools.recommendReorder(organizationId);
          break;

        case 'COMPLIANCE_CHECK':
          result = await this.tools.verifyCompliance(organizationId);
          break;

        case 'QC_REVIEW':
          result = await this.tools.analyzeQCTrends(organizationId);
          break;

        case 'PRODUCTION_REVIEW':
          result = await this.tools.generateProductionSchedule(organizationId);
          break;

        case 'DISPATCH_REMINDER':
          // Get recent shipments
          const shipments = await this.prisma.shipment.findMany({
            where: {
              organizationId,
              status: { in: ['LOADED', 'IN_TRANSIT'] },
            },
            take: 5,
          });
          result = { shipments };
          break;

        default:
          result = { message: `No tool implemented for kind: ${task.kind}` };
      }

      return { results: [...state.results, result] };
    } catch (error) {
      return {
        errors: [...state.errors, `Tool execution failed: ${error}`],
      };
    }
  }

  private didSucceed(state: AgentState): string {
    return state.errors.length > 0 && state.errors[state.errors.length - 1]
      ? 'failure'
      : 'success';
  }

  private async processResult(state: AgentState): Promise<Partial<AgentState>> {
    const task = state.currentTask;
    const result = state.results[state.results.length - 1];

    // Complete the task
    await this.taskQueue.completeTask(task.id, result);

    return {
      messages: [
        ...state.messages,
        { role: 'assistant', content: `Task completed: ${task.title}` },
      ],
      currentTask: null,
    };
  }

  private async handleError(state: AgentState): Promise<Partial<AgentState>> {
    const task = state.currentTask;
    const error = state.errors[state.errors.length - 1];

    // Fail the task
    await this.taskQueue.failTask(task.id, error);

    return {
      messages: [
        ...state.messages,
        { role: 'assistant', content: `Task failed: ${task.title} - ${error}` },
      ],
      currentTask: null,
      errors: [], // Clear errors for next task
    };
  }

  // ─── Public Methods ────────────────────────────────────────────────────

  /**
   * Start the agent worker loop
   */
  async startWorker() {
    console.log('🚀 FirstCrop Manufacturing Agent started');

    const initialState: AgentState = {
      messages: [],
      currentTask: null,
      tools: this.tools,
      taskQueue: this.taskQueue,
      prisma: this.prisma,
      results: [],
      errors: [],
    };

    // Run the graph
    const graph = this.graph.compile();
    await graph.invoke(initialState);

    console.log('⏹️ Agent worker stopped');
  }

  /**
   * Process a single task
   */
  async processTask(taskId: string) {
    const task = await this.prisma.agentTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const initialState: AgentState = {
      messages: [],
      currentTask: task,
      tools: this.tools,
      taskQueue: this.taskQueue,
      prisma: this.prisma,
      results: [],
      errors: [],
    };

    const graph = this.graph.compile();
    return await graph.invoke(initialState);
  }

  /**
   * Stop the agent
   */
  async stop() {
    await this.prisma.$disconnect();
    console.log('🛑 Agent stopped');
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────

async function main() {
  const agent = new ManufacturingAgent();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  await agent.startWorker();
}

// Run if executed directly (ESM-compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export default ManufacturingAgent;
