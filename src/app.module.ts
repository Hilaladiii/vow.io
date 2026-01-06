import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisModule } from './modules/redis/redis.module';
import { UserModule } from './modules/user/user.module';
import { DocumentModule } from './modules/document/document.module';
import { S3Module } from './modules/s3/s3.module';
import { EnvelopeService } from './modules/envelope/envelope.service';
import { EnvelopeController } from './modules/envelope/envelope.controller';
import { SignerModule } from './modules/signer/signer.module';
import { EmailQueue } from './commons/providers/queue/email-queue';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: parseInt(configService.get('REDIS_PORT')),
          },
          ttl: 60 * 100,
        }),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    RedisModule,
    UserModule,
    DocumentModule,
    S3Module,
    SignerModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    EnvelopeService,
    EmailQueue,
  ],
  controllers: [EnvelopeController],
})
export class AppModule {}
