/* eslint-disable complexity */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { finalize } from 'rxjs';

import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';

import type {
  OrganizationCurrency,
  OrganizationLanguage,
  OrganizationSettingsResponseDto,
} from '@app/shared/models';
import type { PendingChangesComponent } from '@app/guards/pending-changes.guard';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-company-profile',
  templateUrl: './company-profile.html',
  styleUrl: './company-profile.scss',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    PageHeading,
  ],
})
export class CompanyProfileComponent implements PendingChangesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(OrganizationSettingsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly logoUrl = signal<string | null>(null);
  private currentBlobUrl: string | null = null;

  readonly form = this.fb.nonNullable.group({
    // Section 1 — Основная информация
    name: ['', [Validators.required, Validators.maxLength(120)]],
    legalName: ['', Validators.maxLength(200)],
    legalAddress: [''],
    unp: ['', Validators.pattern(/^\d{9}$/)],
    okpo: [''],
    phone: [''],
    email: ['', Validators.email],
    website: [''],
    // Section 2 — Банковские реквизиты
    iban: [''],
    bankName: [''],
    bik: [''],
    // Section 3 — Реквизиты для документов
    directorName: ['', Validators.required],
    directorTitle: ['', Validators.required],
    // Section 4 — Настройки по умолчанию
    defaultCurrency: ['BYN' as OrganizationCurrency, Validators.required],
    defaultLanguage: ['RU' as OrganizationLanguage, Validators.required],
    offerNumberPrefix: ['OF-'],
    invoicePrefix: ['INV-'],
    offerValidityDays: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
    leadExpiryDays: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
    defaultPaymentTerms: [''],
    defaultCommissionPct: [10.0, [Validators.min(0), Validators.max(100)]],
  });

  protected readonly currencies = [
    { value: 'BYN' as OrganizationCurrency, label: 'BYN (Белорусский рубль)' },
    { value: 'USD' as OrganizationCurrency, label: 'USD (Доллар США)' },
    { value: 'EUR' as OrganizationCurrency, label: 'EUR (Евро)' },
  ];

  protected readonly languages = [
    { value: 'RU' as OrganizationLanguage, label: 'Русский' },
    { value: 'EN' as OrganizationLanguage, label: 'English' },
  ];

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.loading.set(true);

    this.settingsService
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.patchFormWithSettings(data);

          if (data.logoUrl) {
            this.logoUrl.set(data.logoUrl);
          }
        },
        error: (err) => {
          this.snackBar.open(
            'Ошибка загрузки настроек: ' + (err.error?.message || err.message),
            'Закрыть',
            { duration: 5000 },
          );
        },
      });
  }

  private patchFormWithSettings(data: OrganizationSettingsResponseDto): void {
    this.form.patchValue({
      name: data.name ?? '',
      legalName: data.legalName ?? '',
      legalAddress: data.legalAddress ?? '',
      unp: data.unp ?? '',
      okpo: data.okpo ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      website: data.website ?? '',
      iban: data.iban ?? '',
      bankName: data.bankName ?? '',
      bik: data.bik ?? '',
      directorName: data.directorName ?? '',
      directorTitle: data.directorTitle ?? '',
      defaultCurrency: (data.defaultCurrency ?? 'BYN') as OrganizationCurrency,
      defaultLanguage: (data.defaultLanguage ?? 'RU') as OrganizationLanguage,
      offerNumberPrefix: data.offerNumberPrefix ?? 'OF-',
      invoicePrefix: data.invoicePrefix ?? 'INV-',
      offerValidityDays: data.offerValidityDays ?? 7,
      leadExpiryDays: data.leadExpiryDays ?? 30,
      defaultPaymentTerms: data.defaultPaymentTerms ?? '',
      defaultCommissionPct: data.defaultCommissionPct ?? 10.0,
    });

    this.form.markAsPristine();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file size (2 MB max)
    const maxSizeBytes = 2 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      this.snackBar.open('Файл слишком большой. Максимум 2 МБ', 'Закрыть', { duration: 5000 });
      input.value = '';

      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg'];

    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Неверный формат файла. Поддерживаются PNG и JPEG', 'Закрыть', {
        duration: 5000,
      });
      input.value = '';

      return;
    }

    // Immediate upload on file selection
    this.settingsService.uploadLogo(file).subscribe({
      next: () => {
        // Revoke previous blob URL to avoid memory leak
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
        }

        this.currentBlobUrl = URL.createObjectURL(file);
        this.logoUrl.set(this.currentBlobUrl);
        this.snackBar.open('Логотип обновлён', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Ошибка загрузки: ' + (err.error?.message || err.message), 'Закрыть', {
          duration: 5000,
        });
      },
    });

    // Reset input to allow re-selecting the same file
    input.value = '';
  }

  protected deleteLogo(): void {
    // TODO: Backend endpoint for DELETE /api/settings/organization/logo not yet available
    // This method is currently disabled in the template
    this.snackBar.open(
      'Удаление логотипа временно недоступно. Обратитесь к администратору.',
      'Закрыть',
      { duration: 5000 },
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);

    this.settingsService
      .update(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          this.snackBar.open('Настройки сохранены', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(
            'Ошибка сохранения: ' + (err.error?.message || err.message),
            'Закрыть',
            {
              duration: 5000,
            },
          );
        },
      });
  }

  hasUnsavedChanges(): boolean {
    return !this.form.pristine;
  }
}
