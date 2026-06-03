import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  AttachTagDto,
  CreateTagDto,
  EntityType,
  PaginatedTagResponseDto,
  TagResponseDto,
} from '@app/shared/models';

const TAGS_URL = `${environment.baseUrl}/api/tags`;

/**
 * Tags API. POST/GET /api/tags, GET/DELETE /api/tags/{id}, attach/detach.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  create(dto: CreateTagDto): Observable<TagResponseDto> {
    return this.http.post<TagResponseDto>(TAGS_URL, dto).pipe(this.errorHandler.catch());
  }

  findAll(params?: { entityType?: EntityType; entityId?: string }): Observable<TagResponseDto[]> {
    let httpParams = new HttpParams();

    if (params?.entityType !== undefined) {
      httpParams = httpParams.set('entityType', params.entityType);
    }

    if (params?.entityId !== undefined) {
      httpParams = httpParams.set('entityId', params.entityId);
    }

    return this.http.get<PaginatedTagResponseDto>(TAGS_URL, { params: httpParams }).pipe(
      this.errorHandler.catch(),
      map((res) => res.items),
    );
  }

  findById(id: string): Observable<TagResponseDto> {
    return this.http.get<TagResponseDto>(`${TAGS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${TAGS_URL}/${id}`).pipe(this.errorHandler.catch());
  }

  attach(tagId: string, dto: AttachTagDto): Observable<void> {
    return this.http.post<void>(`${TAGS_URL}/${tagId}/attach`, dto).pipe(this.errorHandler.catch());
  }

  detach(tagId: string, entityType: string, entityId: string): Observable<void> {
    return this.http
      .delete<void>(`${TAGS_URL}/${tagId}/attach/${entityType}/${entityId}`)
      .pipe(this.errorHandler.catch());
  }
}
