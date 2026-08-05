import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { BatchesModule } from './modules/batches/batches.module';
import { QcModule } from './modules/qc/qc.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { FieldVisitsModule } from './modules/field-visits/field-visits.module';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { PartiesModule } from './modules/parties/parties.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RawMaterialsModule } from './modules/raw-materials/raw-materials.module';
import { DistributorsModule } from './modules/distributors/distributors.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    BatchesModule,
    QcModule,
    InventoryModule,
    OrdersModule,
    ProcurementModule,
    LogisticsModule,
    FinanceModule,
    ComplianceModule,
    PartiesModule,
    OrganizationsModule,
    RawMaterialsModule,
    DistributorsModule,
    ActivitiesModule,
    FieldVisitsModule,
    AppSettingsModule,
  ],
})
export class AppModule {}
