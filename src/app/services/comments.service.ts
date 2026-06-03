import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  CommentListResponseDto,
  CommentResponseDto,
  CreateCommentDto,
  EntityType,
} from '@app/shared/models';

const COMMENTS_URL = `${environment.baseUrl}/api/comments`;

/**
 * Comments API. POST/GET /api/comments, GET/DELETE /api/comments/{id}.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  create(dto: CreateCommentDto): Observable<CommentResponseDto> {
    return this.http.post<CommentResponseDto>(COMMENTS_URL, dto).pipe(this.errorHandler.catch());
  }

  findByEntity(params: {
    commentableType: EntityType;
    commentableId: string;
    page?: number;
    limit?: number;
  }): Observable<CommentListResponseDto> {
    let httpParams = new HttpParams()
      .set('commentableType', params.commentableType)
      .set('commentableId', params.commentableId);

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }

    return this.http
      .get<CommentListResponseDto>(COMMENTS_URL, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }

  findById(id: string): Observable<CommentResponseDto> {
    return this.http
      .get<CommentResponseDto>(`${COMMENTS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${COMMENTS_URL}/${id}`).pipe(this.errorHandler.catch());
  }
}
