import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ShowcaseService,
  ProjectPreview,
  ProjectsListResponse,
  ProjectDetailResponse,
  RelatedProjectsResponse,
  MyProjectsListResponse,
} from './showcase.service';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { GetProjectsDto } from './dto/get-projects.dto';
import { GetProjectByIdDto } from './dto/get-project-by-id.dto';
import { MyProjectsQueryDto } from './dto/my-projects-query.dto';
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

  /**
   * 获取单个项目详情
   * GET /api/v1/showcase/projects/:id
   *
   * 无需认证 - 公开接口
   *
   * @param params 包含项目 ID
   * @returns 项目详细信息
   */
  @Get('projects/:id')
  @HttpCode(HttpStatus.OK)
  async getProjectById(
    @Param() params: GetProjectByIdDto,
  ): Promise<ApiResponse<ProjectDetailResponse>> {
    const project = await this.showcaseService.getProjectById(params.id);

    return {
      statusCode: HttpStatus.OK,
      message: '获取项目详情成功',
      data: project,
    };
  }

  /**
   * 获取相关项目推荐
   * GET /api/v1/showcase/projects/:id/related
   *
   * 无需认证 - 公开接口
   *
   * @param params 包含项目 ID
   * @returns 相关项目列表
   */
  @Get('projects/:id/related')
  @HttpCode(HttpStatus.OK)
  async getRelatedProjects(
    @Param() params: GetProjectByIdDto,
  ): Promise<ApiResponse<RelatedProjectsResponse>> {
    const result = await this.showcaseService.getRelatedProjects(params.id);

    return {
      statusCode: HttpStatus.OK,
      message: '获取相关项目成功',
      data: result,
    };
  }

  /**
   * 获取当前用户提交的项目列表
   * GET /api/v1/showcase/my-projects
   *
   * 需要认证
   *
   * @param params 查询参数（分页、状态筛选）
   * @param user 当前认证用户
   * @returns 用户的项目列表和分页信息
   */
  @Get('my-projects')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyProjects(
    @Query() params: MyProjectsQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApiResponse<MyProjectsListResponse>> {
    const result = await this.showcaseService.getMyProjects(user.userId, params);

    return {
      statusCode: HttpStatus.OK,
      message: '获取我的项目成功',
      data: result,
    };
  }

  /**
   * 删除用户提交的项目
   * DELETE /api/v1/showcase/my-projects/:id
   *
   * 需要认证
   * 只能删除状态为 PENDING 或 REJECTED 的项目
   * 已批准的项目不能删除
   *
   * @param id 项目 ID
   * @param user 当前认证用户
   * @returns 204 No Content
   * @throws 404 如果项目不存在
   * @throws 409 如果项目已批准或不是用户提交的
   */
  @Delete('my-projects/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyProject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    await this.showcaseService.deleteMyProject(id, user.userId);
  }
}
