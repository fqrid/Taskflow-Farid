import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Backward-compatible alias to avoid breaking existing imports.
export class JwtGuard extends JwtAuthGuard {}
