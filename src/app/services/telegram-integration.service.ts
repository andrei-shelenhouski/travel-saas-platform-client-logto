import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';

import type {
  TelegramPairingStatusResponseDto,
  TelegramPairingTokenResponseDto,
} from '@app/shared/models';

const TELEGRAM_PAIRING_TOKENS_URL = `${environment.baseUrl}/api/telegram/pairing-tokens`;
const TELEGRAM_PAIRINGS_ME_URL = `${environment.baseUrl}/api/telegram/pairings/me`;

@Injectable({ providedIn: 'root' })
export class TelegramIntegrationService {
  private readonly http = inject(HttpClient);

  createPairingToken(): Observable<TelegramPairingTokenResponseDto> {
    return this.http.post<TelegramPairingTokenResponseDto>(TELEGRAM_PAIRING_TOKENS_URL, {});
  }

  getMyPairing(): Observable<TelegramPairingStatusResponseDto> {
    return this.http.get<TelegramPairingStatusResponseDto>(TELEGRAM_PAIRINGS_ME_URL);
  }

  disconnectMyPairing(): Observable<void> {
    return this.http.delete<void>(TELEGRAM_PAIRINGS_ME_URL);
  }
}
