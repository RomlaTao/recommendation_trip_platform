import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../user/users.service.js';
import type { NotificationUserLookupPort } from '../../application/ports/notification-user-lookup.port.js';

@Injectable()
export class NotificationUserLookupAdapter implements NotificationUserLookupPort {
  constructor(private readonly usersService: UsersService) {}

  async findEmailByUserId(userId: string): Promise<string | null> {
    const user = await this.usersService.findById(userId);
    return user?.email ?? null;
  }
}
