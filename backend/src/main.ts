import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DuckBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- 关键修改：从环境变量读取端口，读取不到则默认 8000 ---
  const PORT = process.env.PORT || 8000;
  const PREFIX = 'api/v1';

  // 1. 全局前缀与跨域
  app.setGlobalPrefix(PREFIX);
  app.enableCors({
    origin: ['http://localhost:3000'], 
    credentials: true,
  });

  // 2. 静态资源映射
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 3. 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 4. Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('Duck Blog API')
    .setDescription('Nuxt 4 + NestJS + Supabase 全栈项目后端接口')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. 启动服务：使用动态端口
  await app.listen(PORT);

  // --- 漂亮的启动提示 ---
  const baseUrl = `http://localhost:${PORT}`;
  const dbStatus = process.env.DB_HOST?.includes('supabase') ? 'Supabase (Remote)' : 'PostgreSQL (Local)';
  
  console.log('\n' + '⭐'.repeat(25));
  logger.log(`🚀 服务启动成功！`);
  logger.log(`🔗 API 根地址:   ${baseUrl}/${PREFIX}`);
  logger.log(`📄 Swagger 文档:  ${baseUrl}/docs`);
  logger.log(`🗄️  当前数据库:   ${dbStatus}`);
  logger.log(`🛠️  当前环境:     ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📡 监听端口:     ${PORT}`); // 打印出实际监听的端口
  console.log('⭐'.repeat(25) + '\n');
}
bootstrap();
