import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
     constructor(private reflector: Reflector) {
    super();
  }

  // 4. متد canActivate رو بازنویسی کن
  canActivate(context: ExecutionContext) {
    // چک کن که آیا دکوراتور @Public روی روت استفاده شده یا نه
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // اگر روت عمومی بود، گارد رو غیرفعال کن و اجازه عبور بده
    if (isPublic) {
      return true;
    }

    // در غیر این صورت، منطق پیش‌فرض JwtAuthGuard رو اجرا کن
    return super.canActivate(context);
  }
}