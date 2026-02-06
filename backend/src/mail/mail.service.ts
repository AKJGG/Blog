import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: true, // 使用 SSL/TLS
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendResetEmail(to: string, token: string) {
    // 这里的链接对应你 Nuxt 4 前端的重置页面
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;
    
    const html = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h2>重置您的博客密码</h2>
        <p>您正在尝试重置密码，请点击下方按钮完成操作（15分钟内有效）：</p>
        <a href="${resetUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          立即重置密码
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">如果不是您本人的操作，请忽略此邮件。</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Blog Admin" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: '密码重置请求',
      html,
    });
  }
}
