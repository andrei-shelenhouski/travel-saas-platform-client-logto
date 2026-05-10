import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { InvoicesService } from '@app/services/invoices.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { RoleService } from '@app/services/role.service';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus, ClientType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';
import {
  addDaysToIsoDate,
  normalizeInvoiceCurrency,
  normalizeInvoiceLanguage,
  normalizePaymentTermsDays,
  todayIsoDate,
} from '@app/shared/utils/invoice-defaults';

import type { BookingResponseDto, ClientType as ClientTypeValue, CreateInvoiceDto, InvoiceResponseDto } from '@app/shared/models';

const INVOICE_STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ISSUED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500 line-through',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: $localize`:@@invoiceStatusDraft:Draft`,
  ISSUED: $localize`:@@invoiceStatusIssued:Issued`,
  PAID: $localize`:@@invoiceStatusPaid:Paid`,
  PARTIALLY_PAID: $localize`:@@invoiceStatusPartiallyPaid:Partially paid`,
  OVERDUE: $localize`:@@invoiceStatusOverdue:Overdue`,
  CANCELLED: $localize`:@@invoiceStatusCancelled:Cancelled`,
};

@Component({
  selector: 'app-invoice-list-mini',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './invoice-list-mini.html',
  styleUrl: './invoice-list-mini.scss',
})
export class InvoiceListMiniComponent {
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly organizationSettingsService = inject(OrganizationSettingsService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  readonly invoices = input<InvoiceResponseDto[]>([]);
  readonly booking = input.required<BookingResponseDto>();
  readonly creatingInvoice = signal(false);
  readonly createInvoiceError = signal('');

  readonly canCreateInvoice = computed(() => {
    const role = this.roleService.roleOrDefault();

    return (
      this.booking().status !== BookingStatus.CANCELLED &&
      (role === 'Manager' || role === 'Admin' || role === 'Back Office')
    );
  });

  onCreateInvoice(): void {
    const booking = this.booking();

    if (!this.canCreateInvoice() || this.creatingInvoice()) {
      return;
    }

    this.createInvoiceError.set('');
    this.creatingInvoice.set(true);

    const invoiceDate = todayIsoDate();
    const defaults$ = this.organizationSettingsService.get().pipe(
      map((settings) => {
        const paymentTermsDays = normalizePaymentTermsDays(settings.defaultPaymentTermsDays);

        return {
          dueDate: addDaysToIsoDate(invoiceDate, paymentTermsDays),
          language: normalizeInvoiceLanguage(settings.defaultLanguage),
          fallbackCurrency: normalizeInvoiceCurrency(settings.defaultCurrency),
        };
      }),
      catchError(() => {
        return of({
          dueDate: addDaysToIsoDate(invoiceDate, 1),
          language: 'EN',
          fallbackCurrency: 'EUR',
        });
      }),
    );

    forkJoin({
      client: this.clientsService.getById(booking.clientId),
      defaults: defaults$,
    })
      .pipe(
        switchMap(({ client, defaults }) => {
          const dto: CreateInvoiceDto = {
            bookingId: booking.id,
            clientType: this.normalizeClientType(client.type),
            invoiceDate,
            dueDate: defaults.dueDate,
            currency: booking.currency
              ? normalizeInvoiceCurrency(booking.currency)
              : defaults.fallbackCurrency,
            language: defaults.language,
          };

          return this.invoicesService.create(dto);
        }),
        finalize(() => this.creatingInvoice.set(false)),
      )
      .subscribe({
        next: (created) => {
          this.router.navigate(['/app/invoices', created.id]);
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 422) {
            this.createInvoiceError.set(
              $localize`:@@invoiceCreateNoBillableItems:This booking has no billable items. Please create the invoice manually.`,
            );

            return;
          }

          this.toast.showError(
            $localize`:@@invoiceCreateFromBookingFailed:Failed to create invoice from booking`,
          );
        },
      });
  }

  invoiceStatusClass(status: string): string {
    return INVOICE_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-500';
  }

  invoiceStatusLabel(status: string): string {
    return INVOICE_STATUS_LABELS[status] ?? status;
  }

  private normalizeClientType(type: unknown): ClientTypeValue {
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
