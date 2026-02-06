import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 1. 创建用户
  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  // 2. 登录专用：强制拉取密码字段 (解决 select: false 问题)
  async findWithPassword(username: string) {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  // 3. 基础查询 (不带密码)
  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  // 4. 分页查询 (解决 UserController 里的 findAll 报错)
  async findAll(page: number = 1) {
    const limit = 10;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // 5. 更新用户信息
  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  // 6. 删除用户 (解决 UserController 里的 remove 报错)
  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { success: true, message: '用户已成功删除' };
  }

  // 7. 修改密码专用 (解决 AuthService 里的 updatePassword 报错)
  async updatePassword(id: number, hashedPassword: string) {
    await this.userRepository.update(id, { password: hashedPassword });
    return { success: true };
  }

  // 8. 辅助查询：通过用户名 (解决注册重复检查)
  async findByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  // 9. 辅助查询：通过邮箱 (解决 AuthService 里的 findByEmail 报错)
  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  // 10. 辅助查询：用户名和邮箱 (解决 AuthService 里的 findByUsernameAndEmail 报错)
  async findByUsernameAndEmail(username: string, email: string) {
    return await this.userRepository.findOne({ where: { username, email } });
  }
}
