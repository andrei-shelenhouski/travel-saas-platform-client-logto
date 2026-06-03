import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { finalize } from 'rxjs';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { TourvisorIntegrationService } from '@app/services/tourvisor-integration.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { OrgRole } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import type {
  TourvisorIntegrationSettingsResponseDto,
  UpdateTourvisorIntegrationSettingsDto,
} from '@app/shared/models';

type AgentOption = {
  id: string;
  name: string;
};

const DEFAULT_INGEST_ORDER_TYPES = [0, 1, 2, 3, 4, 5, 6];
const SALES_ROLES = new Set<string>([OrgRole.ADMIN, OrgRole.AGENT, OrgRole.SALES_AGENT]);

@Component({
  selector: 'app-tourvisor-integration-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ...MAT_FORM_BUTTONS,
    PageHeading,
  ],
  templateUrl: './tourvisor-integration-card.html',
  styleUrl: './tourvisor-integration-card.scss',
})
export class TourvisorIntegrationCardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly permissions = inject(PermissionService);
  private readonly integrationService = inject(TourvisorIntegrationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly relativeTimeFormatter = new Intl.RelativeTimeFormat(this.locale, {
    numeric: 'auto',
  });

  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;

  protected readonly pageTitle = 'Интеграции';
  protected readonly pageSubtitle = 'Подключайте и управляйте внешними провайдерами лидов.';
  protected readonly authkeyHelpText =
    'Откройте настройки аккаунта TourVisor и скопируйте authkey из настроек интеграционного доступа.';

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly syncing = signal(false);
  protected readonly testing = signal(false);
  protected readonly disconnecting = signal(false);

  protected readonly inlineError = signal<string | null>(null);
  protected readonly connectionTestState = signal<'valid' | 'invalid' | null>(null);
  protected readonly connectionTestMessage = signal<string | null>(null);

  protected readonly settings = signal<TourvisorIntegrationSettingsResponseDto | null>(null);
  protected readonly editingConnectedSettings = signal(false);
  protected readonly agentOptions = signal<AgentOption[]>([]);

  protected readonly isAdmin = this.permissions.isAdmin;
  protected readonly isConnected = computed(() => this.settings()?.connected ?? false);
  protected readonly showSettingsForm = computed(
    () => !this.isConnected() || this.editingConnectedSettings(),
  );

  protected readonly connectedStatusLine = computed(() => {
    const currentSettings = this.settings();

    if (!currentSettings?.connected) {
      return '';
    }

    if (!currentSettings.lastPolledAt) {
      return 'Синхронизация не выполнялась — нажмите «Синхронизировать»';
    }

    const relative = this.formatRelativeTime(currentSettings.lastPolledAt);

    return `Последняя синхронизация: ${relative}`;
  });

  protected readonly selectedAgentLabel = computed(() => {
    const defaultAgentId = this.settings()?.defaultAgentId ?? '';

    if (!defaultAgentId) {
      return 'Не назначен';
    }

    const selectedAgent = this.agentOptions().find((agent) => agent.id === defaultAgentId);

    if (!selectedAgent) {
      return 'Неизвестный агент';
    }

    return selectedAgent.name;
  });

  protected readonly ingestOrderTypesLabel = computed(() => {
    const ingestOrderTypes = this.settings()?.ingestOrderTypes ?? [];

    if (ingestOrderTypes.length === 0) {
      return 'Нет';
    }

    if (this.hasAllOrderTypesSelected(ingestOrderTypes)) {
      return 'Все';
    }

    return ingestOrderTypes.join(', ');
  });

  protected readonly form = this.fb.nonNullable.group({
    authkey: ['', [Validators.required]],
    defaultAgentId: [''],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearRefreshTimer();
    });

    if (!this.isAdmin()) {
      this.loading.set(false);

      return;
    }

    this.loadAgentOptions();
    this.loadSettings();
  }

  protected openEditForm(): void {
    this.editingConnectedSettings.set(true);
    this.inlineError.set(null);
    this.connectionTestState.set(null);
    this.connectionTestMessage.set(null);
    this.form.controls.authkey.setValue('');
    this.form.controls.defaultAgentId.setValue(this.settings()?.defaultAgentId ?? '');
  }

  protected cancelEditForm(): void {
    this.editingConnectedSettings.set(false);
    this.inlineError.set(null);
    this.connectionTestState.set(null);
    this.connectionTestMessage.set(null);
    this.form.reset({
      authkey: '',
      defaultAgentId: this.settings()?.defaultAgentId ?? '',
    });
  }

  protected saveIntegrationSettings(): void {
    this.inlineError.set(null);
    this.connectionTestState.set(null);
    this.connectionTestMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const formValue = this.form.getRawValue();
    const wasConnected = this.isConnected();
    const authkey = formValue.authkey.trim();
    const defaultAgentId = formValue.defaultAgentId.trim();

    if (!authkey) {
      this.form.controls.authkey.setErrors({ required: true });
      this.form.controls.authkey.markAsTouched();

      return;
    }

    const dto: UpdateTourvisorIntegrationSettingsDto = {
      authkey,
      defaultAgentId: defaultAgentId ? defaultAgentId : null,
      ingestOrderTypes: this.settings()?.ingestOrderTypes ?? DEFAULT_INGEST_ORDER_TYPES,
    };

    this.saving.set(true);

    this.integrationService
      .upsertSettings(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (settingsResponse) => {
          const normalized = this.normalizeSettings(settingsResponse);

          this.settings.set(normalized);
          this.editingConnectedSettings.set(false);
          this.form.reset({
            authkey: '',
            defaultAgentId: normalized.defaultAgentId ?? '',
          });
          this.snackBar.open(
            wasConnected ? 'Настройки TourVisor обновлены.' : 'TourVisor успешно подключён.',
            'Close',
            { duration: 4000 },
          );
        },
        error: (error: unknown) => {
          this.inlineError.set(this.getErrorMessage(error, 'Не удалось подключить TourVisor.'));
        },
      });
  }

  protected testStoredConnection(): void {
    if (!this.isConnected()) {
      return;
    }

    this.inlineError.set(null);
    this.connectionTestState.set(null);
    this.connectionTestMessage.set(null);
    this.testing.set(true);

    this.integrationService
      .testConnection()
      .pipe(finalize(() => this.testing.set(false)))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            this.connectionTestState.set('valid');

            return;
          }

          this.connectionTestState.set('invalid');
          this.connectionTestMessage.set(
            response.error ||
              'Недействительный authkey. Пожалуйста, переподключитесь с действительным ключом.',
          );
        },
        error: (error: unknown) => {
          this.connectionTestState.set('invalid');
          this.connectionTestMessage.set(
            this.getErrorMessage(error, 'Не удалось проверить подключение TourVisor.'),
          );
        },
      });
  }

  protected syncNow(): void {
    this.inlineError.set(null);
    this.syncing.set(true);

    this.integrationService
      .syncNow()
      .pipe(finalize(() => this.syncing.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Синхронизация TourVisor запущена.', 'Close', { duration: 4000 });
          this.scheduleSettingsRefresh();
        },
        error: (error: unknown) => {
          this.inlineError.set(
            this.getErrorMessage(error, 'Не удалось запустить синхронизацию TourVisor.'),
          );
        },
      });
  }

  protected confirmDisconnect(): void {
    this.inlineError.set(null);

    this.confirmDialog
      .open({
        title: 'Отключить TourVisor?',
        message: 'Новые заявки больше не будут импортироваться.',
        confirmLabel: 'Отключить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.disconnect();
        }
      });
  }

  private disconnect(): void {
    this.disconnecting.set(true);

    this.integrationService
      .disconnect()
      .pipe(finalize(() => this.disconnecting.set(false)))
      .subscribe({
        next: () => {
          this.settings.set({ connected: false });
          this.editingConnectedSettings.set(false);
          this.form.reset({
            authkey: '',
            defaultAgentId: '',
          });
          this.connectionTestState.set(null);
          this.connectionTestMessage.set(null);
          this.snackBar.open('TourVisor отключён.', 'Close', { duration: 4000 });
        },
        error: (error: unknown) => {
          this.inlineError.set(this.getErrorMessage(error, 'Не удалось отключить TourVisor.'));
        },
      });
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.inlineError.set(null);

    this.integrationService
      .getSettings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settingsResponse) => {
          const normalized = this.normalizeSettings(settingsResponse);

          this.settings.set(normalized);
          this.form.controls.defaultAgentId.setValue(normalized.defaultAgentId ?? '');
        },
        error: (error: unknown) => {
          this.inlineError.set(
            this.getErrorMessage(error, 'Не удалось загрузить настройки интеграции TourVisor.'),
          );
        },
      });
  }

  private loadAgentOptions(): void {
    this.membersService.findAll().subscribe({
      next: (members) => {
        const options = members
          .filter((member) => member.active && SALES_ROLES.has(member.role))
          .map((member) => ({
            id: member.userId,
            name: member.name,
          }))
          .sort((left, right) => left.name.localeCompare(right.name));

        this.agentOptions.set(options);
      },
      error: (error: unknown) => {
        this.agentOptions.set([]);
        this.snackBar.open(
          this.getErrorMessage(error, 'Не удалось загрузить список агентов.'),
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  private scheduleSettingsRefresh(): void {
    this.clearRefreshTimer();

    this.refreshTimerId = setTimeout(() => {
      this.loadSettings();
    }, 3000);
  }

  private clearRefreshTimer(): void {
    if (!this.refreshTimerId) {
      return;
    }

    clearTimeout(this.refreshTimerId);
    this.refreshTimerId = null;
  }

  private normalizeSettings(
    settings: TourvisorIntegrationSettingsResponseDto,
  ): TourvisorIntegrationSettingsResponseDto {
    if (!settings.connected) {
      return { connected: false };
    }

    return {
      connected: true,
      defaultAgentId: settings.defaultAgentId ?? null,
      lastPolledAt: settings.lastPolledAt ?? null,
      lastWebhookAt: settings.lastWebhookAt ?? null,
      ingestOrderTypes: settings.ingestOrderTypes ?? DEFAULT_INGEST_ORDER_TYPES,
    };
  }

  private hasAllOrderTypesSelected(ingestOrderTypes: number[]): boolean {
    const uniqueSorted = [...new Set(ingestOrderTypes)].sort((left, right) => left - right);

    if (uniqueSorted.length !== DEFAULT_INGEST_ORDER_TYPES.length) {
      return false;
    }

    return uniqueSorted.every((value, index) => value === DEFAULT_INGEST_ORDER_TYPES[index]);
  }

  private formatRelativeTime(timestamp: string): string {
    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'unknown';
    }

    const minuteInMs = 60_000;
    const hourInMs = 3_600_000;
    const dayInMs = 86_400_000;
    const diffInMs = parsedDate.getTime() - Date.now();
    const absDiffInMs = Math.abs(diffInMs);

    if (absDiffInMs < minuteInMs) {
      return 'только что';
    }

    if (absDiffInMs < hourInMs) {
      return this.relativeTimeFormatter.format(Math.round(diffInMs / minuteInMs), 'minute');
    }

    if (absDiffInMs < dayInMs) {
      return this.relativeTimeFormatter.format(Math.round(diffInMs / hourInMs), 'hour');
    }

    return this.relativeTimeFormatter.format(Math.round(diffInMs / dayInMs), 'day');
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      let apiMessage: string | null = null;

      if (typeof error.error?.message === 'string') {
        apiMessage = error.error.message;
      } else if (typeof error.error?.error === 'string') {
        apiMessage = error.error.error;
      }

      if (apiMessage) {
        return apiMessage;
      }

      if (error.status === 0) {
        return 'Ошибка сети. Пожалуйста, попробуйте снова.';
      }
    }

    return fallback;
  }
}
