import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀 /api
  app.setGlobalPrefix('api');

  // Cookie parser middleware - 必须在所有路由之前配置
  app.use(cookieParser());

  // 全局异常过滤器 - 统一错误响应格式
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局验证管道 - 启用 class-validator 自动验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果有未定义的属性则抛出错误
      transform: true, // 自动转换类型
      exceptionFactory: (errors) => {
        // 转换为 BadRequestException 并附带验证错误消息
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints || {}),
        );
        return new BadRequestException(messages);
      },
    }),
  );

  // CORS 配置 - 允许前端访问
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
    : ['http://localhost:8080'];

  app.enableCors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求 (如移动应用、Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS 不允许的来源'), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API server running on http://localhost:${port}/api`);
}
bootstrap();
