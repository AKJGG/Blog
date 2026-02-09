import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('社交关注')
@Controller('follow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':id')
  @ApiOperation({ summary: '切换关注状态' })
  toggle(@Param('id') id: string, @Req() req) {
    return this.followService.toggleFollow(req.user.userId, +id);
  }

  @Get('status/:id')
  @ApiOperation({ summary: '检查是否关注了该用户' })
  status(@Param('id') id: string, @Req() req) {
    return this.followService.checkStatus(req.user.userId, +id);
  }

  @Get('my-following')
  @ApiOperation({ summary: '获取我的关注列表' })
  getFollowing(@Req() req) {
    return this.followService.getFollowingList(req.user.userId);
  }

  @Get('my-followers')
  @ApiOperation({ summary: '获取我的粉丝列表' })
  getFollowers(@Req() req) {
    return this.followService.getFollowersList(req.user.userId);
  }
}
