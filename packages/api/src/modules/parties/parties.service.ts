import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Party, Contact, Prisma } from '@firstcrop/db';

@Injectable()
export class PartiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: { type?: string },
  ): Promise<Party[]> {
    const where: Prisma.PartyWhereInput = {
      organizationId,
      ...(filters?.type && { type: filters.type }),
    };

    return this.prisma.party.findMany({
      where,
      include: {
        contacts: true,
        _count: {
          select: {
            contacts: true,
            salesOrders: true,
            purchaseOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Party> {
    const party = await this.prisma.party.findUnique({
      where: { id },
      include: {
        contacts: true,
        ownerships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!party) {
      throw new NotFoundException(`Party with ID ${id} not found`);
    }

    return party;
  }

  async create(data: Prisma.PartyUncheckedCreateInput): Promise<Party> {
    return this.prisma.party.create({
      data,
      include: {
        contacts: true,
      },
    });
  }

  async update(id: string, data: Prisma.PartyUncheckedUpdateInput): Promise<Party> {
    await this.findOne(id);

    return this.prisma.party.update({
      where: { id },
      data,
      include: {
        contacts: true,
      },
    });
  }

  async remove(id: string): Promise<Party> {
    const party = await this.findOne(id);

    const relatedOrders = await this.prisma.salesOrder.count({
      where: { customerId: id },
    });

    if (relatedOrders > 0) {
      throw new BadRequestException(
        `Cannot delete party with ${relatedOrders} associated sales orders`,
      );
    }

    const relatedPurchaseOrders = await this.prisma.purchaseOrder.count({
      where: { vendorId: id },
    });

    if (relatedPurchaseOrders > 0) {
      throw new BadRequestException(
        `Cannot delete party with ${relatedPurchaseOrders} associated purchase orders`,
      );
    }

    await this.prisma.contact.deleteMany({ where: { partyId: id } });
    await this.prisma.partyOwnership.deleteMany({ where: { partyId: id } });

    return this.prisma.party.delete({ where: { id } });
  }

  async getStats(organizationId: string) {
    const totalParties = await this.prisma.party.count({
      where: { organizationId },
    });

    const byType = await this.prisma.party.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: true,
    });

    const totalContacts = await this.prisma.contact.count({
      where: {
        party: { organizationId },
      },
    });

    return {
      total: totalParties,
      byType,
      totalContacts,
    };
  }

  async getContacts(partyId: string): Promise<Contact[]> {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      throw new NotFoundException(`Party with ID ${partyId} not found`);
    }

    return this.prisma.contact.findMany({
      where: { partyId },
      orderBy: [{ isPrimary: 'desc' }, { firstName: 'asc' }],
    });
  }

  async addContact(partyId: string, data: Omit<Prisma.ContactCreateInput, 'party'>): Promise<Contact> {
    const party = await this.prisma.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      throw new NotFoundException(`Party with ID ${partyId} not found`);
    }

    return this.prisma.contact.create({
      data: {
        ...data,
        party: { connect: { id: partyId } },
      },
    });
  }

  async updateContact(contactId: string, data: Prisma.ContactUpdateInput): Promise<Contact> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return this.prisma.contact.update({
      where: { id: contactId },
      data,
    });
  }

  async removeContact(contactId: string): Promise<Contact> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return this.prisma.contact.delete({
      where: { id: contactId },
    });
  }
}
