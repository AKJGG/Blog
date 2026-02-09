import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('follows')
@Unique(['followerId', 'followingId']) // 确保不会重复关注
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  // 粉丝（发起关注的人）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ApiProperty({ description: '粉丝ID' })
  @Column()
  followerId: number;

  // 被关注的人（作者）
  @ManyToOne(() => User)
  @JoinColumn({ name: 'followingId' })
  following: User;

  @ApiProperty({ description: '被关注者ID' })
  @Column()
  followingId: number;

  @CreateDateColumn()
  createdAt: Date;
}