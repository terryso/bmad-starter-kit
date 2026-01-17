import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShowcaseService, ProjectPreview, ProjectsListResponse } from './showcase.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { GetProjectsDto } from './dto/get-projects.dto';
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

  /**
   * 获取公开展示的项目列表
   * GET /api/v1/showcase/projects
   *
   * 无需认证 - 公开接口
   *
   * @param params 查询参数（分页、筛选、排序）
   * @returns 项目列表和分页信息
   */
  @Get('projects')
  @HttpCode(HttpStatus.OK)
  async getProjects(
    @Query() params: GetProjectsDto,
  ): Promise<ApiResponse<ProjectsListResponse>> {
    const result = await this.showcaseService.getProjects(params);

    return {
      statusCode: HttpStatus.OK,
      message: '获取项目列表成功',
      data: result,
    };
  }
}
