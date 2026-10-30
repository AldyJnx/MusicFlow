import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import {
  LinkArtistMembershipDto,
  ReviewArtistAccessRequestDto,
  ReviewArtistVerificationRequestDto,
} from "./artist-portal.dto";
import { ArtistPortalService } from "./artist-portal.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/artist-access-requests")
export class ArtistPortalAdminController {
  constructor(private readonly portal: ArtistPortalService) {}

  @Get()
  list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    return this.portal.listRequests({ page, pageSize, sort, q });
  }

  @Post("link")
  link(@Body() dto: LinkArtistMembershipDto) {
    return this.portal.linkMembership(dto);
  }

  @Patch(":requestId")
  review(
    @CurrentUser("id") adminId: string,
    @Param("requestId") requestId: string,
    @Body() dto: ReviewArtistAccessRequestDto,
  ) {
    return this.portal.reviewRequest(adminId, requestId, dto);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/artist-verification-requests")
export class ArtistVerificationAdminController {
  constructor(private readonly portal: ArtistPortalService) {}

  @Get()
  list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string,
    @Query("q") q?: string,
  ) {
    return this.portal.listVerificationRequests({ page, pageSize, sort, q });
  }

  @Patch(":requestId")
  review(
    @CurrentUser("id") adminId: string,
    @Param("requestId") requestId: string,
    @Body() dto: ReviewArtistVerificationRequestDto,
  ) {
    return this.portal.reviewVerificationRequest(adminId, requestId, dto);
  }
}
