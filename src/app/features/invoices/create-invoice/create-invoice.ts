/* eslint-disable max-lines */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
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
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { FormSectionComponent, PageContentComponent } from '@app/shared/components';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { InvoiceClientSelectorComponent } from './invoice-client-selector/invoice-client-selector';
import { InvoiceLineItemsFormComponent } from './invoice-line-items-form/invoice-line-items-form';
import { InvoiceTotalsDisplayComponent } from './invoice-totals-display/invoice-totals-display';

import type {
  BookingResponseDto,
  ClientResponseDto,
  ClientType as ClientTypeValue,
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
  InvoiceLineItemResponseDto,
  InvoiceResponseDto,
  PaginatedClientResponseDto,
  UpdateInvoiceDto,
} from '@app/shared/models';

type InvoiceLineItemWithLegacyAliases = InvoiceLineItemResponseDto & {
  price?: number | string;
  amount?: number | string;
};

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
    PageHeading,
    PageHeadingAction,
    PageContentComponent,
    FormSectionComponent,
    RouterLink,
    ReactiveFormsModule,
    InvoiceClientSelectorComponent,
    InvoiceLineItemsFormComponent,
    InvoiceTotalsDisplayComponent,
    ...MAT_FORM_BUTTONS,
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
  private readonly snackBar = inject(MatSnackBar);
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

  /**
   * Synchronous signal for client type. Updated in the valueChanges subscription (not via
   * toSignal) so the template reacts immediately when clientType.setValue() is called, without
   * waiting for the next async effect flush that toSignal would introduce.
   */
  protected readonly clientTypeSignal = signal<ClientTypeValue>(
    this.form.controls.clientType.value,
  );
  protected readonly isB2bMode = computed(() => this.clientTypeSignal() === ClientType.B2B_AGENT);

  /**
   * Version counter bumped after every line-item value mutation so that pricingSummary()
   * — a computed — re-evaluates reactively even when triggered by programmatic setValue() calls
   * (e.g. onB2bTourCostInput, applyDefaultCommissionPct) rather than only by DOM events.
   */
  private readonly lineItemsVersion = signal(0);
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

    this.form.controls.clientType.valueChanges.pipe(takeUntilDestroyed()).subscribe((type) => {
      // Update the synchronous signal immediately so isB2bMode() and pricingSummary reflect
      // the new type in the same change-detection cycle that triggered the value change.
      this.clientTypeSignal.set(type);
      this.applyLineItemModeValidators();

      for (let index = 0; index < this.lineItemsArray.length; index++) {
        this.recalculateRow(index);
      }

      this.bumpLineItemsVersion();
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
    this.bumpLineItemsVersion();
    this.form.markAsDirty();
  }

  protected removeLineItem(index: number): void {
    if (this.lineItemsArray.length <= 1) {
      return;
    }

    this.lineItemsArray.removeAt(index);
    this.syncLineItemSortOrder();
    this.bumpLineItemsVersion();
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
    this.bumpLineItemsVersion();
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
    this.bumpLineItemsVersion();
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

    if (row.controls.commissionAmount.value === null) {
      row.controls.commissionPct.setValue(null);

      this.updateB2bCalculatedFields(row);
      this.form.markAsDirty();

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
          this.snackBar.open('Счёт обновлён', 'Close', { duration: 4000 });
          this.router.navigate(['/app/invoices', this.invoiceId]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Не удалось обновить счёт');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    } else {
      this.invoicesService.create(this.buildCreateInvoiceDto()).subscribe({
        next: (created) => {
          this.form.markAsPristine();
          this.snackBar.open('Черновик счёта сохранён', 'Close', { duration: 4000 });
          this.router.navigate(['/app/invoices', created.id]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message ?? 'Не удалось создать счёт');
          this.saving.set(false);
        },
        complete: () => this.saving.set(false),
      });
    }
  }

  protected onCancel(): void {
    this.location.back();
  }

  /** Arrow function so it can be passed as an `input()` to InvoiceClientSelectorComponent. */
  protected readonly clientDisplayName = (client: ClientResponseDto): string => {
    return formatClientSearchLabel(client);
  };

  protected trackByClientId(_: number, client: ClientResponseDto): string {
    return client.id;
  }

  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  readonly pricingSummary = computed<{
    subtotal: number;
    total: number;
    totalCommission: number;
    totalVat: number;
  }>(() => {
    // Declare dependency on both signals so this computed re-runs when either changes.
    const isB2b = this.isB2bMode();
    this.lineItemsVersion(); // reactive dependency — bumped after each line-item mutation

    const lineItems = this.lineItemsArray.controls.map((row) => row.getRawValue());

    if (isB2b) {
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
  });

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
        this.error.set(
          err.error?.message ?? err.message ?? 'Не удалось загрузить данные бронирования',
        );
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
        this.error.set(err.error?.message ?? err.message ?? 'Не удалось загрузить счёт');
        this.loading.set(false);
      },
    });
  }

  private patchFormFromInvoice(invoice: InvoiceResponseDto): void {
    const invoiceDate = this.normalizeDateForDateInput(
      invoice.invoiceDate,
      this.initialInvoiceDate,
    );
    const dueDate = this.normalizeDateForDateInput(
      invoice.dueDate,
      addDaysToIsoDate(invoiceDate, 1),
    );

    this.form.patchValue({
      bookingId: invoice.bookingId ?? '',
      clientId: invoice.clientId,
      clientType: this.normalizeClientType(invoice.clientType ?? ''),
      invoiceDate,
      dueDate,
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

    items.forEach((rawItem, index) => {
      const item = rawItem as InvoiceLineItemWithLegacyAliases;
      const quantity = this.resolveLineItemQuantityForEdit(item);
      const unitPrice = this.resolveLineItemUnitPriceForEdit(item, quantity);
      const tourCost = this.resolveLineItemTourCostForEdit(item, unitPrice, quantity);

      this.lineItemsArray.at(index).patchValue({
        description: item.description ?? '',
        serviceDateFrom: item.serviceDateFrom ?? '',
        serviceDateTo: item.serviceDateTo ?? '',
        travelers: item.travelers ?? '',
        unitPrice,
        quantity,
        tourCost,
        commissionAmount: this.toNullableNumber(item.commissionAmount),
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

        if (this.form.controls.clientType.value === ClientType.B2B_AGENT) {
          this.applyDefaultCommissionPctToRows();
        }

        this.clientSearchControl.setValue(this.clientDisplayName(client), { emitEvent: false });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Не удалось загрузить данные клиента');
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
        this.error.set(err.error?.message ?? err.message ?? 'Не удалось загрузить данные клиента');
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
        'Тип клиента изменён. Существующие строки счёта были очищены и перестроены для выбранного типа.',
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
      const commissionAmount = row.controls.commissionAmount.value;

      if (currentPct === null || (currentPct === 0 && commissionAmount === null)) {
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

    const travelersLabel = `${booking.adults ?? 0} взр., ${booking.children ?? 0} дет.`;
    const description = booking.destination?.trim().length
      ? `Туристические услуги: ${booking.destination}`
      : 'Туристические услуги';

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
    this.bumpLineItemsVersion();
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

  /** Increments the version counter so pricingSummary (a computed) re-evaluates. */
  private bumpLineItemsVersion(): void {
    this.lineItemsVersion.update((v) => v + 1);
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

  private normalizeDateForDateInput(value: string | null | undefined, fallback: string): string {
    const trimmed = value?.trim() ?? '';

    if (trimmed.length === 0) {
      return fallback;
    }

    return trimmed.slice(0, 10);
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }

    return null;
  }

  private resolveLineItemQuantityForEdit(item: InvoiceLineItemWithLegacyAliases): number {
    const quantity = this.toNullableNumber(item.quantity);

    if (quantity !== null && quantity > 0) {
      return quantity;
    }

    const amountAlias = this.toNullableNumber(item.amount);

    if (amountAlias !== null && amountAlias > 0) {
      return amountAlias;
    }

    return 1;
  }

  private resolveLineItemUnitPriceForEdit(
    item: InvoiceLineItemWithLegacyAliases,
    quantity: number,
  ): number | null {
    const unitPrice = this.toNullableNumber(item.unitPrice);

    if (unitPrice !== null) {
      return unitPrice;
    }

    const priceAlias = this.toNullableNumber(item.price);

    if (priceAlias !== null) {
      return priceAlias;
    }

    const total = this.toNullableNumber(item.total);

    if (total !== null && quantity > 0) {
      return total / quantity;
    }

    return null;
  }

  private resolveLineItemTourCostForEdit(
    item: InvoiceLineItemWithLegacyAliases,
    unitPrice: number | null,
    quantity: number,
  ): number | null {
    const tourCost = this.toNullableNumber(item.tourCost);

    if (tourCost !== null) {
      return tourCost;
    }

    const total = this.toNullableNumber(item.total);

    if (total !== null) {
      return total;
    }

    if (unitPrice !== null) {
      return unitPrice * quantity;
    }

    return null;
  }
}
