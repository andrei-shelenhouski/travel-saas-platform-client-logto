import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import QRCode from 'qrcode';

import { TelegramIntegrationService } from '@app/services/telegram-integration.service';

import type {
  TelegramPairingStatusResponseDto,
  TelegramPairingTokenResponseDto,
} from '@app/shared/models';

type TelegramPairingModalData = {
  token: TelegramPairingTokenResponseDto;
};

const TOKEN_TTL_SECONDS = 15 * 60;
const POLLING_INTERVAL_MS = 3000;
const COPIED_STATE_MS = 2000;

@Component({
  selector: 'app-telegram-pairing-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './telegram-pairing-modal.html',
  styleUrl: './telegram-pairing-modal.scss',
})
export class TelegramPairingModalComponent implements OnDestroy {
  private readonly dialogRef = inject(
    MatDialogRef<TelegramPairingModalComponent, TelegramPairingStatusResponseDto | null>,
  );
  private readonly data = inject<TelegramPairingModalData>(MAT_DIALOG_DATA);
  private readonly telegramService = inject(TelegramIntegrationService);

  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  private pollingTimerId: ReturnType<typeof setInterval> | null = null;
  private copiedTimerId: ReturnType<typeof setTimeout> | null = null;
  private pollingInFlight = false;

  protected readonly token = signal('');
  protected readonly expiresAt = signal<string | null>(null);
  protected readonly remainingSeconds = signal(TOKEN_TTL_SECONDS);
  protected readonly qrCodeDataUrl = signal<string | null>(null);

  protected readonly loadingQr = signal(false);
  protected readonly regenerating = signal(false);
  protected readonly copying = signal(false);
  protected readonly copied = signal(false);
  protected readonly inlineError = signal<string | null>(null);

  protected readonly isExpired = computed(() => this.remainingSeconds() <= 0);
  protected readonly deepLink = computed(() => `https://t.me/TravelOpsBot?start=${this.token()}`);
  protected readonly startCommand = computed(() => `/start ${this.token()}`);
  protected readonly countdownLabel = computed(() => this.formatCountdown(this.remainingSeconds()));

  constructor() {
    this.applyToken(this.data.token);
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.stopPolling();

    if (this.copiedTimerId) {
      clearTimeout(this.copiedTimerId);
      this.copiedTimerId = null;
    }
  }

  protected close(): void {
    this.dialogRef.close(null);
  }

  protected regenerateToken(): void {
    if (this.regenerating()) {
      return;
    }

    this.inlineError.set(null);
    this.regenerating.set(true);

    this.telegramService.createPairingToken().subscribe({
      next: (response) => {
        this.applyToken(response);
        this.regenerating.set(false);
      },
      error: (error: unknown) => {
        this.inlineError.set(
          this.resolveErrorMessage(error, 'Could not regenerate Telegram token.'),
        );
        this.regenerating.set(false);
      },
    });
  }

  protected copyStartCommand(): void {
    if (this.copying()) {
      return;
    }

    this.copying.set(true);

    navigator.clipboard
      .writeText(this.startCommand())
      .then(() => {
        this.copying.set(false);
        this.copied.set(true);

        if (this.copiedTimerId) {
          clearTimeout(this.copiedTimerId);
        }

        this.copiedTimerId = setTimeout(() => {
          this.copied.set(false);
          this.copiedTimerId = null;
        }, COPIED_STATE_MS);
      })
      .catch(() => {
        this.copying.set(false);
        this.inlineError.set('Clipboard access failed. Please copy the token manually.');
      });
  }

  private applyToken(response: TelegramPairingTokenResponseDto): void {
    this.token.set(response.token);

    const expiresAt = this.resolveExpiresAt(response.expiresAt ?? null);

    this.expiresAt.set(expiresAt);
    this.updateRemainingSeconds();
    this.startCountdown();
    this.renderQrCode();
  }

  private resolveExpiresAt(expiresAt: string | null): string {
    if (expiresAt) {
      return expiresAt;
    }

    return new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  }

  private startCountdown(): void {
    this.stopCountdown();

    this.countdownTimerId = setInterval(() => {
      this.updateRemainingSeconds();

      if (this.remainingSeconds() === 0) {
        this.renderQrCode();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (!this.countdownTimerId) {
      return;
    }

    clearInterval(this.countdownTimerId);
    this.countdownTimerId = null;
  }

  private updateRemainingSeconds(): void {
    const expiresAt = this.expiresAt();

    if (!expiresAt) {
      this.remainingSeconds.set(TOKEN_TTL_SECONDS);

      return;
    }

    const expiresAtMs = Date.parse(expiresAt);

    if (Number.isNaN(expiresAtMs)) {
      this.remainingSeconds.set(TOKEN_TTL_SECONDS);

      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));

    this.remainingSeconds.set(secondsLeft);
  }

  private renderQrCode(): void {
    this.loadingQr.set(true);

    QRCode.toDataURL(this.deepLink(), {
      width: 220,
      margin: 1,
      color: {
        dark: this.isExpired() ? '#94a3b8' : '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url: string) => {
        this.qrCodeDataUrl.set(url);
        this.loadingQr.set(false);
      })
      .catch(() => {
        this.qrCodeDataUrl.set(null);
        this.loadingQr.set(false);
        this.inlineError.set('Could not render QR code.');
      });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollPairingStatus();

    this.pollingTimerId = setInterval(() => {
      this.pollPairingStatus();
    }, POLLING_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (!this.pollingTimerId) {
      return;
    }

    clearInterval(this.pollingTimerId);
    this.pollingTimerId = null;
  }

  private pollPairingStatus(): void {
    if (this.pollingInFlight) {
      return;
    }

    this.pollingInFlight = true;

    this.telegramService.getMyPairing().subscribe({
      next: (response) => {
        this.pollingInFlight = false;

        if (response.status === 'paired') {
          this.dialogRef.close(response);
        }
      },
      error: () => {
        this.pollingInFlight = false;
      },
    });
  }

  private formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const rest = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${rest}`;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const errorMessageValue = error.error?.message;
      const errorFieldValue = error.error?.error;
      let apiMessage: string | null = null;

      if (typeof errorMessageValue === 'string') {
        apiMessage = errorMessageValue;
      } else if (typeof errorFieldValue === 'string') {
        apiMessage = errorFieldValue;
      }

      if (apiMessage) {
        return apiMessage;
      }
    }

    return fallback;
  }
}
