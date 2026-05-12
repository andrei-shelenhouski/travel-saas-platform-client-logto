import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { debounceTime, distinctUntilChanged, map, of, startWith } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { InvoicesService } from '@app/services/invoices.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_AUTOCOMPLETE, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';
import { formatClientSearchLabel } from '@app/shared/utils/client-display';
import {
  addDaysToIsoDate,
  normalizeInvoiceCurrency,
  normalizeInvoiceLanguage,
  normalizePaymentTermsDays,
  todayIsoDate,
} from '@app/shared/utils/invoice-defaults';

import {
  dueDateAfterInvoiceDateValidator,
  minLineItemsValidator,
  toSafeNumber,
} from './create-invoice.utils';

import type {
  BookingResponseDto,
  ClientResponseDto,
  ClientType as ClientTypeValue,
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
  InvoiceResponseDto,
  PaginatedClientResponseDto,
  UpdateInvoiceDto,
} from '@app/shared/models';

type InvoiceLineItemFormGroup = FormGroup<{
  sortOrder: FormControl<number>;
  description: FormControl<string>;
  serviceDateFrom: FormControl<string>;
  serviceDateTo: FormControl<string>;
  travelers: FormControl<string>;
  unitPrice: FormControl<number | null>;
  quantity: FormControl<number>;
  total: FormControl<number>;
  tourCost: FormControl<number | null>;
  commissionPct: FormControl<number | null>;
  commissionAmount: FormControl<number | null>;
  netToPay: FormControl<number>;
  commissionVat: FormControl<number>;
}>;

type InvoiceFormGroup = FormGroup<{
  bookingId: FormControl<string>;
  clientId: FormControl<string>;
  clientType: FormControl<ClientTypeValue>;
  invoiceDate: FormControl<string>;
  dueDate: FormControl<string>;
  currency: FormControl<string>;
  language: FormControl<string>;
  paymentTerms: FormControl<string>;
  internalNotes: FormControl<string>;
  lineItems: FormArray<InvoiceLineItemFormGroup>;
}>;

const CURRENCY_OPTIONS = ['BYN', 'USD', 'EUR'] as const;
const LANGUAGE_OPTIONS = ['RU', 'EN'] as const;

const EMPTY_CLIENTS_PAGE: PaginatedClientResponseDto = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-invoice',
  imports: [
    DragDropModule,
    PageHeading,
    RouterLink,
    ReactiveFormsModule,
    ...MAT_FORM_BUTTONS,
    ...MAT_AUTOCOMPLETE,
    ...MAT_ICONS,
  ],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss',
})
export class CreateInvoiceComponent {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly invoiceId: string | null = this.route.snapshot.paramMap.get('id');
  protected readonly isEditMode = this.invoiceId !== null;
  private readonly bookingsService = inject(BookingsService);
  private readonly clientsService = inject(ClientsService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly organizationSettingsService = inject(OrganizationSettingsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly clientTypeWarning = signal('');
  protected readonly selectedClient = signal<ClientResponseDto | null>(null);
  protected readonly selectedClientCommissionPct = signal<number | null>(null);
  protected readonly defaultCommissionPct = signal<number | null>(null);
  protected readonly booking = signal<BookingResponseDto | null>(null);
  private readonly initialInvoiceDate = todayIsoDate();

  protected readonly clientSearchControl = this.fb.nonNullable.control('');
  protected readonly form: InvoiceFormGroup = this.fb.group(
    {
      bookingId: this.fb.nonNullable.control(''),
      clientId: this.fb.nonNullable.control('', Validators.required),
      clientType: this.fb.nonNullable.control<ClientTypeValue>(
        ClientType.INDIVIDUAL,
        Validators.required,
      ),
      invoiceDate: this.fb.nonNullable.control(this.initialInvoiceDate, Validators.required),
      dueDate: this.fb.nonNullable.control(
        addDaysToIsoDate(this.initialInvoiceDate, 1),
        Validators.required,
      ),
      currency: this.fb.nonNullable.control('EUR', Validators.required),
      language: this.fb.nonNullable.control('EN', Validators.required),
      paymentTerms: this.fb.nonNullable.control(''),
      internalNotes: this.fb.nonNullable.control(''),
      lineItems: this.fb.array<InvoiceLineItemFormGroup>([], {
        validators: [minLineItemsValidator],
      }),
    },
    { validators: [dueDateAfterInvoiceDateValidator] },
  );

  private readonly clientSearchQuery = toSignal(
    this.clientSearchControl.valueChanges.pipe(
      startWith(this.clientSearchControl.getRawValue()),
      debounceTime(250),
      distinctUntilChanged(),
      map((value) => value.trim()),
    ),
    { initialValue: '' },
  );

  private readonly clientsResource = rxResource({
    params: () => this.clientSearchQuery(),
    stream: ({ params }) => {
      if (params.length < 2) {
        return of(EMPTY_CLIENTS_PAGE);
      }

      return this.clientsService.getList({ search: params, page: 1, limit: 10 });
    },
  });

  protected readonly clientOptions = computed(() => this.clientsResource.value()?.items ?? []);
  protected readonly clientOptionsLoading = computed(() => this.clientsResource.isLoading());

  protected readonly clientTypeSignal = toSignal(
    this.form.controls.clientType.valueChanges.pipe(startWith(this.form.controls.clientType.value)),
    { initialValue: this.form.controls.clientType.value },
  );
  protected readonly isB2bMode = computed(() => this.clientTypeSignal() === ClientType.B2B_AGENT);
  protected readonly currencyOptions = CURRENCY_OPTIONS;
  protected readonly languageOptions = LANGUAGE_OPTIONS;

  constructor() {
    if (this.isEditMode) {
      this.loadInvoiceForEdit();
      this.clientSearchControl.disable();
    } else {
      this.loadDefaults();
      this.loadBookingFromQuery();
    }

    if (this.lineItemsArray.length === 0) {
      this.resetLineItems();
    }

    this.form.controls.clientType.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.applyLineItemModeValidators();

      for (let index = 0; index < this.lineItemsArray.length; index++) {
        this.recalculateRow(index);
      }
    });

    this.clientSearchControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const selectedClient = this.selectedClient();

      if (selectedClient === null) {
        return;
      }

      const typedValue = value.trim().toLowerCase();
      const selectedValue = this.clientDisplayName(selectedClient).trim().toLowerCase();

      if (typedValue === selectedValue) {
        return;
      }

      this.selectedClient.set(null);
      this.form.controls.clientId.setValue('');
    });
  }

  protected get lineItemsArray(): FormArray<InvoiceLineItemFormGroup> {
    return this.form.controls.lineItems;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  protected onClientSelected(client: ClientResponseDto): void {
    this.clientTypeWarning.set('');
    this.form.controls.clientId.setValue(client.id);
    this.clientSearchControl.setValue(this.clientDisplayName(client), { emitEvent: false });

    this.applyClientDetails(client);
    this.loadClientById(client.id);
  }

  protected onClientOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedName = String(event.option.value ?? '')
      .trim()
      .toLowerCase();
    const option = this.clientOptions().find((client) => {
      return this.clientDisplayName(client).trim().toLowerCase() === selectedName;
    });

    if (option) {
      this.onClientSelected(option);
    }
  }

  protected onClientSearchBlur(): void {
    const rawClientId = this.form.controls.clientId.getRawValue();
    const rawSearch = this.clientSearchControl.getRawValue().trim();

    if (rawSearch.length === 0) {
      this.selectedClient.set(null);
      this.form.controls.clientId.setValue('');

      return;
    }

    if (rawClientId.length > 0) {
      return;
    }

    const exactMatch = this.clientOptions().find((client) => {
      return this.clientDisplayName(client).trim().toLowerCase() === rawSearch.toLowerCase();
    });

    if (exactMatch) {
      this.onClientSelected(exactMatch);

      return;
    }

    if (this.clientOptions().length === 1) {
      this.onClientSelected(this.clientOptions()[0]);

      return;
    }

    this.clientsService.getList({ search: rawSearch, page: 1, limit: 10 }).subscribe({
      next: (response) => {
        const exactServerMatch = response.items.find((client) => {
          return this.clientDisplayName(client).trim().toLowerCase() === rawSearch.toLowerCase();
        });

        if (exactServerMatch) {
          this.onClientSelected(exactServerMatch);

          return;
        }

        if (response.items.length === 1) {
          this.onClientSelected(response.items[0]);

          return;
        }

        this.selectedClient.set(null);
        this.form.controls.clientId.setValue('');
        this.clientSearchControl.setValue('');
      },
      error: () => {
        this.selectedClient.set(null);
        this.form.controls.clientId.setValue('');
        this.clientSearchControl.setValue('');
      },
    });
  }

  protected addLineItem(): void {
    const newIndex = this.lineItemsArray.length;

    this.lineItemsArray.push(this.createLineItemGroup(newIndex));
    this.syncLineItemSortOrder();
    this.recalculateRow(newIndex);
    this.form.markAsDirty();
  }

  protected removeLineItem(index: number): void {
    if (this.lineItemsArray.length <= 1) {
      return;
    }

    this.lineItemsArray.removeAt(index);
    this.syncLineItemSortOrder();
    this.form.markAsDirty();
  }

  protected dropLineItem(event: CdkDragDrop<InvoiceLineItemFormGroup[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const moved = this.lineItemsArray.at(event.previousIndex);

    this.lineItemsArray.removeAt(event.previousIndex);
    this.lineItemsArray.insert(event.currentIndex, moved);
    this.syncLineItemSortOrder();
    this.form.markAsDirty();
  }

  protected onStandardItemInput(index: number): void {
    const row = this.lineItemsArray.at(index);

    if (!row) {
      return;
    }

    const total =
      toSafeNumber(row.controls.unitPrice.value) * toSafeNumber(row.controls.quantity.value);

    row.controls.total.setValue(total);
  }

  protected onB2bCommissionPctInput(index: number): void {
    const row = this.lineItemsArray.at(index);

    if (!row) {
      return;
    }

    const tourCost = toSafeNumber(row.controls.tourCost.value);
    const commissionPct = Math.min(
      100,
      Math.max(0, toSafeNumber(row.controls.commissionPct.value)),
    );
    const commissionAmount = (tourCost * commissionPct) / 100;

    row.controls.commissionPct.setValue(commissionPct);
    row.controls.commissionAmount.setValue(commissionAmount);

    this.updateB2bCalculatedFields(row);
    this.form.markAsDirty();
  }

  protected onB2bCommissionAmountInput(index: number): void {
    const row = this.lineItemsArray.at(index);

    if (!row) {
      return;
    }

    const tourCost = toSafeNumber(row.controls.tourCost.value);
    const commissionAmount = Math.max(0, toSafeNumber(row.controls.commissionAmount.value));
    const commissionPct = tourCost > 0 ? (commissionAmount / tourCost) * 100 : 0;

    row.controls.commissionAmount.setValue(commissionAmount);
    row.controls.commissionPct.setValue(commissionPct);

    this.updateB2bCalculatedFields(row);
    this.form.markAsDirty();
  }

  protected onB2bTourCostInput(index: number): void {
    const row = this.lineItemsArray.at(index);

    if (!row) {
      return;
    }

    const commissionPct = row.controls.commissionPct.value;

    if (commissionPct !== null) {
      this.onB2bCommissionPctInput(index);

      return;
    }

    this.onB2bCommissionAmountInput(index);
  }

  protected onSubmit(): void {
    this.error.set('');

    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);

    if (this.isEditMode) {
      this.invoicesService.update(this.invoiceId!, this.buildUpdateInvoiceDto()).subscribe({
        next: () => {
          this.form.markAsPristine();
          this.toast.showSuccess('Invoice updated');
          this.router.navigate(['/app/invoices', this.invoiceId]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Failed to update invoice');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    } else {
      this.invoicesService.create(this.buildCreateInvoiceDto()).subscribe({
        next: (created) => {
          this.form.markAsPristine();
          this.toast.showSuccess('Invoice draft saved');
          this.router.navigate(['/app/invoices', created.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Failed to create invoice');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  protected onCancel(): void {
    this.location.back();
  }

  protected clientDisplayName(client: ClientResponseDto): string {
    return formatClientSearchLabel(client);
  }

  protected trackByClientId(_: number, client: ClientResponseDto): string {
    return client.id;
  }

  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  protected pricingSummary(): {
    subtotal: number;
    total: number;
    totalCommission: number;
    totalVat: number;
  } {
    const lineItems = this.lineItemsArray.controls.map((row) => row.getRawValue());

    if (this.form.controls.clientType.value === ClientType.B2B_AGENT) {
      const totalCommission = lineItems.reduce((sum, item) => {
        return sum + toSafeNumber(item.commissionAmount);
      }, 0);
      const subtotal = lineItems.reduce((sum, item) => {
        return sum + toSafeNumber(item.netToPay);
      }, 0);
      const totalVat = lineItems.reduce((sum, item) => {
        return sum + toSafeNumber(item.commissionVat);
      }, 0);

      return {
        subtotal,
        total: subtotal,
        totalCommission,
        totalVat,
      };
    }

    const subtotal = lineItems.reduce((sum, item) => {
      return sum + toSafeNumber(item.total);
    }, 0);

    return {
      subtotal,
      total: subtotal,
      totalCommission: 0,
      totalVat: 0,
    };
  }

  private loadDefaults(): void {
    this.organizationSettingsService.get().subscribe({
      next: (settings) => {
        const currency = normalizeInvoiceCurrency(settings.defaultCurrency);
        const language = normalizeInvoiceLanguage(settings.defaultLanguage);
        const currencyControl = this.form.controls.currency;
        const languageControl = this.form.controls.language;
        const dueDateControl = this.form.controls.dueDate;
        const paymentTermsControl = this.form.controls.paymentTerms;
        const paymentTermsDays = normalizePaymentTermsDays(settings.defaultPaymentTermsDays);
        const dueDate = addDaysToIsoDate(
          this.form.controls.invoiceDate.getRawValue(),
          paymentTermsDays,
        );
        const updates: {
          currency?: string;
          language?: string;
          dueDate?: string;
          paymentTerms?: string;
        } = {};

        if (currencyControl.pristine) {
          updates.currency = currency;
        }

        if (languageControl.pristine) {
          updates.language = language;
        }

        if (dueDateControl.pristine) {
          updates.dueDate = dueDate;
        }

        if (paymentTermsControl.pristine) {
          updates.paymentTerms = settings.defaultPaymentTerms ?? '';
        }

        this.defaultCommissionPct.set(settings.defaultCommissionPct ?? null);
        this.form.patchValue(updates);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadBookingFromQuery(): void {
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');

    if (bookingId === null) {
      return;
    }

    this.form.controls.bookingId.setValue(bookingId);
    this.bookingsService.getById(bookingId).subscribe({
      next: (booking) => {
        this.booking.set(booking);

        if (booking.clientId) {
          this.form.controls.clientId.setValue(booking.clientId);
          this.loadClientById(booking.clientId, true);
        }

        this.prefillLineItemsFromBooking(booking);
        this.form.markAsPristine();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load booking data');
      },
    });
  }

  private loadInvoiceForEdit(): void {
    this.invoicesService.getById(this.invoiceId!).subscribe({
      next: (invoice) => {
        this.patchFormFromInvoice(invoice);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load invoice');
        this.loading.set(false);
      },
    });
  }

  private patchFormFromInvoice(invoice: InvoiceResponseDto): void {
    this.form.patchValue({
      bookingId: invoice.bookingId ?? '',
      clientId: invoice.clientId,
      clientType: this.normalizeClientType(invoice.clientType ?? ''),
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      language: invoice.language ?? '',
      paymentTerms: invoice.paymentTerms ?? '',
      internalNotes: invoice.internalNotes ?? '',
    });

    const items = invoice.lineItems ?? [];
    const targetLength = Math.max(items.length, 1);

    while (this.lineItemsArray.length < targetLength) {
      this.lineItemsArray.push(this.createLineItemGroup(this.lineItemsArray.length));
    }

    while (this.lineItemsArray.length > targetLength) {
      this.lineItemsArray.removeAt(this.lineItemsArray.length - 1);
    }

    items.forEach((item, index) => {
      this.lineItemsArray.at(index).patchValue({
        description: item.description ?? '',
        serviceDateFrom: item.serviceDateFrom ?? '',
        serviceDateTo: item.serviceDateTo ?? '',
        travelers: item.travelers ?? '',
        unitPrice: item.unitPrice ?? null,
        quantity: item.quantity ?? 1,
        tourCost: item.tourCost ?? null,
        commissionAmount: item.commissionAmount ?? null,
      });
    });

    this.syncLineItemSortOrder();
    this.applyLineItemModeValidators();

    for (let index = 0; index < this.lineItemsArray.length; index++) {
      this.recalculateRow(index);
    }

    this.loadClientForEdit(invoice.clientId);
    this.form.markAsPristine();
  }

  private loadClientForEdit(clientId: string): void {
    this.clientsService.getById(clientId).subscribe({
      next: (client) => {
        this.selectedClient.set(client);
        this.selectedClientCommissionPct.set(client.commissionPct ?? null);
        this.clientSearchControl.setValue(this.clientDisplayName(client), { emitEvent: false });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load client details');
      },
    });
  }

  private loadClientById(clientId: string, prefillFromBooking = false): void {
    this.clientsService.getById(clientId).subscribe({
      next: (client) => {
        this.clientSearchControl.setValue(this.clientDisplayName(client), { emitEvent: false });
        this.applyClientDetails(client, prefillFromBooking);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load client details');
      },
    });
  }

  private applyClientDetails(client: ClientResponseDto, prefillFromBooking = false): void {
    const previousType = this.form.controls.clientType.value;
    const nextType = this.normalizeClientType(client.type);
    const shouldResetRows =
      previousType !== nextType && (this.hasMeaningfulLineItems() || prefillFromBooking);

    this.selectedClient.set(client);
    this.selectedClientCommissionPct.set(client.commissionPct ?? this.defaultCommissionPct());
    this.form.controls.clientType.setValue(nextType);

    if (shouldResetRows) {
      this.clientTypeWarning.set(
        'Client type changed. Existing invoice lines were cleared and rebuilt for the selected type.',
      );
      this.resetLineItems();
    }

    if (nextType === ClientType.B2B_AGENT) {
      this.applyDefaultCommissionPctToRows();
    }

    if (prefillFromBooking && this.booking()) {
      this.prefillLineItemsFromBooking(this.booking() as BookingResponseDto);
    }

    if (!prefillFromBooking) {
      this.form.markAsDirty();
    }
  }

  private applyDefaultCommissionPctToRows(): void {
    const defaultPct = this.selectedClientCommissionPct();

    if (defaultPct === null) {
      return;
    }

    for (let index = 0; index < this.lineItemsArray.length; index++) {
      const row = this.lineItemsArray.at(index);
      const currentPct = row.controls.commissionPct.value;

      if (currentPct === null || currentPct === 0) {
        row.controls.commissionPct.setValue(defaultPct);
        this.recalculateRow(index);
      }
    }
  }

  private prefillLineItemsFromBooking(booking: BookingResponseDto): void {
    if (this.lineItemsArray.length === 0) {
      this.resetLineItems();
    }

    const row = this.lineItemsArray.at(0);

    if (!row) {
      return;
    }

    const travelersLabel = `${booking.adults ?? 0} adults, ${booking.children ?? 0} children`;
    const description = booking.destination?.trim().length
      ? `Travel services: ${booking.destination}`
      : 'Travel services';

    row.patchValue(
      {
        description,
        serviceDateFrom: booking.departDate ?? '',
        serviceDateTo: booking.returnDate ?? '',
        travelers: travelersLabel,
      },
      { emitEvent: false },
    );

    this.recalculateRow(0);
  }

  private resetLineItems(): void {
    this.lineItemsArray.clear();
    this.lineItemsArray.push(this.createLineItemGroup(0));
    this.syncLineItemSortOrder();
    this.applyLineItemModeValidators();
  }

  private createLineItemGroup(sortOrder: number): InvoiceLineItemFormGroup {
    const group: InvoiceLineItemFormGroup = this.fb.group({
      sortOrder: this.fb.nonNullable.control(sortOrder),
      description: this.fb.nonNullable.control('', Validators.required),
      serviceDateFrom: this.fb.nonNullable.control(''),
      serviceDateTo: this.fb.nonNullable.control(''),
      travelers: this.fb.nonNullable.control(''),
      unitPrice: this.fb.control<number | null>(null),
      quantity: this.fb.nonNullable.control(1),
      total: this.fb.nonNullable.control({ value: 0, disabled: true }),
      tourCost: this.fb.control<number | null>(null),
      commissionPct: this.fb.control<number | null>(this.selectedClientCommissionPct()),
      commissionAmount: this.fb.control<number | null>(null),
      netToPay: this.fb.nonNullable.control({ value: 0, disabled: true }),
      commissionVat: this.fb.nonNullable.control({ value: 0, disabled: true }),
    });

    this.applyRowValidators(group);

    return group;
  }

  private applyLineItemModeValidators(): void {
    for (const row of this.lineItemsArray.controls) {
      this.applyRowValidators(row);
    }

    this.lineItemsArray.updateValueAndValidity({ emitEvent: false });
  }

  private applyRowValidators(row: InvoiceLineItemFormGroup): void {
    const isB2bMode = this.form.controls.clientType.value === ClientType.B2B_AGENT;

    if (isB2bMode) {
      row.controls.unitPrice.clearValidators();
      row.controls.quantity.clearValidators();
      row.controls.tourCost.setValidators([Validators.required, Validators.min(0.01)]);
      row.controls.commissionPct.setValidators([Validators.min(0), Validators.max(100)]);
      row.controls.commissionAmount.setValidators([
        Validators.min(0),
        this.commissionNotGreaterThanTourCostValidator(),
      ]);
    } else {
      row.controls.unitPrice.setValidators([Validators.required, Validators.min(0.01)]);
      row.controls.quantity.setValidators([Validators.required, Validators.min(1)]);
      row.controls.tourCost.clearValidators();
      row.controls.commissionPct.clearValidators();
      row.controls.commissionAmount.clearValidators();
    }

    row.controls.unitPrice.updateValueAndValidity({ emitEvent: false });
    row.controls.quantity.updateValueAndValidity({ emitEvent: false });
    row.controls.tourCost.updateValueAndValidity({ emitEvent: false });
    row.controls.commissionPct.updateValueAndValidity({ emitEvent: false });
    row.controls.commissionAmount.updateValueAndValidity({ emitEvent: false });
  }

  private commissionNotGreaterThanTourCostValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent as InvoiceLineItemFormGroup | null;

      if (parent === null) {
        return null;
      }

      const tourCost = toSafeNumber(parent.controls.tourCost.value);
      const commissionAmount = toSafeNumber(control.value);

      if (commissionAmount <= tourCost) {
        return null;
      }

      return { commissionExceedsTourCost: true };
    };
  }

  private recalculateRow(index: number): void {
    if (this.form.controls.clientType.value === ClientType.B2B_AGENT) {
      this.onB2bTourCostInput(index);

      return;
    }

    this.onStandardItemInput(index);
  }

  private updateB2bCalculatedFields(row: InvoiceLineItemFormGroup): void {
    const tourCost = toSafeNumber(row.controls.tourCost.value);
    const commissionAmount = toSafeNumber(row.controls.commissionAmount.value);
    const normalizedCommissionAmount = Math.max(0, commissionAmount);
    const vatRate = 0.2;
    const netToPay = Math.max(0, tourCost - normalizedCommissionAmount);
    const commissionVat = (normalizedCommissionAmount * vatRate) / (1 + vatRate);

    row.controls.commissionAmount.updateValueAndValidity();
    row.controls.netToPay.setValue(netToPay);
    row.controls.commissionVat.setValue(commissionVat);
  }

  private buildUpdateInvoiceDto(): UpdateInvoiceDto {
    const value = this.form.getRawValue();
    const lineItems = value.lineItems.map((row, index) => this.mapLineItemForDto(row, index));

    const dto: UpdateInvoiceDto = {
      invoiceDate: value.invoiceDate,
      dueDate: value.dueDate,
      currency: value.currency,
      language: value.language,
      lineItems,
    };

    const paymentTerms = value.paymentTerms.trim();
    const internalNotes = value.internalNotes.trim();

    if (paymentTerms.length > 0) {
      dto.paymentTerms = paymentTerms;
    }

    if (internalNotes.length > 0) {
      dto.internalNotes = internalNotes;
    }

    return dto;
  }

  private buildCreateInvoiceDto(): CreateInvoiceDto {
    const value = this.form.getRawValue();
    const lineItems = value.lineItems.map((row, index) => this.mapLineItemForDto(row, index));

    const dto: CreateInvoiceDto = {
      clientId: value.clientId,
      clientType: value.clientType,
      invoiceDate: value.invoiceDate,
      dueDate: value.dueDate,
      currency: value.currency,
      language: value.language,
      lineItems,
    };

    const bookingId = value.bookingId.trim();
    const paymentTerms = value.paymentTerms.trim();
    const internalNotes = value.internalNotes.trim();

    if (bookingId.length > 0) {
      dto.bookingId = bookingId;
    }

    if (paymentTerms.length > 0) {
      dto.paymentTerms = paymentTerms;
    }

    if (internalNotes.length > 0) {
      dto.internalNotes = internalNotes;
    }

    return dto;
  }

  private mapLineItemForDto(
    row: ReturnType<InvoiceFormGroup['getRawValue']>['lineItems'][number],
    index: number,
  ): CreateInvoiceLineItemDto {
    const isB2bMode = this.form.controls.clientType.value === ClientType.B2B_AGENT;
    const dto: CreateInvoiceLineItemDto = {
      sortOrder: index,
      description: row.description.trim(),
      serviceDateFrom: row.serviceDateFrom || undefined,
      serviceDateTo: row.serviceDateTo || undefined,
      travelers: row.travelers.trim() || undefined,
    };

    if (isB2bMode) {
      dto.tourCost = toSafeNumber(row.tourCost);
      dto.commissionAmount = toSafeNumber(row.commissionAmount);
    } else {
      const unitPrice = toSafeNumber(row.unitPrice);
      const quantity = Math.max(1, toSafeNumber(row.quantity));

      dto.unitPrice = unitPrice;
      dto.quantity = quantity;
      dto.tourCost = unitPrice * quantity;
    }

    return dto;
  }

  private syncLineItemSortOrder(): void {
    this.lineItemsArray.controls.forEach((row, index) => {
      row.controls.sortOrder.setValue(index, { emitEvent: false });
    });

    this.lineItemsArray.updateValueAndValidity({ emitEvent: false });
  }

  private hasMeaningfulLineItems(): boolean {
    for (const row of this.lineItemsArray.controls) {
      const value = row.getRawValue();

      if (value.description.trim().length > 0) {
        return true;
      }

      if (toSafeNumber(value.total) > 0 || toSafeNumber(value.netToPay) > 0) {
        return true;
      }
    }

    return false;
  }

  private normalizeClientType(type: string): ClientTypeValue {
    if (type === ClientType.B2B_AGENT) {
      return ClientType.B2B_AGENT;
    }

    if (type === ClientType.COMPANY) {
      return ClientType.COMPANY;
    }

    if (type === ClientType.AGENT) {
      return ClientType.AGENT;
    }

    return ClientType.INDIVIDUAL;
  }
}
