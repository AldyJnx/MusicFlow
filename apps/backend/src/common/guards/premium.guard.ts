import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRE_PREMIUM_KEY } from "../decorators/require-premium.decorator";

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPremium = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_PREMIUM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresPremium) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user?.isPremium) {
      throw new ForbiddenException({
        message: "Premium subscription required",
        code: "PREMIUM_REQUIRED",
      });
    }

    return true;
  }
}
