import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifyRepo: Repository<Notification>,
  ) {}

  /**
   * 复杂查询：获取分页通知并联查用户信息
   */
  async getNotifications(userId: number, page = 1, limit = 20) {
    try {
      const [items, total] = await this.notifyRepo.findAndCount({
        where: { userId },
        relations: ['fromUser'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`获取通知失败: ${error.message}`);
      throw new InternalServerErrorException('服务器忙，请稍后再试');
    }
  }

  /**
   * 批量已读：一次性处理多条消息
   */
  async batchMarkAsRead(userId: number, ids: number[]) {
    if (!ids.length) return { affected: 0 };
    return await this.notifyRepo.update(
      { id: In(ids), userId }, 
      { isRead: true }
    );
  }

  /**
   * 一键全读
   */
  async markAllAsRead(userId: number) {
    return await this.notifyRepo.update({ userId, isRead: false }, { isRead: true });
  }

  /**
   * 消息清理（维护逻辑）：自动删除 30 天前的已读旧通知，防止表爆炸
   */
  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await this.notifyRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date AND isRead = :isRead', { date: thirtyDaysAgo, isRead: true })
      .execute();
      
    this.logger.log(`系统自动清理了 ${result.affected} 条旧通知`);
  }
}
