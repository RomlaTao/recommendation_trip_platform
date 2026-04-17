import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

/**
 * Users Repository
 *
 * Design rationale:
 * - A dedicated repository class wraps TypeORM's generic Repository<User>,
 *   keeping all query logic out of the service layer and making queries
 *   easy to stub in unit tests.
 * - Methods that need to read sensitive fields (passwordHash)
 *   must call `addSelect` explicitly because those columns are marked
 *   `select: false` on the entity — a safety net so they are never accidentally
 *   returned in list queries or JSON responses.
 * - Following the Pragmatic/Hybrid architecture: this plain class is the
 *   Repository layer in the MVC stack. Future DDD modules (Trips, Itineraries)
 *   may use a richer Repository abstraction, but for Auth/Users simplicity wins.
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIdWithRole(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async findByIdIncludingDeleted(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  async findManyWithRole(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { users, total };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  /**
   * Loads passwordHash alongside the standard columns.
   * Used exclusively by AuthService during credential validation.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.repo.findOne({ where: { provider: provider as any, providerId } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.findByIdWithRole(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
}
