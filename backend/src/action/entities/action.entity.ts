import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Blog } from '../../blog/entities/blog.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('actions')
@Unique(['userId', 'blogId', 'type']) // 防止重复点赞/收藏
export class Action {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '操作类型：like(点赞), favorite(收藏)' })
  @Column({ type: 'varchar', length: 20 })
  type: 'like' | 'favorite';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Blog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @Column()
  blogId: number;
}
