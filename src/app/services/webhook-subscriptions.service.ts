import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import type { CreateWebhookRequest, WebhookSubscription } from '@app/shared/models';

const WEBHOOK_SUBSCRIPTIONS_URL = `${environment.baseUrl}/api/webhook-subscriptions`;

@Injectable({ providedIn: 'root' })
export class WebhookSubscriptionsService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ApiErrorHandlerService);

  list(): Observable<WebhookSubscription[]> {
    return this.http
      .get<WebhookSubscription[]>(WEBHOOK_SUBSCRIPTIONS_URL)
      .pipe(this.errorHandler.catch());
  }

  create(dto: CreateWebhookRequest): Observable<WebhookSubscription> {
    return this.http
      .post<WebhookSubscription>(WEBHOOK_SUBSCRIPTIONS_URL, dto)
      .pipe(this.errorHandler.catch());
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${WEBHOOK_SUBSCRIPTIONS_URL}/${id}`)
      .pipe(this.errorHandler.catch());
  }
}
