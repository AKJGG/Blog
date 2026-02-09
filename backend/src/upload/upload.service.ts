import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * 【生产预留】如需切换云存储，请安装：npm install @supabase/supabase-js
 */
// import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  // private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.ensureUploadDirExists();
    
    /**
     * 【生产预留】初始化 Supabase 客户端
     */
    /*
    const url = this.configService.get('SUPABASE_URL');
    const key = this.configService.get('SUPABASE_KEY');
    if (url && key) this.supabase = createClient(url, key);
    */
  }

  /**
   * 确保本地上传目录存在
   */
  private ensureUploadDirExists() {
    const uploadDirName = this.configService.get('UPLOAD_PATH') || 'uploads';
    const uploadPath = join(process.cwd(), uploadDirName);
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
      this.logger.log(`检测到上传目录不存在，已自动创建: ${uploadPath}`);
    }
  }

  /**
   * 处理上传后的逻辑
   */
  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('文件上传失败，未接收到有效文件');
    }

    // --- 模式 1: 本地存储 (对应 main.ts 中的静态资源映射) ---
    // 返回给前端的路径，前端访问 http://localhost:8000/uploads/xxx
    const fileUrl = `/uploads/${file.filename}`;

    // --- 模式 2: 【生产预留】Supabase Storage 上传 ---
    /*
    const bucket = this.configService.get('SUPABASE_BUCKET');
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(`public/${file.filename}`, file.buffer, { contentType: file.mimetype });

    if (error) throw new BadRequestException(`云端存储异常: ${error.message}`);
    
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(`public/${file.filename}`);
    */

    return {
      filename: file.filename,
      url: fileUrl, // 生产环境时切换为 publicUrl
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * 删除文件逻辑
   */
  async deleteFile(filename: string) {
    if (!filename) return;

    // 1. 本地物理删除
    const uploadDir = this.configService.get('UPLOAD_PATH') || 'uploads';
    const filePath = join(process.cwd(), uploadDir, filename);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`本地文件清理成功: ${filename}`);
      }
    } catch (err) {
      this.logger.error(`清理本地文件失败: ${err.message}`);
    }

    // 2. 【生产预留】云端删除
    /*
    const bucket = this.configService.get('SUPABASE_BUCKET');
    await this.supabase.storage.from(bucket).remove([`public/${filename}`]);
    */

    return { success: true };
  }
}
