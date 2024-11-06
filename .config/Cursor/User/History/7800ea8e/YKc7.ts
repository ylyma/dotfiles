// Disabling for BucketModule, FileModule. If those two are imported before AuthGuard, app will break
// eslint-disable-next-line simple-import-sort/imports
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { BucketModule, FileModule } from 'file-upload';
import { LoggerMiddleware } from 'src/common/middlewares/logger.middleware';
import appConfig from 'src/config/app-config';
import databaseConfig from 'src/config/database-config';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { BucketController } from 'src/modules/upload/bucket/bucket.controller';
import { FileController } from 'src/modules/upload/file/file.controller';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JWT_EXPIRES_IN } from './common/constants';
import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { SuperAdminGuard } from './common/guards/superadmin.guard';
import { AccessModule } from './modules/access/access.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { HoldingsModule } from './modules/holdings/holdings.module';
import { InvestorsModule } from './modules/investors/investors.module';
import { OrderExpiryJobModule } from './modules/jobs/order-expiry/order-expiry-job.module';
import { EmailModule } from './modules/notifications/email.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { TokenModule } from './modules/token/tokens.module';
import { TradesModule } from './modules/trades/trades.module';
import { TradingPairsModule } from './modules/trading-pairs/trading-pairs.module';
import { ImportJobsModule } from './modules/jobs/import-orders/import-job.module';
import { PricingHistoryModule } from './modules/pricing-history/pricing-history.module';
import { CalculatePricingGraphJobModule } from './modules/jobs/calculate-pricing-graph/calculate-pricing-graph-job.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { NoticesModule } from './modules/notices/notices.module';
import { MessageOrderModule } from './modules/messages/orders/message-order.module';
import { PubSubModule } from './modules/messages/pubsub/pubsub.module';
import { PubsubSource } from './modules/messages/pubsub/pubsub.type';
import { IdempotencyModule } from './modules/messages/idempotency/idempotency.module';
import { RedocModule } from './modules/redoc/redoc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.getOrThrow('database')),
        autoLoadEntities: true,
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
    EventEmitterModule.forRoot(),
    OrdersModule,
    OrderExpiryJobModule,
    TradesModule,
    HoldingsModule,
    PricingModule,
    AccessModule,
    TradingPairsModule,
    InvestorsModule,
    EmailModule,
    AuthModule,
    TokenModule,
    BucketModule.register({ TypeOrmModule, BucketController }),
    FileModule.register({ TypeOrmModule, FileController }),
    ImportJobsModule,
    PricingHistoryModule,
    CalculatePricingGraphJobModule,
    AttachmentsModule,
    AssetsModule,
    NoticesModule,
    PubSubModule.forRoot({
      defaultTopicName: process.env.PUBSUB_TOPIC,
      defaultSource: PubsubSource.EXCHANGE,
      config: { projectId: process.env.PUBSUB_PROJECT_ID },
    }),
    MessageOrderModule,
    IdempotencyModule,
    SyncErrorLogModule,
    RedocModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SuperAdminGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
