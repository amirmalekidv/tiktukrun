import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { serializeBigInts } from '../utils/bigint';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success field (manual response), return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return serializeBigInts(data);
        }

        // If data has data + meta structure
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return serializeBigInts({
            success: true,
            data: data.data,
            meta: data.meta,
          });
        }

        return serializeBigInts({
          success: true,
          data: data,
        });
      }),
    );
  }
}
