import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  AttachTagDto,
  CreateTagDto,
  EntityType,
  TagResponseDto,
} from '../shared/models';

const TAGS_URL = `${environment.baseUrl}/api/tags`;

/**
 * Tags API. POST/GET /api/tags, GET/DELETE /api/tags/{id}, attach/detach.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateTagDto): Observable<TagResponseDto> {
    return this.http.post<TagResponseDto>(TAGS_URL, dto);
  }

  findAll(params?: {
    entityType?: EntityType;
    entityId?: string;
  }): Observable<TagResponseDto[]> {
    let httpParams = new HttpParams();
    if (params?.entityType != null)
      httpParams = httpParams.set('entityType', params.entityType);
    if (params?.entityId != null)
      httpParams = httpParams.set('entityId', params.entityId);
    return this.http.get<TagResponseDto[]>(TAGS_URL, { params: httpParams });
  }

  findById(id: string): Observable<TagResponseDto> {
    return this.http.get<TagResponseDto>(`${TAGS_URL}/${id}`);
  }

  delete(id: string): Observable<TagResponseDto> {
    return this.http.delete<TagResponseDto>(`${TAGS_URL}/${id}`);
  }

  attach(tagId: string, dto: AttachTagDto): Observable<void> {
    return this.http.post<void>(`${TAGS_URL}/${tagId}/attach`, dto);
  }

  detach(
    tagId: string,
    entityType: string,
    entityId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${TAGS_URL}/${tagId}/attach/${entityType}/${entityId}`
    );
  }
}
