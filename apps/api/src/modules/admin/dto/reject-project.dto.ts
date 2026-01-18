import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Reject Project DTO
 *
 * Request body for rejecting a submitted project.
 * Requires a reason to help the submitter improve their project.
 *
 * ## Validation Rules
 * - rejectionReason: Required, minimum 5 characters
 *
 * @example
 * ```typescript
 * {
 *   "rejectionReason": "项目描述不完整，请补充更多技术细节"
 * }
 * ```
 */
export class RejectProjectDto {
  /**
   * Reason for rejecting the project
   * This will be visible to the project submitter
   *
   * @minLength 5
   */
  @IsString()
  @IsNotEmpty({ message: '拒绝原因不能为空' })
  @MinLength(5, { message: '拒绝原因至少需要 5 个字符' })
  rejectionReason!: string;
}
