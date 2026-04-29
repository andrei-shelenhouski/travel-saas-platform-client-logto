import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
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

import {
  calculateNights,
  calculateOfferPricing,
  formatDateWithOffset,
  mapAccommodationsForDto,
  mapServicesForDto,
  toSafeNumber,
} from '@app/features/offers/offer-builder.utils';
import { OffersService } from '@app/services/offers.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { RequestsService } from '@app/services/requests.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import {
  MAT_BUTTON_TOGGLES,
  MAT_BUTTONS,
  MAT_DATE_INPUTS,
  MAT_DIALOG,
  MAT_FORM_BUTTONS,
  MAT_ICONS,
} from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';

import type { CreateOfferDto, RequestResponseDto } from '@app/shared/models';
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
    ...MAT_DATE_INPUTS,
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
  readonly saving = signal(false);
  readonly error = signal('');
  readonly requestId = signal<string | null>(null);

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

    if (!requestId) {
      this.error.set('requestId query param is required to create an offer.');
      this.requestLoading.set(false);

      return;
    }

    this.requestId.set(requestId);

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

    this.requestsService.getById(requestId).subscribe({
      next: (request) => {
        this.request.set(request);
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
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load request data.');
      },
      complete: () => this.requestLoading.set(false),
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

    return Math.max(0, toSafeNumber(row.controls.unitPrice.value));
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

  openPreview(template: TemplateRef<unknown>): void {
    this.dialog.open(template, {
      width: '960px',
      maxWidth: '95vw',
    });
  }

  onSubmit(): void {
    const requestId = this.requestId();

    if (!requestId || this.saving()) {
      this.error.set('Unable to save draft because requestId is missing.');

      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.error.set('');
    this.saving.set(true);

    const v = this.form.getRawValue();
    const pricing = this.pricingSummary();
    const dto: CreateOfferDto = {
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
}
