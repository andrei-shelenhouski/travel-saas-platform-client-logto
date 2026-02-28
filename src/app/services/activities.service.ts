import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import type {
  ActivityListResponseDto,
  ActivityResponseDto,
  CreateActivityDto,
  EntityType,
} from '../shared/models';

const ACTIVITIES_URL = `${environment.baseUrl}/api/activities`;

/**
 * Activities API. POST/GET /api/activities, GET /api/activities/{id}.
 * All methods require X-Organization-Id (set by orgAuthInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly http = inject(HttpClient);

  create(dto: CreateActivityDto): Observable<ActivityResponseDto> {
    return this.http.post<ActivityResponseDto>(ACTIVITIES_URL, dto);
  }

  findByEntity(params: {
    entityType: EntityType;
    entityId: string;
    page?: number;
    limit?: number;
  }): Observable<ActivityListResponseDto> {
    let httpParams = new HttpParams()
      .set('entityType', params.entityType)
      .set('entityId', params.entityId);
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<ActivityListResponseDto>(ACTIVITIES_URL, {
      params: httpParams,
    });
  }

  findById(id: string): Observable<ActivityResponseDto> {
    return this.http.get<ActivityResponseDto>(`${ACTIVITIES_URL}/${id}`);
  }
}
