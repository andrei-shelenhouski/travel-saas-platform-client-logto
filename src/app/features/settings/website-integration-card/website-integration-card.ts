import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { finalize } from 'rxjs';

import { IntegrationApiKeysService } from '@app/services/integration-api-keys.service';
import { PermissionService } from '@app/services/permission.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import type {
  IntegrationApiKeyResponseDto,
  UpdateIntegrationApiKeyRequestDto,
} from '@app/shared/models/organization.model';

import { ApiKeyCreatedDialogComponent } from './api-key-created-dialog.component';
import { CreateApiKeyDialogComponent } from './create-api-key-dialog.component';

export type WidgetFieldKey =
  | 'name'
  | 'phone'
  | 'email'
  | 'destination'
  | 'departDate'
  | 'returnDate'
  | 'paxCount'
  | 'notes';

export type WidgetFieldConfig = { visible: boolean; required: boolean };

export type WidgetConfig = {
  fields?: Partial<Record<WidgetFieldKey, WidgetFieldConfig>>;
  successAction?: 'message' | 'redirect';
  successMessage?: string;
  successRedirectUrl?: string;
};

type WidgetFieldRow = {
  key: WidgetFieldKey;
  label: string;
};

const WIDGET_FIELDS: WidgetFieldRow[] = [
  { key: 'name', label: 'Имя' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'destination', label: 'Направление' },
  { key: 'departDate', label: 'Дата выезда' },
  { key: 'returnDate', label: 'Дата возвращения' },
  { key: 'paxCount', label: 'Количество чел.' },
  { key: 'notes', label: 'Комментарий' },
];

const DEFAULT_WIDGET_CONFIG: Record<WidgetFieldKey, WidgetFieldConfig> = {
  name: { visible: true, required: false },
  phone: { visible: true, required: true },
  email: { visible: true, required: false },
  destination: { visible: true, required: false },
  departDate: { visible: true, required: false },
  returnDate: { visible: true, required: false },
  paxCount: { visible: true, required: false },
  notes: { visible: true, required: false },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

@Component({
  selector: 'app-website-integration-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTooltipModule,
    PageHeading,
  ],
  templateUrl: './website-integration-card.html',
  styleUrl: './website-integration-card.scss',
})
export class WebsiteIntegrationCardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiKeysService = inject(IntegrationApiKeysService);
  private readonly permissions = inject(PermissionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly pageTitle = 'Интеграции';
  protected readonly pageSubtitle =
    'Сайт и API — управляйте ключами доступа для интеграции формы заявки на ваш сайт.';

  protected readonly canManageIntegrations = this.permissions.canUpdateSettings;

  protected readonly loading = signal(true);
  protected readonly keys = signal<IntegrationApiKeyResponseDto[]>([]);

  /** ID of the key currently showing widget config panel. */
  protected readonly expandedKeyId = signal<string | null>(null);

  /** ID of the key currently in inline rename edit mode. */
  protected readonly renamingKeyId = signal<string | null>(null);
  protected readonly renameValue = signal('');

  /** IDs of keys whose widget config is currently being saved. */
  protected readonly savingWidgetConfigKeyId = signal<string | null>(null);

  protected readonly widgetFields = WIDGET_FIELDS;

  /**
   * Widget config form: per-field visible/required toggles + success action.
   * Recreated each time a panel is expanded.
   */
  protected widgetForm = this.buildWidgetForm(null);

  constructor() {
    this.load();
  }

  protected formatDate = formatDate;

  protected keyDisplayPrefix(key: IntegrationApiKeyResponseDto): string {
    return `${key.keyPrefix}••••`;
  }

  // ---- Load ----------------------------------------------------------------

  private load(): void {
    this.loading.set(true);
    this.apiKeysService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.keys.set(list),
      });
  }

  // ---- Create key ----------------------------------------------------------

  protected openCreateDialog(): void {
    const ref = this.dialog.open(CreateApiKeyDialogComponent, { width: '420px' });

    ref.afterClosed().subscribe((name: string | null | undefined) => {
      if (!name) {
        return;
      }

      this.apiKeysService.create({ name }).subscribe({
        next: (created) => {
          // Add to list without rawKey (cast to response dto shape)
          const asResponse: IntegrationApiKeyResponseDto = {
            id: created.id,
            name: created.name,
            keyPrefix: created.keyPrefix,
            widgetConfig: created.widgetConfig,
            lastUsedAt: created.lastUsedAt,
            createdAt: created.createdAt,
            revokedAt: null,
          };

          this.keys.update((list) => [asResponse, ...list]);

          // Show raw key dialog
          this.dialog.open(ApiKeyCreatedDialogComponent, {
            data: { rawKey: created.rawKey },
            width: '480px',
            disableClose: true,
          });
        },
      });
    });
  }

  // ---- Copy snippet --------------------------------------------------------

  protected copySnippet(key: IntegrationApiKeyResponseDto): void {
    const snippet = `<script src="https://cdn.navio.app/widget.js" data-key="${key.keyPrefix}"></script>`;

    navigator.clipboard.writeText(snippet).then(() => {
      this.snackBar.open('Сниппет скопирован.', 'Close', { duration: 3000 });
    });
  }

  // ---- Rename --------------------------------------------------------------

  protected startRename(key: IntegrationApiKeyResponseDto): void {
    this.renamingKeyId.set(key.id);
    this.renameValue.set(key.name);
  }

  protected cancelRename(): void {
    this.renamingKeyId.set(null);
    this.renameValue.set('');
  }

  protected saveRename(key: IntegrationApiKeyResponseDto): void {
    const newName = this.renameValue().trim();

    if (!newName) {
      return;
    }

    const dto: UpdateIntegrationApiKeyRequestDto = { name: newName };

    this.apiKeysService.update(key.id, dto).subscribe({
      next: (updated) => {
        this.keys.update((list) => list.map((k) => (k.id === updated.id ? updated : k)));
        this.renamingKeyId.set(null);
        this.renameValue.set('');
      },
    });
  }

  // ---- Revoke --------------------------------------------------------------

  protected confirmRevoke(key: IntegrationApiKeyResponseDto): void {
    this.confirmDialog
      .open({
        title: 'Отозвать ключ?',
        message: 'Ключ будет отозван. Он перестанет работать немедленно.',
        confirmLabel: 'Отозвать',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.revokeKey(key);
        }
      });
  }

  private revokeKey(key: IntegrationApiKeyResponseDto): void {
    this.apiKeysService.revoke(key.id).subscribe({
      next: () => {
        this.keys.update((list) => list.filter((k) => k.id !== key.id));

        if (this.expandedKeyId() === key.id) {
          this.expandedKeyId.set(null);
        }

        this.snackBar.open('Ключ отозван.', 'Close', { duration: 3000 });
      },
    });
  }

  // ---- Widget config panel -------------------------------------------------

  protected toggleWidgetPanel(key: IntegrationApiKeyResponseDto): void {
    if (this.expandedKeyId() === key.id) {
      this.expandedKeyId.set(null);

      return;
    }

    this.expandedKeyId.set(key.id);
    this.widgetForm = this.buildWidgetForm(key.widgetConfig);
  }

  protected collapseWidgetPanel(): void {
    this.expandedKeyId.set(null);
  }

  protected onVisibleToggle(fieldKey: WidgetFieldKey, visible: boolean): void {
    const group = this.widgetForm.controls.fields.controls[fieldKey];

    if (!visible) {
      group.controls.required.setValue(false);
    }
  }

  protected saveWidgetConfig(key: IntegrationApiKeyResponseDto): void {
    // Validate: at least one of phone or email must be visible
    const fields = this.widgetForm.controls.fields.controls;

    if (!fields.phone.controls.visible.value && !fields.email.controls.visible.value) {
      this.snackBar.open('Телефон или Email должен быть видимым.', 'Close', { duration: 4000 });

      return;
    }

    const rawFields = this.widgetForm.controls.fields.getRawValue();
    const fieldConfig: Partial<Record<WidgetFieldKey, WidgetFieldConfig>> = {};

    for (const fk of WIDGET_FIELDS.map((f) => f.key)) {
      fieldConfig[fk] = rawFields[fk];
    }

    const successAction = this.widgetForm.controls.successAction.value as 'message' | 'redirect';
    const widgetConfig: WidgetConfig = {
      fields: fieldConfig,
      successAction,
      successMessage:
        successAction === 'message'
          ? (this.widgetForm.controls.successMessage.value || undefined)
          : undefined,
      successRedirectUrl:
        successAction === 'redirect'
          ? (this.widgetForm.controls.successRedirectUrl.value || undefined)
          : undefined,
    };

    const dto: UpdateIntegrationApiKeyRequestDto = {
      widgetConfig: widgetConfig as Record<string, unknown>,
    };

    this.savingWidgetConfigKeyId.set(key.id);

    this.apiKeysService
      .update(key.id, dto)
      .pipe(finalize(() => this.savingWidgetConfigKeyId.set(null)))
      .subscribe({
        next: (updated) => {
          this.keys.update((list) => list.map((k) => (k.id === updated.id ? updated : k)));
          this.expandedKeyId.set(null);
          this.snackBar.open('Конфигурация виджета сохранена.', 'Close', { duration: 3000 });
        },
      });
  }

  // ---- Helpers -------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private buildWidgetForm(rawConfig: Record<string, unknown> | null) {
    const config = this.parseWidgetConfig(rawConfig);

    const fieldGroups = {} as Record<WidgetFieldKey, ReturnType<typeof this.buildFieldGroup>>;

    for (const { key } of WIDGET_FIELDS) {
      const defaults = DEFAULT_WIDGET_CONFIG[key];
      const saved = config?.fields?.[key];
      const visible = saved?.visible ?? defaults.visible;
      const required = saved?.required ?? defaults.required;

      fieldGroups[key] = this.buildFieldGroup(visible, required);
    }

    const successAction = config?.successAction ?? 'message';
    const successMessage =
      config?.successMessage ?? 'Спасибо! Мы свяжемся с вами в ближайшее время.';
    const successRedirectUrl = config?.successRedirectUrl ?? '';

    return this.fb.nonNullable.group({
      fields: this.fb.nonNullable.group(fieldGroups),
      successAction: [successAction],
      successMessage: [successMessage],
      successRedirectUrl: [successRedirectUrl, [Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private buildFieldGroup(visible: boolean, required: boolean) {
    return this.fb.nonNullable.group({
      visible: [visible],
      required: [required],
    });
  }

  private parseWidgetConfig(raw: Record<string, unknown> | null): WidgetConfig | null {
    if (!raw) {
      return null;
    }

    return raw as WidgetConfig;
  }
}
