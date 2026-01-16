import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Refresh Auth Guard
 * Uses JwtRefreshStrategy to validate refresh tokens from HttpOnly cookies
 */
@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
