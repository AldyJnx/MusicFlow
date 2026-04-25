import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
import { DevicesController } from "./devices.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersService } from "./users.service";
import { DevicesService } from "./devices.service";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "7d"),
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController, DevicesController],
  providers: [AuthService, JwtStrategy, UsersService, DevicesService],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
