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
import { OffersService } from '@app/services/offers.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { RequestsService } from '@app/services/requests.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import {
  MAT_BUTTON_TOGGLES,
  MAT_BUTTONS,
  MAT_DIALOG,
  MAT_FORM_BUTTONS,
  MAT_ICONS,
} from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';

import type { CreateOfferDto, RequestResponseDto, UpdateOfferDto } from '@app/shared/models';
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
const MEAL_PLAN_OPTIONS = ['ALL_INCLUSIVE', 'BB', 'HB', 'FB', 'RO', 'OTHER'] as const;
const SERVICE_TYPE_OPTIONS = [
  'TRANSFER',
  'EXCURSION',
  'VISA',
  'INSURANCE',
  'FLIGHT',
  'OTHER',
] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-offer',
  imports: [
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    DragDropModule,
    PageHeading,
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
  private readonly requestsService = inject(RequestsService);
  private readonly organizationSettingsService = inject(OrganizationSettingsService);
  private readonly offersService = inject(OffersService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly request = signal<RequestResponseDto | null>(null);
  readonly requestLoading = signal(true);
  readonly requestPrefillWarning = signal('');
  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly error = signal('');
  readonly requestId = signal<string | null>(null);
  readonly createdDraftId = signal<string | null>(null);
  readonly destinationNotSetLabel = $localize`:@@createOfferDestinationNotSet:Destination not set`;
  readonly prefilledRequestCode = computed(() => {
    const request = this.request();

    if (!request) {
      return null;
    }

    return `TR-${this.getRequestCodeSuffix(request.id)}`;
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
    const requestId = this.route.snapshot.queryParamMap.get('requestId');

    if (requestId) {
      this.requestId.set(requestId);
      this.requestPrefillWarning.set('');
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

    if (!requestId) {
      this.requestLoading.set(false);

      return;
    }

    this.requestsService
      .getById(requestId)
      .pipe(finalize(() => this.requestLoading.set(false)))
      .subscribe({
        next: (request) => {
          this.request.set(request);
          this.requestPrefillWarning.set('');
          this.form.patchValue({
            destination: request.destination ?? '',
            departDate: request.departDate ?? '',
            returnDate: request.returnDate ?? '',
            adults: request.adults ?? 1,
            children: request.children ?? 0,
          });

          const firstAccommodation = this.accommodationsArray.at(0);

          if (firstAccommodation) {
            firstAccommodation.patchValue({
              checkinDate: request.departDate ?? '',
              checkoutDate: request.returnDate ?? '',
            });
          }

          this.form.markAsPristine();
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.request.set(null);
            this.requestPrefillWarning.set(
              $localize`:@@createOfferRequestPrefillNotFound:Trip request was not found. Fill travel details manually and continue creating the offer.`,
            );

            return;
          }

          this.error.set(
            this.getErrorMessage(
              err,
              $localize`:@@createOfferRequestLoadFailed:Failed to load request data.`,
            ),
          );
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

    const requestId = this.requestId();

    if (!requestId) {
      this.toast.showError(
        $localize`:@@offerPdfPreviewSaveDraftPrompt:Save a draft before opening PDF preview.`,
      );

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
            this.error.set(err.error?.message ?? err.message ?? 'Failed to update offer');
          },
        });
    } else {
      const dto = this.buildCreateDto(requestId);
      this.offersService
        .create(dto)
        .pipe(finalize(() => this.previewing.set(false)))
        .subscribe({
          next: (created) => {
            this.createdDraftId.set(created.id);
            this.form.markAsPristine();
            this.toast.showSuccess('Offer draft saved');
            this.openPdfPreviewDialog(created.id, created.number);
          },
          error: (err) => {
            this.error.set(err.error?.message ?? err.message ?? 'Failed to create offer');
          },
        });
    }
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }

    const requestId = this.requestId();

    if (!requestId) {
      this.error.set('Unable to save: this offer is not linked to a travel request.');

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
          this.toast.showSuccess('Offer draft saved');
          this.router.navigate(['/app/offers', updated.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Failed to update offer');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    } else {
      const dto = this.buildCreateDto(requestId);
      this.offersService.create(dto).subscribe({
        next: (created) => {
          this.form.markAsPristine();
          this.toast.showSuccess('Offer draft saved');
          this.router.navigate(['/app/offers', created.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Failed to create offer');
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

  private buildCreateDto(requestId: string): CreateOfferDto {
    const v = this.form.getRawValue();
    const pricing = this.pricingSummary();

    return {
      requestId,
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

  private getRequestCodeSuffix(requestId: string): string {
    const parts = requestId.split('-').filter(Boolean);
    const suffix = parts.at(-1) ?? requestId;

    return suffix.toUpperCase();
  }
}
