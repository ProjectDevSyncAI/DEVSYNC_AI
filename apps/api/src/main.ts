import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AppValidationPipe } from './common/pipes/validation.pipe.js';

declare const console: {
  log: (...args: unknown[]) => void;
};

declare const process: {
  env: Record<string, string | undefined>;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(AppValidationPipe);

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DevSync AI API')
    .setDescription(
      'AI-powered collaborative developer platform API',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    swaggerDocument,
  );

  const port = Number(
    process.env.API_PORT ?? 3000,
  );

  await app.listen(port);

  console.log(
    `🚀 DevSync API running on http://localhost:${port}`,
  );

  console.log(
    `📚 Swagger: http://localhost:${port}/api/docs`,
  );
}

bootstrap();