import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Blog } from '../../blog/entities/blog.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() // 昵称不再强制唯一（根据你需求定，通常昵称可以重复，账号email不能重复）
  username: string;

  @Column({ unique: true }) // 登录账号
  email: string;

  @Column({ select: false }) 
  password: string;

  @Column({ nullable: true, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @OneToMany(() => Blog, (blog) => blog.author)
  blogs: Blog[];

  @CreateDateColumn()
  createdAt: Date;
}
