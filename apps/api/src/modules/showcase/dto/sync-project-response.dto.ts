/**
 * 项目同步响应 DTO
 */
export class SyncProjectResponseDto {
  /** 项目 ID */
  id: string;

  /** 星标数 */
  stars: number;

  /** Fork 数量 */
  forks: number;

  /** Open Issues 数量 */
  openIssues: number;

  /** 项目描述 */
  description: string;

  /** GitHub Topics 标签 */
  topics: string[];

  /** 最后同步时间 (ISO 8601) */
  lastSyncedAt: string;

  /** GitHub 仓库最后更新时间 (ISO 8601) */
  githubUpdatedAt: string;

  /** 同步状态: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' */
  lastSyncStatus: string;
}
