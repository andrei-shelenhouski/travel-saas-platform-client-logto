import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
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
  mapAccommodationsForDto,
  mapServicesForDto,
  toSafeNumber,
} from '@app/features/offers/offer-builder.utils';
import { OfferPdfPreviewModalComponent } from '@app/features/offers/offer-pdf-preview-modal/offer-pdf-preview-modal';
import { OffersService } from '@app/services/offers.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import {
  MAT_BUTTON_TOGGLES,
  MAT_BUTTONS,
  MAT_DIALOG,
  MAT_FORM_BUTTONS,
  MAT_ICONS,
} from '@app/shared/material-imports';
import { OfferStatus } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type { OfferResponseDto, UpdateOfferDto } from '@app/shared/models';
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
  selector: 'app-offer-edit',
  imports: [
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    DragDropModule,
    ...MAT_FORM_BUTTONS,
    ...MAT_BUTTONS,
    ...MAT_BUTTON_TOGGLES,
    ...MAT_DIALOG,
    ...MAT_ICONS,
    PageHeading,
  ],
  templateUrl: './offer-edit.html',
  styleUrl: './offer-edit.scss',
})
export class OfferEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offersService = inject(OffersService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly offer = signal<OfferResponseDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly error = signal('');

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
    {
      initialValue: this.form.getRawValue(),
    },
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
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/app/offers']);

      return;
    }

    this.offersService.getById(id).subscribe({
      next: (o) => this.handleLoadedOffer(o),
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to load offer');
        this.router.navigate(['/app/offers']);
      },
      complete: () => this.loading.set(false),
    });
  }

  private handleLoadedOffer(offer: OfferResponseDto): void {
    if (offer.status !== OfferStatus.DRAFT) {
      this.toast.showError('Only draft offers can be edited.');
      this.router.navigate(['/app/offers', offer.id]);

      return;
    }

    this.offer.set(offer);
    this.patchFormArrays(offer);
    this.patchFormValues(offer);
    this.form.markAsPristine();
  }

  private patchFormArrays(offer: OfferResponseDto): void {
    const accommodations = offer.accommodations?.length
      ? offer.accommodations
      : [
          {
            hotelName: '',
            roomType: '',
            mealPlan: '',
            checkinDate: '',
            checkoutDate: '',
            unitPrice: 0,
          },
        ];
    const services = offer.services?.length
      ? offer.services
      : [
          {
            serviceType: 'OTHER',
            description: '',
            quantity: 1,
            unitPrice: 0,
          },
        ];

    this.accommodationsArray.clear();

    for (const row of accommodations) {
      this.accommodationsArray.push(
        this.createAccommodationGroup({
          hotelName: row.hotelName ?? '',
          roomType: row.roomType ?? '',
          mealPlan: row.mealPlan ?? '',
          checkinDate: row.checkinDate ?? '',
          checkoutDate: row.checkoutDate ?? '',
          unitPrice: toSafeNumber(row.unitPrice),
        }),
      );
    }

    this.servicesArray.clear();

    for (const row of services) {
      this.servicesArray.push(
        this.createServiceGroup({
          serviceType: row.serviceType ?? 'OTHER',
          description: row.description ?? '',
          quantity: Math.max(1, toSafeNumber(row.quantity)),
          unitPrice: toSafeNumber(row.unitPrice),
        }),
      );
    }
  }

  private patchFormValues(offer: OfferResponseDto): void {
    const discountMode: 'PCT' | 'AMOUNT' =
      offer.discountPct !== undefined && offer.discountPct !== null ? 'PCT' : 'AMOUNT';
    const discountValue =
      discountMode === 'PCT' ? toSafeNumber(offer.discountPct) : toSafeNumber(offer.discountAmount);

    this.form.patchValue({
      language: LANGUAGE_OPTIONS.includes(offer.language as (typeof LANGUAGE_OPTIONS)[number])
        ? offer.language
        : 'ru',
      currency:
        offer.currency &&
        CURRENCY_OPTIONS.includes(offer.currency as (typeof CURRENCY_OPTIONS)[number])
          ? offer.currency
          : 'EUR',
      destination: offer.destination ?? '',
      departureCity: offer.departureCity ?? '',
      departDate: offer.departDate ?? '',
      returnDate: offer.returnDate ?? '',
      adults: offer.adults ?? 1,
      children: offer.children ?? 0,
      validityDate: offer.validityDate ?? '',
      discountMode,
      discountValue,
      internalNotes: offer.internalNotes ?? '',
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
    const currentOffer = this.offer();

    if (
      !currentOffer ||
      currentOffer.status !== OfferStatus.DRAFT ||
      this.saving() ||
      this.previewing()
    ) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    if (!this.form.dirty) {
      this.openPdfPreviewDialog(currentOffer.id, currentOffer.number);

      return;
    }

    const dto = this.buildUpdateDto();

    this.error.set('');
    this.previewing.set(true);

    this.offersService
      .update(currentOffer.id, dto)
      .pipe(finalize(() => this.previewing.set(false)))
      .subscribe({
        next: (updated) => {
          this.offer.set(updated);
          this.form.markAsPristine();
          this.toast.showSuccess('Offer draft updated');
          this.openPdfPreviewDialog(updated.id, updated.number);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Failed to update offer');
        },
      });
  }

  onSubmit(): void {
    const o = this.offer();

    if (!o || o.status !== OfferStatus.DRAFT || this.saving() || this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.error.set('');
    this.saving.set(true);

    const dto = this.buildUpdateDto();

    this.offersService.update(o.id, dto).subscribe({
      next: (updated) => {
        this.offer.set(updated);
        this.form.markAsPristine();
        this.toast.showSuccess('Offer draft updated');
        this.router.navigate(['/app/offers', o.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to update offer');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
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

  private createAccommodationGroup(initial?: {
    hotelName?: string;
    roomType?: string;
    mealPlan?: string;
    checkinDate?: string;
    checkoutDate?: string;
    unitPrice?: number;
  }): AccommodationFormGroup {
    return this.fb.nonNullable.group(
      {
        hotelName: [initial?.hotelName ?? '', Validators.required],
        roomType: [initial?.roomType ?? ''],
        mealPlan: [initial?.mealPlan ?? ''],
        checkinDate: [initial?.checkinDate ?? '', Validators.required],
        checkoutDate: [initial?.checkoutDate ?? '', Validators.required],
        unitPrice: [initial?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
      },
      { validators: [this.validateAccommodationDateRange] },
    );
  }

  private createServiceGroup(initial?: {
    serviceType?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
  }): ServiceFormGroup {
    return this.fb.nonNullable.group({
      serviceType: [initial?.serviceType ?? 'OTHER', Validators.required],
      description: [initial?.description ?? ''],
      quantity: [initial?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [initial?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
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
}
