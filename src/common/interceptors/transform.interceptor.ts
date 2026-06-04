import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Readable } from 'stream';

type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: string;
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const request = context
      .switchToHttp()
      .getRequest<{ path?: string; url?: string }>();
    const requestPath = request?.path ?? request?.url ?? '';
    const isSwaggerRoute =
      requestPath === '/docs' || requestPath.startsWith('/docs/');

    if (isSwaggerRoute) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: T) => {
        if (this.shouldBypassTransform(data)) {
          return data;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private shouldBypassTransform(data: unknown): boolean {
    return (
      data === undefined ||
      data instanceof StreamableFile ||
      data instanceof Buffer ||
      data instanceof Readable
    );
  }
}
