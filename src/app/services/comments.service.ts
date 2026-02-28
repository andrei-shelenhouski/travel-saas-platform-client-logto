import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  CommentListResponseDto,
  CommentResponseDto,
  CreateCommentDto,
  EntityType,
} from '../shared/models';

const COMMENTS_URL = `${environment.baseUrl}/api/comments`;

/**
 * Comments API. POST/GET /api/comments, GET/DELETE /api/comments/{id}.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateCommentDto): Observable<CommentResponseDto> {
    return this.http.post<CommentResponseDto>(COMMENTS_URL, dto);
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
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<CommentListResponseDto>(COMMENTS_URL, {
      params: httpParams,
    });
  }

  findById(id: string): Observable<CommentResponseDto> {
    return this.http.get<CommentResponseDto>(`${COMMENTS_URL}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${COMMENTS_URL}/${id}`);
  }
}
