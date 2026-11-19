<<<<<<< HEAD
import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector?: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const handler = context.getHandler();
    const isPublic =
      this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        handler,
        context.getClass(),
      ]) ?? Reflect.getMetadata(IS_PUBLIC_KEY, handler);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
=======
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
>>>>>>> 9522e203164e6cd5d7c231342e593c9c681d137c
