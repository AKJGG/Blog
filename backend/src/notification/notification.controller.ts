import { Controller, Get, Patch, Body, UseGuards, Req, Query, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('消息中心')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('list')
  @ApiOperation({ summary: '分页获取我的通知' })
  getList(@Req() req, @Query('page') page: number) {
    return this.service.getNotifications(req.user.userId, page || 1);
  }

  @Patch('batch-read')
  @ApiOperation({ summary: '批量标记已读' })
  readBatch(@Req() req, @Body('ids') ids: number[]) {
    return this.service.batchMarkAsRead(req.user.userId, ids);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '一键全读' })
  readAll(@Req() req) {
    return this.service.markAllAsRead(req.user.userId);
  }
}
