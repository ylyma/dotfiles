import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CrudConfigService } from '@nestjsx/crud';
import * as cookieParser from 'cookie-parser';
import { doubleCsrf, doubleCsrfProtection, RequestMethod } from 'csrf-csrf';
import { Request, Response } from 'express';
import { API_KEY_HEADER } from 'src/common/constants/api';
import { crudGlobalConfig } from 'src/common/constants/crud-global-config';

import { CSRF_SECRET } from './common/constants';

CrudConfigService.load(crudGlobalConfig);

// eslint-disable-next-line import/first
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.APP_ENV === 'production' ? ['error', 'warn'] : ['log', 'debug', 'error', 'verbose', 'warn'],
  });
  const configService = app.get(ConfigService);

  if (process.env.APP_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AltaX Exchange')
      .setVersion('1.0')
      .addSecurity(API_KEY_HEADER, { type: 'apiKey', description: API_KEY_HEADER, name: API_KEY_HEADER, in: 'header' })
      .addBearerAuth({ type: 'http', scheme: 'bearer', in: 'header' }, 'bearer')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);


    app.getHttpAdapter().get('/api-json', (req: Request, res: Response) => {
      res.json(document);
    });
  }

  if (process.env.EXCHANGE_DISABLE_CSRF_AND_CSP !== 'true') applyCsrf(app);

  app.enableCors({
    allowedHeaders: ['content-type', 'authorization', 'x-csrf-token', 'apikey'],
    origin: ['http://localhost:6001', /\.altax\.dev$/, /\.alta\.exchange$/],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(configService.getOrThrow<number>('app.port'));
}

bootstrap();

function applyCsrf(app: INestApplication) {
  app.use(cookieParser());

  const { generateToken, validateRequest } = doubleCsrf({
    getSecret: () => CSRF_SECRET,
    cookieName: 'XSRF-TOKEN',
    cookieOptions: {
      sameSite: 'none',
    },
  });

  // heavily referencing csrf-csrf's doubleCsrfProtection implementation
  const csrfProtection: doubleCsrfProtection = (req, res, next) => {
    req.csrfToken = (overwrite?: boolean, validateOnReuse?: boolean) =>
      generateToken(req, res, overwrite, validateOnReuse);

    const ignoredMethodsSet = new Set(['GET', 'HEAD', 'OPTIONS']);
    if (ignoredMethodsSet.has(req.method as RequestMethod)) {
      next();
    } else if (isServerRequest(req)) {
      next();
    } else if (isPublicRoute(req)) {
      next();
    } else if (validateRequest(req)) {
      next();
    } else {
      return res.status(403).send({ message: 'Invalid csrf token' });
    }
  };

  app.use(csrfProtection);
}

function isServerRequest(req: Request) {
  return !!req.headers['apikey'];
}

function isPublicRoute(req: Request) {
  return req.path.startsWith('/auth');
}
