import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type {
  OrganizationSettingsResponseDto,
  UpdateOrganizationSettingsDto,
} from '@app/shared/models';

const ORGANIZATION_SETTINGS_URL = `${environment.baseUrl}/api/settings/organization`;
const ORGANIZATION_SETTINGS_LOGO_URL = `${ORGANIZATION_SETTINGS_URL}/logo`;

@Injectable({ providedIn: 'root' })
export class OrganizationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  get(): Observable<OrganizationSettingsResponseDto> {
    return this.http
      .get<OrganizationSettingsResponseDto>(ORGANIZATION_SETTINGS_URL)
      .pipe(this.errorHandler.catch());
  }

  update(dto: UpdateOrganizationSettingsDto): Observable<OrganizationSettingsResponseDto> {
    return this.http
      .put<OrganizationSettingsResponseDto>(ORGANIZATION_SETTINGS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  getLogo(): Observable<string> {
    return this.http
      .get(ORGANIZATION_SETTINGS_LOGO_URL, { responseType: 'text' })
      .pipe(this.errorHandler.catch());
  }

  uploadLogo(file: File): Observable<void> {
    const formData = new FormData();

    formData.append('file', file);

    return this.http
      .post<void>(ORGANIZATION_SETTINGS_LOGO_URL, formData)
      .pipe(this.errorHandler.catch());
  }
}
