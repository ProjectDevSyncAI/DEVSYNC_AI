import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
<<<<<<< HEAD
import { EmailVerificationModule } from './email-verification/email-verification.module.js';
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

@Module({
  imports: [
    ConfigModule,
<<<<<<< HEAD
    EmailVerificationModule,
=======
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: '7d' as const,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
<<<<<<< HEAD
  exports: [AuthService, JwtModule, PassportModule],
=======
  exports: [AuthService],
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
})
export class AuthModule {}