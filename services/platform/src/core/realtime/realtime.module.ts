import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from '../../modules/user/users.module.js';
import { PermissionModule } from '../../modules/permission/permission.module.js';
import realtimeConfig from './config/realtime.config.js';
import { REALTIME_EMITTER } from './realtime.di-tokens.js';
import { ConnectionRegistryService } from './application/connection-registry.service.js';
import { WsAuthService } from './application/ws-auth.service.js';
import { NoopRealtimeEmitter } from './infrastructure/noop-realtime.emitter.js';
import { RealtimeGateway } from './infrastructure/realtime.gateway.js';
import { RealtimeServerHolder } from './infrastructure/realtime-server.holder.js';
import { SocketIoRealtimeEmitter } from './infrastructure/socket-io-realtime.emitter.js';

const realtimeEnabled =
  (process.env.REALTIME_ENABLED ?? 'true').toLowerCase() === 'true';

const gatewayProviders = realtimeEnabled
  ? [RealtimeGateway, SocketIoRealtimeEmitter]
  : [NoopRealtimeEmitter];

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(realtimeConfig),
    UsersModule,
    PermissionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('token.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>(
            'token.accessExpiresIn',
            '1d',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ConnectionRegistryService,
    WsAuthService,
    RealtimeServerHolder,
    ...gatewayProviders,
    {
      provide: REALTIME_EMITTER,
      useClass: realtimeEnabled
        ? SocketIoRealtimeEmitter
        : NoopRealtimeEmitter,
    },
  ],
  exports: [REALTIME_EMITTER, ConnectionRegistryService, WsAuthService],
})
export class RealtimeModule {}
