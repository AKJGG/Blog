import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto, PasswordResetConfirmDto } from './dto/password-reset.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (user) throw new BadRequestException('该邮箱已被注册');
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userService.create({ ...dto, password: hashedPassword });
  }

  async login(dto: LoginDto) {
    // 特别注意：因为 Entity 设置了 select: false，这里需要 userService 提供支持查密码的方法
    const user = await this.userService.findWithPassword(dto.username);
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('用户名或密码错误');

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, username: user.username, avatar: user.avatar }
    };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.userService.findByUsernameAndEmail(dto.username, dto.email);
    if (!user) throw new BadRequestException('用户信息不匹配');

    const token = this.jwtService.sign({ sub: user.id, type: 'reset' }, { expiresIn: '15m' });
    await this.mailService.sendResetEmail(user.email, token);
    return { message: '邮件已发送' };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (payload.type !== 'reset') throw new Error();
      
      const hashedPassword = await bcrypt.hash(dto.new_password, 10);
      await this.userService.updatePassword(payload.sub, hashedPassword);
      return { message: '修改成功' };
    } catch (e) {
      throw new BadRequestException('链接无效或已过期');
    }
  }
}
