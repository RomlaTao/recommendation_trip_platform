import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../../modules/user/entities/user.entity';
import { Role } from '../../../../modules/permission/entities/role.entity';
import { UserRole } from '../../../../modules/permission/entities/user-role.entity';

const BCRYPT_ROUNDS = 10;

interface UserSeedEntry {
  email: string;
  username: string;
  plainPassword: string;
  roleCode: string;
  isActive: boolean;
  bio: string;
}

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Build user seed entries at runtime using ConfigService.
   * ConfigService is only available after the NestJS DI container has been
   * fully initialised (post-bootstrap), so process.env is guaranteed to
   * reflect the loaded .env values at this point.
   */
  private buildEntries(): UserSeedEntry[] {
    return [
      {
        email: this.configService.get<string>('ADMIN_EMAIL', ''),
        username: this.configService.get<string>('ADMIN_USERNAME', ''),
        plainPassword: this.configService.get<string>('ADMIN_PASSWORD', ''),
        roleCode: this.configService.get<string>('ADMIN_ROLE_CODE', 'ADMIN'),
        isActive:
          this.configService.get<string>('ADMIN_IS_ACTIVE', 'true') === 'true',
        bio: this.configService.get<string>(
          'ADMIN_BIO',
          'System administrator account.',
        ),
      },
      {
        email: this.configService.get<string>('MODERATOR_EMAIL', ''),
        username: this.configService.get<string>('MODERATOR_USERNAME', ''),
        plainPassword: this.configService.get<string>('MODERATOR_PASSWORD', ''),
        roleCode: this.configService.get<string>(
          'MODERATOR_ROLE_CODE',
          'MODERATOR',
        ),
        isActive:
          this.configService.get<string>('MODERATOR_IS_ACTIVE', 'true') ===
          'true',
        bio: this.configService.get<string>(
          'MODERATOR_BIO',
          'Content moderator account.',
        ),
      },
    ];
  }

  async run(): Promise<void> {
    this.logger.log('Seeding users...');

    const entries = this.buildEntries();

    for (const data of entries) {
      if (
        !data.email ||
        !data.username ||
        !data.plainPassword ||
        !data.roleCode
      ) {
        this.logger.warn(
          `  [WARN] Incomplete env config for role "${data.roleCode}" — check ADMIN_* / MODERATOR_* vars in .env`,
        );
        continue;
      }

      const exists = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (exists) {
        this.logger.log(`  [SKIP] User already exists: ${data.email}`);
        continue;
      }

      const role = await this.roleRepository.findOne({
        where: { code: data.roleCode },
      });

      if (!role) {
        this.logger.warn(
          `  [WARN] Role "${data.roleCode}" not found — skipping user: ${data.email}`,
        );
        continue;
      }

      const passwordHash = await bcrypt.hash(data.plainPassword, BCRYPT_ROUNDS);

      const createdUser = await this.userRepository.save(
        this.userRepository.create({
          email: data.email,
          username: data.username,
          passwordHash,
          isActive: data.isActive,
          bio: data.bio,
        }),
      );
      await this.userRoleRepository.save(
        this.userRoleRepository.create({
          userId: createdUser.id,
          roleId: role.id,
          isPrimary: true,
        }),
      );

      this.logger.log(
        `  [OK]   Created user: ${data.email} (role: ${data.roleCode})`,
      );
    }

    this.logger.log('Users seeding done.\n');
  }
}
