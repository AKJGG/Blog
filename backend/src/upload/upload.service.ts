import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  // 处理上传后的返回数据
  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('文件上传失败');
    }
    
    // 返回相对路径，前端配合环境变量拼接完整 URL
    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  // 删除文件逻辑（例如：更新头像后删除老图片，节省空间）
  async deleteFile(filename: string) {
    const filePath = join(__dirname, '../../uploads', filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return true;
    }
    return false;
  }
}
