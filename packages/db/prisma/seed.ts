import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const org = await prisma.organization.create({
    data: {
      name: 'FirstCrop Biosciences Pvt Ltd',
      slug: 'firstcrop',
    },
  });
  console.log(`Created organization: ${org.name}`);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@firstcrop.in',
      name: 'Rajesh Kumar',
      emailVerified: true,
      employeeId: 'FC-001',
      department: 'ADMIN',
      plant: 'Plant 1 - Pune',
      designation: 'Managing Director',
    },
  });

  const qcUser = await prisma.user.create({
    data: {
      email: 'qc@firstcrop.in',
      name: 'Priya Sharma',
      emailVerified: true,
      employeeId: 'FC-002',
      department: 'QC',
      plant: 'Plant 1 - Pune',
      designation: 'QC Manager',
    },
  });

  const prodUser = await prisma.user.create({
    data: {
      email: 'production@firstcrop.in',
      name: 'Amit Patil',
      emailVerified: true,
      employeeId: 'FC-003',
      department: 'PRODUCTION',
      plant: 'Plant 1 - Pune',
      designation: 'Production Head',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@firstcrop.in',
      name: 'Sneha Deshmukh',
      emailVerified: true,
      employeeId: 'FC-004',
      department: 'SALES',
      plant: 'Plant 1 - Pune',
      designation: 'Sales Manager',
    },
  });

  await prisma.member.createMany({
    data: [
      { organizationId: org.id, userId: adminUser.id, role: 'owner' },
      { organizationId: org.id, userId: qcUser.id, role: 'qc_manager' },
      { organizationId: org.id, userId: prodUser.id, role: 'plant_manager' },
      { organizationId: org.id, userId: salesUser.id, role: 'sales_manager' },
    ],
  });
  console.log('Created users and members');

  const locations = await Promise.all([
    prisma.inventoryLocation.create({
      data: {
        organizationId: org.id,
        name: 'Raw Material Warehouse',
        type: 'WAREHOUSE',
        address: 'Plot 12, MIDC, Pune',
        capacity: 50000,
      },
    }),
    prisma.inventoryLocation.create({
      data: {
        organizationId: org.id,
        name: 'Cold Storage Unit',
        type: 'COLD_STORAGE',
        address: 'Plot 12, MIDC, Pune',
        capacity: 10000,
        temperatureControlled: true,
        minTemp: 2,
        maxTemp: 8,
      },
    }),
    prisma.inventoryLocation.create({
      data: {
        organizationId: org.id,
        name: 'Production Floor',
        type: 'PRODUCTION_FLOOR',
        address: 'Plot 12, MIDC, Pune',
        capacity: 20000,
      },
    }),
    prisma.inventoryLocation.create({
      data: {
        organizationId: org.id,
        name: 'QC Laboratory',
        type: 'QC_LAB',
        address: 'Plot 12, MIDC, Pune',
      },
    }),
    prisma.inventoryLocation.create({
      data: {
        organizationId: org.id,
        name: 'Finished Goods Warehouse',
        type: 'FINISHED_GOODS',
        address: 'Plot 12, MIDC, Pune',
        capacity: 30000,
      },
    }),
  ]);
  console.log(`Created ${locations.length} inventory locations`);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'FirstCrop Bio Fertilizer - Azospirillum',
        slug: 'fc-azospirillum',
        sku: 'FC-BF-AZO-500',
        category: 'BIO_FERTILIZER',
        description: 'Nitrogen-fixing bio-fertilizer for all cereal crops. Contains Azospirillum brasilense.',
        shortDescription: 'Nitrogen fixer for cereals',
        strainName: 'Azospirillum brasilense',
        strainId: 'MTCC 552',
        formulationType: 'LIQUID',
        cfuPerMl: 100000000,
        phRange: '6.5-7.5',
        temperatureRange: '25-35°C',
        unitSize: 500,
        unitSizeUnit: 'ML',
        unitsPerPack: 1,
        packType: 'BOTTLE',
        mrpPerUnit: 250,
        costPerUnit: 120,
        gstRate: 12,
        shelfLifeDays: 365,
        fssaiNumber: '10019062000123',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'FirstCrop Bio Fertilizer - Rhizobium',
        slug: 'fc-rhizobium',
        sku: 'FC-BF-RHI-500',
        category: 'BIO_FERTILIZER',
        description: 'Symbiotic nitrogen fixer for leguminous crops. Contains Rhizobium leguminosarum.',
        shortDescription: 'Nitrogen fixer for legumes',
        strainName: 'Rhizobium leguminosarum',
        strainId: 'MTCC 108',
        formulationType: 'POWDER',
        cfuPerGram: 50000000,
        unitSize: 250,
        unitSizeUnit: 'GRAM',
        unitsPerPack: 1,
        packType: 'POUCH',
        mrpPerUnit: 180,
        costPerUnit: 85,
        gstRate: 12,
        shelfLifeDays: 540,
        fssaiNumber: '10019062000456',
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'FirstCrop Trichoderma Viride',
        slug: 'fc-trichoderma',
        sku: 'FC-BF-TRI-1000',
        category: 'BIO_FUNGICIDE',
        description: 'Broad-spectrum bio-fungal control. Effective against damping off, root rot, and wilt.',
        shortDescription: 'Bio-fungicide for soil diseases',
        strainName: 'Trichoderma viride',
        strainId: 'MTCC 793',
        formulationType: 'POWDER',
        cfuPerGram: 200000000,
        unitSize: 1,
        unitSizeUnit: 'KG',
        unitsPerPack: 1,
        packType: 'BAG',
        mrpPerUnit: 450,
        costPerUnit: 220,
        gstRate: 12,
        shelfLifeDays: 270,
        organicCertified: true,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'FirstCrop Pseudomonas Fluorescens',
        slug: 'fc-pseudomonas',
        sku: 'FC-BF-PSF-500',
        category: 'BIO_PESTICIDE',
        description: 'Bio-pesticide effective against soil-borne pathogens and root-knot nematodes.',
        shortDescription: 'Bio-pesticide for nematodes',
        strainName: 'Pseudomonas fluorescens',
        strainId: 'MTCC 103',
        formulationType: 'LIQUID',
        cfuPerMl: 150000000,
        phRange: '6.0-7.0',
        unitSize: 500,
        unitSizeUnit: 'ML',
        unitsPerPack: 1,
        packType: 'BOTTLE',
        mrpPerUnit: 320,
        costPerUnit: 150,
        gstRate: 12,
        shelfLifeDays: 180,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: org.id,
        name: 'FirstCrop Vermicompost Premium',
        slug: 'fc-vermicompost',
        sku: 'FC-OF-VCP-25',
        category: 'ORGANIC_FERTILIZER',
        description: 'Premium vermicompost enriched with beneficial microbes. OMRI listed.',
        shortDescription: 'Premium organic manure',
        unitSize: 25,
        unitSizeUnit: 'KG',
        unitsPerPack: 1,
        packType: 'BAG',
        mrpPerUnit: 350,
        costPerUnit: 180,
        gstRate: 0,
        shelfLifeDays: 1095,
        organicCertified: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`Created ${products.length} products`);

  const rawMaterials = await Promise.all([
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Azospirillum brasilense Culture',
        code: 'RM-ST-AZO',
        category: 'STRAIN',
        description: 'Mother culture of Azospirillum brasilense (MTCC 552)',
        strainName: 'Azospirillum brasilense',
        cultureCollection: 'MTCC 552',
        strainType: 'BACTERIA',
        currentStock: 50,
        unit: 'ML',
        reorderLevel: 20,
        reorderQuantity: 100,
        maxStock: 500,
        costPerUnit: 500,
        storageCondition: 'COLD_STORAGE',
        minTemp: 2,
        maxTemp: 8,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Rhizobium leguminosarum Culture',
        code: 'RM-ST-RHI',
        category: 'STRAIN',
        description: 'Mother culture of Rhizobium leguminosarum (MTCC 108)',
        strainName: 'Rhizobium leguminosarum',
        cultureCollection: 'MTCC 108',
        strainType: 'BACTERIA',
        currentStock: 30,
        unit: 'ML',
        reorderLevel: 15,
        reorderQuantity: 80,
        maxStock: 300,
        costPerUnit: 450,
        storageCondition: 'COLD_STORAGE',
        minTemp: 2,
        maxTemp: 8,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Trichoderma viride Spores',
        code: 'RM-ST-TRI',
        category: 'STRAIN',
        description: 'Conidia suspension of Trichoderma viride (MTCC 793)',
        strainName: 'Trichoderma viride',
        cultureCollection: 'MTCC 793',
        strainType: 'FUNGUS',
        currentStock: 100,
        unit: 'GRAM',
        reorderLevel: 30,
        reorderQuantity: 200,
        maxStock: 1000,
        costPerUnit: 800,
        storageCondition: 'ROOM_TEMP',
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Nutrient Broth Media',
        code: 'RM-MD-NB',
        category: 'MEDIA',
        description: 'Standard nutrient broth for bacterial fermentation',
        currentStock: 200,
        unit: 'KG',
        reorderLevel: 50,
        reorderQuantity: 100,
        maxStock: 500,
        costPerUnit: 120,
        storageCondition: 'ROOM_TEMP',
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Sabouraud Dextrose Agar',
        code: 'RM-MD-SDA',
        category: 'MEDIA',
        description: 'Selective media for fungal cultivation',
        currentStock: 150,
        unit: 'KG',
        reorderLevel: 40,
        reorderQuantity: 80,
        maxStock: 400,
        costPerUnit: 180,
        storageCondition: 'ROOM_TEMP',
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'HDPE Bottles 500ml',
        code: 'RM-PK-BTL500',
        category: 'PACKAGING',
        description: '500ml HDPE bottles for liquid formulations',
        currentStock: 5000,
        unit: 'PIECE',
        reorderLevel: 1000,
        reorderQuantity: 5000,
        maxStock: 20000,
        costPerUnit: 8,
        storageCondition: 'ROOM_TEMP',
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Laminated Pouches 250g',
        code: 'RM-PK-POU250',
        category: 'PACKAGING',
        description: '250g laminated pouches for powder formulations',
        currentStock: 8000,
        unit: 'PIECE',
        reorderLevel: 2000,
        reorderQuantity: 10000,
        maxStock: 30000,
        costPerUnit: 5,
        storageCondition: 'ROOM_TEMP',
      },
    }),
    prisma.rawMaterial.create({
      data: {
        organizationId: org.id,
        name: 'Glycerol (Humectant)',
        code: 'RM-CH-GLY',
        category: 'CHEMICAL',
        description: 'Pharmaceutical grade glycerol for liquid formulations',
        currentStock: 80,
        unit: 'LITER',
        reorderLevel: 20,
        reorderQuantity: 50,
        maxStock: 200,
        costPerUnit: 150,
        storageCondition: 'ROOM_TEMP',
      },
    }),
  ]);
  console.log(`Created ${rawMaterials.length} raw materials`);

  const distributors = await Promise.all([
    prisma.party.create({
      data: {
        organizationId: org.id,
        type: 'DISTRIBUTOR',
        name: 'Maharashtra Agri Inputs Pvt Ltd',
        displayName: 'MAIPL',
        gstin: '27AABCM1234A1Z5',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        pincode: '411001',
        addressLine1: '123 Agriculture Market Yard',
        tags: ['preferred', 'bulk'],
      },
    }),
    prisma.party.create({
      data: {
        organizationId: org.id,
        type: 'DISTRIBUTOR',
        name: 'Karnataka Farm Solutions',
        displayName: 'KFS',
        gstin: '29AABCK5678B1Z3',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        pincode: '560001',
        addressLine1: '456 Green Village Road',
        tags: ['new'],
      },
    }),
    prisma.party.create({
      data: {
        organizationId: org.id,
        type: 'CUSTOMER',
        name: 'Rajesh Farms Cooperative',
        gstin: '27AABCR9012C1Z1',
        state: 'Maharashtra',
        district: 'Nashik',
        city: 'Nashik',
        pincode: '422001',
        addressLine1: 'Farm Road, Village Baramati',
        tags: ['cooperative', 'fpo'],
      },
    }),
    prisma.party.create({
      data: {
        organizationId: org.id,
        type: 'VENDOR',
        name: 'Microbial Cultures India',
        displayName: 'MCI',
        gstin: '27AABCM3456D1Z9',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        pincode: '411004',
        addressLine1: '789 Biotech Park, Hinjewadi',
        tags: ['strain-supplier'],
      },
    }),
  ]);

  await prisma.distributor.create({
    data: {
      partyId: distributors[0].id,
      territory: 'Western Maharashtra',
      region: 'West',
      state: 'Maharashtra',
      district: 'Pune',
      targetQuantity: 5000,
      currentQuantity: 2300,
      commissionRate: 8,
      coldStorageAvail: true,
      fieldAgentId: salesUser.id,
      rating: 4.5,
    },
  });

  await prisma.distributor.create({
    data: {
      partyId: distributors[1].id,
      territory: 'South Karnataka',
      region: 'South',
      state: 'Karnataka',
      district: 'Bangalore',
      targetQuantity: 3000,
      currentQuantity: 800,
      commissionRate: 7,
      coldStorageAvail: false,
      rating: 3.8,
    },
  });
  console.log(`Created ${distributors.length} parties (distributors, customer, vendor)`);

  const batch1 = await prisma.batch.create({
    data: {
      organizationId: org.id,
      batchNumber: 'BATCH-2025-001',
      productId: products[0].id,
      status: 'QC_PENDING',
      plannedQuantity: 5000,
      unit: 'ML',
      fermenterId: 'FER-001',
      fermenterCapacity: 10000,
      incubationTemp: 30,
      incubationPH: 7,
      incubationTimeHours: 48,
      agitationRPM: 150,
      expiryDate: new Date('2026-07-01'),
      shelfLifeDays: 365,
      notes: 'First production batch of Azospirillum',
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      organizationId: org.id,
      batchNumber: 'BATCH-2025-002',
      productId: products[2].id,
      status: 'IN_PROGRESS',
      plannedQuantity: 2000,
      unit: 'GRAM',
      fermenterId: 'FER-002',
      fermenterCapacity: 5000,
      incubationTemp: 28,
      incubationPH: 6.5,
      incubationTimeHours: 72,
      expiryDate: new Date('2025-12-01'),
      shelfLifeDays: 270,
      notes: 'Trichoderma viride production run',
    },
  });
  console.log('Created 2 sample batches');

  await prisma.batchIngredient.createMany({
    data: [
      { batchId: batch1.id, rawMaterialId: rawMaterials[0].id, plannedQuantity: 10, unit: 'ML' },
      { batchId: batch1.id, rawMaterialId: rawMaterials[3].id, plannedQuantity: 50, unit: 'KG' },
      { batchId: batch1.id, rawMaterialId: rawMaterials[7].id, plannedQuantity: 5, unit: 'LITER' },
      { batchId: batch2.id, rawMaterialId: rawMaterials[2].id, plannedQuantity: 20, unit: 'GRAM' },
      { batchId: batch2.id, rawMaterialId: rawMaterials[4].id, plannedQuantity: 30, unit: 'KG' },
    ],
  });

  await prisma.qCTest.create({
    data: {
      batchId: batch1.id,
      testType: 'CFU_COUNT',
      testMethod: 'PLATE_COUNT',
      parameter: 'Colony Forming Units per ml',
      expectedValue: '>= 1 x 10^8 CFU/ml',
      unit: 'CFU/ml',
      testedById: qcUser.id,
      labName: 'FirstCrop QC Lab',
    },
  });

  await prisma.qCTest.create({
    data: {
      batchId: batch1.id,
      testType: 'CONTAMINATION',
      testMethod: 'PLATE_COUNT',
      parameter: 'Total plate count (undesirable organisms)',
      expectedValue: '< 1000 CFU/ml',
      unit: 'CFU/ml',
      testedById: qcUser.id,
      labName: 'FirstCrop QC Lab',
    },
  });
  console.log('Created batch ingredients and QC tests');

  await prisma.complianceRecord.create({
    data: {
      organizationId: org.id,
      certType: 'FSSAI',
      certificateNumber: 'FSSAI-10019062000001',
      issuedBy: 'FSSAI',
      issuedDate: new Date('2024-01-15'),
      expiryDate: new Date('2029-01-14'),
      status: 'ACTIVE',
    },
  });

  await prisma.complianceRecord.create({
    data: {
      organizationId: org.id,
      certType: 'ORGANIC',
      certificateNumber: 'NPOP-ORG-2024-001',
      issuedBy: 'APEDA',
      issuedDate: new Date('2024-03-01'),
      expiryDate: new Date('2027-02-28'),
      status: 'ACTIVE',
    },
  });

  await prisma.complianceRecord.create({
    data: {
      organizationId: org.id,
      certType: 'GST_REGISTRATION',
      certificateNumber: '27AABCF1234A1Z5',
      issuedBy: 'GSTN',
      issuedDate: new Date('2022-04-01'),
      expiryDate: new Date('2099-12-31'),
      status: 'ACTIVE',
    },
  });
  console.log('Created compliance records');

  await prisma.appSetting.createMany({
    data: [
      {
        organizationId: org.id,
        key: 'company_name',
        value: 'FirstCrop Biosciences Pvt Ltd',
        description: 'Legal company name',
      },
      {
        organizationId: org.id,
        key: 'gstin',
        value: '27AABCF1234A1Z5',
        description: 'GST registration number',
      },
      {
        organizationId: org.id,
        key: 'default_gst_rate',
        value: 12,
        description: 'Default GST rate for products (percent)',
      },
      {
        organizationId: org.id,
        key: 'qc_pass_rate_threshold',
        value: 95,
        description: 'Minimum QC pass rate to approve batch (percent)',
      },
    ],
  });
  console.log('Created app settings');

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
