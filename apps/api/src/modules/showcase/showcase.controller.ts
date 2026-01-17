import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShowcaseService, ProjectPreview } from './showcase.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators';
import { ApiResponse } from '@bmad-starter-kit/shared';

/**
 * Showcase Controller
 * Base path: /api/v1/showcase
 *
 * Handles project submission and showcase-related endpoints
 */
@Controller('v1/showcase')
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  /**
   * Submit a GitHub project for review
   * POST /api/v1/showcase/submit
   *
   * Rate limited: 3 submissions per minute per user
   *
   * @param dto GitHub URL to submit
   * @param user Current authenticated user from JWT
   * @returns Created project with PENDING status
   * @throws 401 if not authenticated
   * @throws 400 if URL format is invalid
   * @throws 409 if project already exists
   * @throws 429 if rate limit exceeded
   * @throws 500 if GitHub fetch fails
   */
  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 3,        // 3 submissions
      ttl: 60000,      // per 60 seconds (1 minute)
    },
  })
  async submitProject(
    @Body() dto: SubmitProjectDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponse<ProjectPreview>> {
    const project = await this.showcaseService.submitProject(
      dto.githubUrl,
      user.userId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '项目提交成功，等待管理员审核',
      data: project,
    };
  }
}
