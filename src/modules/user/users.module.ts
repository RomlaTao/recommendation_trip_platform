import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserTokenEntity } from './entities/user-token.entity.js';
import { PermissionModule } from '../permission/permission.module.js';
import { UsersController } from './controllers/users.controller';
import { AccountController } from './controllers/account.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';


@Module({
  imports: [
    PermissionModule,
    // Register the User entity with TypeORM for this module's scope.
    // `autoLoadEntities: true` in database.config.ts ensures TypeORM picks
    // up this entity without manual registration in the root config.
    TypeOrmModule.forFeature([User, UserTokenEntity]),
  ],
  controllers: [UsersController, AccountController],
  providers: [UsersService, UsersRepository],
  // Export both so AuthModule can consume them without re-providing
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
