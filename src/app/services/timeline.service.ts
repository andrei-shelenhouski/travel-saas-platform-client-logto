import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type { TimelineItemResponse } from '@app/shared/models';

export type TimelineEntity = 'leads' | 'offers' | 'bookings';

/**
 * Timeline API. GET /api/{entity}/{id}/timeline, POST/PUT/DELETE /api/{entity}/{id}/comments.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  getTimeline(
    entity: TimelineEntity,
    id: string,
    params?: { size?: number; before?: string },
  ): Observable<TimelineItemResponse[]> {
    let httpParams = new HttpParams();

    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size);
    }

    if (params?.before) {
      httpParams = httpParams.set('before', params.before);
    }

    return this.http
      .get<TimelineItemResponse[]>(`${environment.baseUrl}/api/${entity}/${id}/timeline`, {
        params: httpParams,
      })
      .pipe(this.errorHandler.catch());
  }

  addComment(entity: TimelineEntity, id: string, body: string): Observable<TimelineItemResponse> {
    return this.http
      .post<TimelineItemResponse>(`${environment.baseUrl}/api/${entity}/${id}/comments`, { body })
      .pipe(this.errorHandler.catch());
  }

  editComment(
    entity: TimelineEntity,
    entityId: string,
    commentId: string,
    body: string,
  ): Observable<TimelineItemResponse> {
    return this.http
      .put<TimelineItemResponse>(
        `${environment.baseUrl}/api/${entity}/${entityId}/comments/${commentId}`,
        { body },
      )
      .pipe(this.errorHandler.catch());
  }

  deleteComment(entity: TimelineEntity, entityId: string, commentId: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.baseUrl}/api/${entity}/${entityId}/comments/${commentId}`)
      .pipe(this.errorHandler.catch());
  }
}
