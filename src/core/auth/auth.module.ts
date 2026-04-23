import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../modules/user/users.module.js';
import { UserTokenEntity } from '../../modules/user/entities/user-token.entity.js';
import { NotificationModule } from '../../modules/notification/notification.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PermissionModule } from '../../modules/permission/permission.module.js';

/**
 * Auth Module
 *
 * Design rationale:
 * - JwtModule is registered with `useFactory` so it can read from ConfigService
 *   (env-driven secrets). We only set the default access secret here; the
 *   strategies each call jwtService.signAsync with their own secret/expiry
 *   options to handle the two-token pattern cleanly.
 * - PassportModule default strategy is 'jwt' so guards that don't specify a
 *   strategy name fall back to the access-token strategy.
 * - UsersModule is imported (not re-provided) because UsersModule exports both
 *   UsersService and UsersRepository — no duplication needed.
 */
@Module({
  imports: [
    UsersModule,
    NotificationModule,
    TypeOrmModule.forFeature([UserTokenEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('token.accessSecret'),
        // `as any` cast: JwtSignOptions.expiresIn expects StringValue (branded ms type),
        // but our config value is a plain string. At runtime the values are identical.
        signOptions: {
          expiresIn: configService.get<string>('token.accessExpiresIn', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),

    PermissionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
