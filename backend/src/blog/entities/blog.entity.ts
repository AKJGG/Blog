import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('blogs')
export class Blog {
  @ApiProperty({ description: '文章ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '标题' })
  @Column()
  title: string;

  @ApiProperty({ description: '摘要', required: false })
  @Column({ type: 'text', nullable: true })
  summary: string; // 已修复：对应 search.service 中的查询

  @ApiProperty({ description: '正文内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '封面图地址', required: false })
  @Column({ nullable: true })
  cover: string;

  @ApiProperty({ description: '分类名称' })
  @Column()
  category: string;

  @ApiProperty({ description: '标签列表', type: [String] })
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ApiProperty({ description: '阅读量' })
  @Column({ default: 0 })
  views: number; // 已修复：对应 statistics.service 中的计算

  @ApiProperty({ description: '是否发布' })
  @Column({ default: false })
  isPublished: boolean;

  // --- 关联关系 ---

  @ApiProperty({ description: '作者ID' })
  @Column()
  authorId: number; // 显式列出 authorId，方便 Subscriber 和 Service 直接使用

  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' }) // 明确指定外键列名
  author: User;

  // --- 时间戳 ---

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}