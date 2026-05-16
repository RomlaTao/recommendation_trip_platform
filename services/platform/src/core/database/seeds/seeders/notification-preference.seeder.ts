import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../modules/user/entities/user.entity.js';
import { NotificationPreferenceEntity } from '../../../../modules/notification/entities/notification-preference.entity.js';
import { NOTIFICATION_PREFERENCE_TYPES } from '../../../../modules/notification/notification.constants.js';

@Injectable()
export class NotificationPreferenceSeeder {
  private readonly logger = new Logger(NotificationPreferenceSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly preferenceRepository: Repository<NotificationPreferenceEntity>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Seeding notification preferences...');

    const users = await this.userRepository.find({
      select: { id: true, email: true },
    });

    let created = 0;
    let skipped = 0;
    const types = Object.values(NOTIFICATION_PREFERENCE_TYPES);

    for (const user of users) {
      for (const type of types) {
        const exists = await this.preferenceRepository.findOne({
          where: { userId: user.id, type },
        });
        if (exists) {
          skipped++;
          continue;
        }

        await this.preferenceRepository.save(
          this.preferenceRepository.create({
            userId: user.id,
            type,
            emailEnabled: true,
            inAppEnabled: true,
          }),
        );
        created++;
      }
    }

    this.logger.log(
      `Notification preferences seeding done. Created=${created}, Skipped=${skipped}\n`,
    );
  }
}
