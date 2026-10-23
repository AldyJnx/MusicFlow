import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ExchangeGoogleTicketDto } from "./dto/exchange-google-ticket.dto";
import { GoogleMobileSignInDto } from "./dto/google-mobile-sign-in.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import {
  GoogleOAuthCallbackGuard,
  GoogleOAuthStartGuard,
} from "./guards/google-oauth.guard";
import { GoogleIdentity } from "./strategies/google.strategy";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "Email or username already exists" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("google")
  @UseGuards(GoogleOAuthStartGuard)
  @ApiOperation({ summary: "Start Google OAuth sign-in" })
  googleLogin() {
    // Passport owns the redirect to Google.
  }

  @Get("google/callback")
  @UseGuards(GoogleOAuthCallbackGuard)
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(
    @Req() request: Request & { user: GoogleIdentity },
    @Res() response: Response,
  ) {
    const ticket = await this.authService.createGoogleLoginTicket(request.user);
    const appUrl = this.config.get<string>("APP_URL", "http://localhost:5173");
    const callbackUrl = new URL("/auth/google/callback", appUrl);
    callbackUrl.searchParams.set("ticket", ticket);
    response.redirect(callbackUrl.toString());
  }

  @Post("google/exchange")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Exchange one-time Google sign-in ticket for JWTs" })
  async exchangeGoogleTicket(@Body() dto: ExchangeGoogleTicketDto) {
    return this.authService.exchangeGoogleLoginTicket(dto.ticket);
  }

  @Post("google/mobile")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sign in with a Google ID token issued by the native mobile SDK",
  })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid Google ID token" })
  @ApiResponse({
    status: 503,
    description: "Google sign-in is not configured",
  })
  async googleMobileSignIn(@Body() dto: GoogleMobileSignInDto) {
    return this.authService.signInWithGoogleIdToken(dto.idToken);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Tokens refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset email" })
  @ApiResponse({
    status: 200,
    description: "Reset email sent if account exists",
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.validateUser(user.id);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout current user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear any HTTP-only cookies if they exist
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return {
      message: "Logout successful",
      userId: user.id,
    };
  }
}
