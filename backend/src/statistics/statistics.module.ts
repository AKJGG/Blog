import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Blog } from '../blog/entities/blog.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Action } from '../action/entities/action.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, Follow, Action]) // 借用其他模块的实体
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}