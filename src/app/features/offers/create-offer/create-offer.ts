import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { startWith } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  calculateNights,
  calculateOfferPricing,
  formatDateWithOffset,
  mapAccommodationsForDto,
  mapServicesForDto,
  toSafeNumber,
} from '@app/features/offers/offer-builder.utils';
import { OfferPdfPreviewModalComponent } from '@app/features/offers/offer-pdf-preview-modal/offer-pdf-preview-modal';
import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { FormSectionComponent, PageContentComponent } from '@app/shared/components';
import {
  MAT_BUTTON_TOGGLES,
  MAT_BUTTONS,
  MAT_DIALOG,
  MAT_FORM_BUTTONS,
  MAT_ICONS,
} from '@app/shared/material-imports';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MEAL_PLAN_OPTIONS, SERVICE_TYPE_OPTIONS } from '@app/shared/models';

import type { CreateOfferDto, LeadResponseDto, UpdateOfferDto } from '@app/shared/models';
type AccommodationFormGroup = FormGroup<{
  hotelName: FormControl<string>;
  roomType: FormControl<string>;
  mealPlan: FormControl<string>;
  checkinDate: FormControl<string>;
  checkoutDate: FormControl<string>;
  unitPrice: FormControl<number>;
}>;

type ServiceFormGroup = FormGroup<{
  serviceType: FormControl<string>;
  description: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
}>;

type OfferBuilderFormGroup = FormGroup<{
  language: FormControl<string>;
  currency: FormControl<string>;
  destination: FormControl<string>;
  departureCity: FormControl<string>;
  departDate: FormControl<string>;
  returnDate: FormControl<string>;
  adults: FormControl<number>;
  children: FormControl<number>;
  validityDate: FormControl<string>;
  discountMode: FormControl<'PCT' | 'AMOUNT'>;
  discountValue: FormControl<number>;
  internalNotes: FormControl<string>;
  accommodations: FormArray<AccommodationFormGroup>;
  services: FormArray<ServiceFormGroup>;
}>;

const CURRENCY_OPTIONS = ['BYN', 'USD', 'EUR'] as const;
const LANGUAGE_OPTIONS = ['ru', 'en'] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-offer',
  imports: [
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    DragDropModule,
    PageHeading,
    PageContentComponent,
    FormSectionComponent,
    ...MAT_FORM_BUTTONS,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
    ...MAT_DIALOG,
    ...MAT_ICONS,
  ],
  templateUrl: './create-offer.html',
  styleUrl: './create-offer.scss',
})
export class CreateOfferComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);
  private readonly organizationSettingsService = inject(OrganizationSettingsService);
  private readonly offersService = inject(OffersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly lead = signal<LeadResponseDto | null>(null);
  readonly leadLoading = signal(true);
  readonly leadPrefillWarning = signal('');
  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly error = signal('');
  readonly leadId = signal<string | null>(null);
  readonly createdDraftId = signal<string | null>(null);
  readonly destinationNotSetLabel = 'Направление не указано';
  readonly prefilledLeadNumber = computed(() => {
    const lead = this.lead();

    if (!lead) {
      return null;
    }

    return lead.number;
  });

  readonly form: OfferBuilderFormGroup = this.fb.nonNullable.group({
    language: this.fb.nonNullable.control('ru', Validators.required),
    currency: this.fb.nonNullable.control('EUR', Validators.required),
    destination: [''],
    departureCity: [''],
    departDate: [''],
    returnDate: [''],
    adults: [1],
    children: [0],
    validityDate: [''],
    discountMode: this.fb.nonNullable.control<'PCT' | 'AMOUNT'>('PCT'),
    discountValue: this.fb.nonNullable.control(0, Validators.min(0)),
    internalNotes: [''],
    accommodations: this.fb.array<AccommodationFormGroup>([this.createAccommodationGroup()], {
      validators: [this.validateMinAccommodations],
    }),
    services: this.fb.array<ServiceFormGroup>([this.createServiceGroup()]),
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly pricingSummary = computed(() => {
    const value = this.formValue();

    return calculateOfferPricing({
      accommodations: (value.accommodations ?? []).map((row) => ({
        unitPrice: toSafeNumber(row?.unitPrice),
        quantity: calculateNights(String(row?.checkinDate ?? ''), String(row?.checkoutDate ?? '')),
      })),
      services: (value.services ?? []).map((row) => ({
        unitPrice: toSafeNumber(row?.unitPrice),
        quantity: Math.max(0, toSafeNumber(row?.quantity)),
      })),
      discountMode: value.discountMode ?? 'PCT',
      discountValue: toSafeNumber(value.discountValue),
    });
  });

  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly mealPlanOptions = MEAL_PLAN_OPTIONS;
  readonly serviceTypeOptions = SERVICE_TYPE_OPTIONS;

  ngOnInit(): void {
    const leadId = this.route.snapshot.queryParamMap.get('leadId');

    if (leadId) {
      this.leadId.set(leadId);
      this.leadPrefillWarning.set('');
    }

    this.organizationSettingsService.get().subscribe({
      next: (settings) => {
        this.form.patchValue({
          currency:
            settings.defaultCurrency &&
            CURRENCY_OPTIONS.includes(settings.defaultCurrency as (typeof CURRENCY_OPTIONS)[number])
              ? settings.defaultCurrency
              : 'EUR',
          validityDate: formatDateWithOffset(settings.offerValidityDays ?? 14),
        });
      },
      error: () => {
        this.form.patchValue({ validityDate: formatDateWithOffset(14) });
      },
    });

    if (!leadId) {
      this.leadLoading.set(false);
      this.leadPrefillWarning.set(
        'Это предложение не привязано к лиду. Перейдите к лиду и используйте кнопку «Создать предложение».',
      );

      return;
    }

    this.leadsService
      .getById(leadId)
      .pipe(finalize(() => this.leadLoading.set(false)))
      .subscribe({
        next: (lead) => {
          this.lead.set(lead);
          this.leadPrefillWarning.set('');
          this.form.patchValue({
            destination: lead.destination ?? '',
            departDate: lead.departDateFrom ?? '',
            returnDate: lead.returnDateFrom ?? '',
            adults: lead.adults ?? 1,
            children: lead.children ?? 0,
          });

          const firstAccommodation = this.accommodationsArray.at(0);

          if (firstAccommodation) {
            firstAccommodation.patchValue({
              checkinDate: lead.departDateFrom ?? '',
              checkoutDate: lead.returnDateFrom ?? '',
            });
          }

          this.form.markAsPristine();
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.lead.set(null);
            this.leadPrefillWarning.set('Лид не найден. Заполните детали вручную.');

            return;
          }

          this.error.set(this.getErrorMessage(err, 'Не удалось загрузить данные лида.'));
        },
      });
  }

  get accommodationsArray(): FormArray<AccommodationFormGroup> {
    return this.form.controls.accommodations;
  }

  get servicesArray(): FormArray<ServiceFormGroup> {
    return this.form.controls.services;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  addAccommodation(): void {
    this.accommodationsArray.push(this.createAccommodationGroup());
    this.form.markAsDirty();
  }

  removeAccommodation(index: number): void {
    if (this.accommodationsArray.length === 1) {
      return;
    }

    this.accommodationsArray.removeAt(index);
    this.accommodationsArray.updateValueAndValidity();
    this.form.markAsDirty();
  }

  addService(): void {
    this.servicesArray.push(this.createServiceGroup());
    this.form.markAsDirty();
  }

  removeService(index: number): void {
    this.servicesArray.removeAt(index);

    if (this.servicesArray.length === 0) {
      this.servicesArray.push(this.createServiceGroup());
    }

    this.form.markAsDirty();
  }

  dropAccommodation(event: CdkDragDrop<AccommodationFormGroup[]>): void {
    this.moveFormArrayItem(this.accommodationsArray, event.previousIndex, event.currentIndex);
  }

  dropService(event: CdkDragDrop<ServiceFormGroup[]>): void {
    this.moveFormArrayItem(this.servicesArray, event.previousIndex, event.currentIndex);
  }

  accommodationNights(index: number): number {
    const row = this.accommodationsArray.at(index);

    if (!row) {
      return 0;
    }

    return calculateNights(row.controls.checkinDate.value, row.controls.checkoutDate.value);
  }

  accommodationTotal(index: number): number {
    const row = this.accommodationsArray.at(index);

    if (!row) {
      return 0;
    }

    return (
      Math.max(0, toSafeNumber(row.controls.unitPrice.value)) *
      Math.max(0, this.accommodationNights(index))
    );
  }

  serviceTotal(index: number): number {
    const row = this.servicesArray.at(index);

    if (!row) {
      return 0;
    }

    return (
      Math.max(0, toSafeNumber(row.controls.unitPrice.value)) *
      Math.max(0, toSafeNumber(row.controls.quantity.value))
    );
  }

  onPreviewClick(): void {
    if (this.saving() || this.previewing()) {
      return;
    }

    const leadId = this.leadId();

    if (!leadId) {
      this.snackBar.open('Сохраните черновик перед предпросмотром.', 'Close', { duration: 5000 });

      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.error.set('');
    this.previewing.set(true);

    const existingId = this.createdDraftId();

    if (existingId) {
      const updateDto = this.buildUpdateDto();
      this.offersService
        .update(existingId, updateDto)
        .pipe(finalize(() => this.previewing.set(false)))
        .subscribe({
          next: (updated) => {
            this.form.markAsPristine();
            this.openPdfPreviewDialog(updated.id, updated.number);
          },
          error: (err) => {
            this.error.set(err.error?.message ?? err.message ?? 'Не удалось обновить предложение');
          },
        });
    } else {
      const dto = this.buildCreateDto(leadId);
      this.offersService
        .create(dto)
        .pipe(finalize(() => this.previewing.set(false)))
        .subscribe({
          next: (created) => {
            this.createdDraftId.set(created.id);
            this.form.markAsPristine();
            this.snackBar.open('Черновик предложения сохранён', 'Close', { duration: 4000 });
            this.openPdfPreviewDialog(created.id, created.number);
          },
          error: (err) => {
            this.error.set(err.error?.message ?? err.message ?? 'Не удалось создать предложение');
          },
        });
    }
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }

    const leadId = this.leadId();

    if (!leadId) {
      this.error.set('Невозможно сохранить: это предложение не привязано к лиду.');

      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.error.set('');
    this.saving.set(true);

    const existingId = this.createdDraftId();

    if (existingId) {
      const updateDto = this.buildUpdateDto();
      this.offersService.update(existingId, updateDto).subscribe({
        next: (updated) => {
          this.form.markAsPristine();
          this.snackBar.open('Черновик предложения сохранён', 'Close', { duration: 4000 });
          this.router.navigate(['/app/offers', updated.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Не удалось обновить предложение');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    } else {
      const dto = this.buildCreateDto(leadId);
      this.offersService.create(dto).subscribe({
        next: (created) => {
          this.form.markAsPristine();
          this.snackBar.open('Черновик предложения сохранён', 'Close', { duration: 4000 });
          this.router.navigate(['/app/offers', created.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Не удалось создать предложение');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  private openPdfPreviewDialog(offerId: string, offerNumber?: string): void {
    this.dialog.open(OfferPdfPreviewModalComponent, {
      data: {
        offerId,
        offerNumber,
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'pdf-preview-dialog',
    });
  }

  private buildCreateDto(leadId: string): CreateOfferDto {
    const v = this.form.getRawValue();
    const pricing = this.pricingSummary();

    return {
      leadId,
      language: v.language,
      currency: v.currency,
      ...(v.destination?.trim() && { destination: v.destination.trim() }),
      ...(v.departureCity?.trim() && { departureCity: v.departureCity.trim() }),
      ...(v.departDate && { departDate: v.departDate }),
      ...(v.returnDate && { returnDate: v.returnDate }),
      ...(v.adults > 0 && { adults: v.adults }),
      children: Math.max(0, toSafeNumber(v.children)),
      ...(v.validityDate && { validityDate: v.validityDate }),
      ...(v.discountMode === 'PCT'
        ? { discountPct: Math.min(100, Math.max(0, toSafeNumber(v.discountValue))) }
        : {
            discountAmount: Math.min(pricing.subtotal, Math.max(0, toSafeNumber(v.discountValue))),
          }),
      ...(v.internalNotes?.trim() && { internalNotes: v.internalNotes.trim() }),
      accommodations: mapAccommodationsForDto(v.accommodations),
      services: mapServicesForDto(v.services),
    };
  }

  private buildUpdateDto(): UpdateOfferDto {
    const v = this.form.getRawValue();
    const pricing = this.pricingSummary();

    return {
      language: v.language,
      currency: v.currency,
      ...(v.destination?.trim() && { destination: v.destination.trim() }),
      ...(v.departureCity?.trim() && { departureCity: v.departureCity.trim() }),
      ...(v.departDate && { departDate: v.departDate }),
      ...(v.returnDate && { returnDate: v.returnDate }),
      ...(v.adults > 0 && { adults: v.adults }),
      children: Math.max(0, toSafeNumber(v.children)),
      ...(v.validityDate && { validityDate: v.validityDate }),
      ...(v.discountMode === 'PCT'
        ? { discountPct: Math.min(100, Math.max(0, toSafeNumber(v.discountValue))) }
        : {
            discountAmount: Math.min(pricing.subtotal, Math.max(0, toSafeNumber(v.discountValue))),
          }),
      ...(v.internalNotes?.trim() && { internalNotes: v.internalNotes.trim() }),
      accommodations: mapAccommodationsForDto(v.accommodations),
      services: mapServicesForDto(v.services),
    };
  }

  private createAccommodationGroup(): AccommodationFormGroup {
    return this.fb.nonNullable.group(
      {
        hotelName: ['', Validators.required],
        roomType: [''],
        mealPlan: [''],
        checkinDate: ['', Validators.required],
        checkoutDate: ['', Validators.required],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
      },
      { validators: [this.validateAccommodationDateRange] },
    );
  }

  private createServiceGroup(): ServiceFormGroup {
    return this.fb.nonNullable.group({
      serviceType: ['OTHER', Validators.required],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private moveFormArrayItem<TControl extends AbstractControl>(
    formArray: FormArray<TControl>,
    from: number,
    to: number,
  ): void {
    if (from === to) {
      return;
    }

    const control = formArray.at(from) as TControl;

    formArray.removeAt(from);
    formArray.insert(to, control);
    formArray.markAsDirty();
    this.form.markAsDirty();
  }

  private validateMinAccommodations(control: AbstractControl): ValidationErrors | null {
    if (!(control instanceof FormArray)) {
      return null;
    }

    if (control.length > 0) {
      return null;
    }

    return { minItems: true };
  }

  private validateAccommodationDateRange(control: AbstractControl): ValidationErrors | null {
    if (!(control instanceof FormGroup)) {
      return null;
    }

    const checkinDate = String(control.get('checkinDate')?.value ?? '');
    const checkoutDate = String(control.get('checkoutDate')?.value ?? '');

    if (!checkinDate || !checkoutDate) {
      return null;
    }

    if (calculateNights(checkinDate, checkoutDate) > 0) {
      return null;
    }

    return { invalidDateRange: true };
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      return (
        (typeof error.error?.message === 'string' && error.error.message) ||
        error.message ||
        fallbackMessage
      );
    }

    if (error instanceof Error) {
      return error.message || fallbackMessage;
    }

    return fallbackMessage;
  }
}
