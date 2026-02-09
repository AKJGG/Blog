import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn({ comment: '主键ID' })
  id: number;

  @ApiProperty({ description: '消息接收者' })
  @Index() // 索引优化，查询“我的消息”极快
  @Column()
  userId: number;

  @ApiProperty({ description: '动作触发者' })
  @Column()
  fromUserId: number;

  @ApiProperty({ description: '业务类型', enum: ['like', 'favorite', 'comment', 'follow'] })
  @Index()
  @Column({ type: 'varchar', length: 32 })
  type: string;

  @ApiProperty({ description: '通知文本正文' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '阅读状态' })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({ description: '关联的业务实体ID' })
  @Column({ nullable: true })
  relatedId: number;

  @ApiProperty({ description: '扩展数据，存储原始记录的部分快照' })
  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;
}
