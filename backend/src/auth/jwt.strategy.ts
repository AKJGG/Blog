import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    
    // 如果没有配置密钥，直接抛错或者给默认值，防止服务启动后验证失效
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // 此时 secret 确定是 string 类型
    });
  }

  // 当 JWT 验证通过后，这个方法会被调用
  async validate(payload: any) {
    // 检查 payload 是否有效
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Token 无效');
    }
    
    // 返回的内容会挂载到 req.user 上
    return { userId: payload.sub, username: payload.username };
  }
}