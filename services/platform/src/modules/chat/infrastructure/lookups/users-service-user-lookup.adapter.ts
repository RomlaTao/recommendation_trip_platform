import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../user/users.service.js';
import type { UserLookupPort } from '../../application/ports/user-lookup.port.js';
import type { ChatParticipantModel } from '../../application/models/direct-conversation-list-item.model.js';

@Injectable()
export class UsersServiceUserLookupAdapter implements UserLookupPort {
  constructor(private readonly usersService: UsersService) {}

  async exists(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    return !!user && user.isActive && !user.deletedAt;
  }

  async findPublicProfiles(userIds: string[]): Promise<ChatParticipantModel[]> {
    if (userIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(userIds)];
    const users = await Promise.all(
      uniqueIds.map((id) => this.usersService.findById(id)),
    );

    return users
      .filter((user) => user && user.isActive && !user.deletedAt)
      .map((user) => ({
        id: user!.id,
        displayName: user!.username ?? user!.email.split('@')[0] ?? user!.id,
        avatarUrl: user!.avatarUrl ?? null,
      }));
  }
}
