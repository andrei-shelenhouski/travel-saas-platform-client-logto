import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { InvoiceLineItemsTableComponent } from '@app/features/invoices/invoice-detail/invoice-line-items-table';
import { InvoicePdfPreviewModalComponent } from '@app/features/invoices/invoice-pdf-preview-modal';
import { PublishInvoiceDialogComponent } from '@app/features/invoices/publish-invoice-dialog/publish-invoice-dialog';
import { RecordPaymentModalComponent } from '@app/features/invoices/record-payment-modal/record-payment-modal';
import { ActivitiesService } from '@app/services/activities.service';
import { ClientsService } from '@app/services/clients.service';
import { InvoicesService } from '@app/services/invoices.service';
import { PermissionService } from '@app/services/permission.service';
import { ActivityTimelineComponent } from '@app/shared/components/activity-timeline.component';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import {
  DetailSectionComponent,
  LoadingStateComponent,
  PageContentComponent,
} from '@app/shared/components';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { PAYMENT_METHOD_LABELS } from '@app/shared/utils/payment-method-labels';
import { CLIENT_TYPE_OPTIONS, EntityType } from '@app/shared/models';

import type {
  ActivityTimelineItem,
  ClientResponseDto,
  InvoiceResponseDto,
  PaymentResponseDto,
} from '@app/shared/models';

const CLIENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  CLIENT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

type LoadError = {
  status?: number;
  error?: { message?: string };
  message?: string;
};

const INVOICE_ACTIVITY_LABELS: Record<string, string> = {
  invoice_created: 'Счёт создан',
  invoice_updated: 'Счёт обновлён',
  status_changed: 'Статус изменён',
  payment_recorded: 'Платёж записан',
  payment_deleted: 'Платёж удалён',
  invoice_cancelled: 'Счёт отменён',
  invoice_published: 'Счёт опубликован',
};

function invoiceActivityType(type: string): 'created' | 'updated' | 'status' {
  if (type.endsWith('_created')) {
    return 'created';
  }

  if (type.endsWith('_updated') || type.endsWith('_published')) {
    return 'updated';
  }

  return 'status';
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  ISSUED: 'Выставлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-detail',
  imports: [
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    ActivityTimelineComponent,
    InvoiceLineItemsTableComponent,
    PageHeading,
    PageHeadingAction,
    LoadingStateComponent,
    PageContentComponent,
    DetailSectionComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoicesService = inject(InvoicesService);
  private readonly clientsService = inject(ClientsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly titleService = inject(Title);
  readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<InvoiceResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (params === null) {
        return EMPTY;
      }

      return this.invoicesService.getById(params);
    },
  });

  private readonly activitiesData = rxResource<ActivityTimelineItem[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (params === null) {
        return EMPTY;
      }

      return this.activitiesService
        .findByEntity({ entityType: EntityType.Invoice, entityId: params })
        .pipe(
          map((r) =>
            r.items.map<ActivityTimelineItem>((a) => ({
              id: a.id,
              label: INVOICE_ACTIVITY_LABELS[a.type] ?? a.type.replaceAll('_', ' '),
              date: a.createdAt,
              type: invoiceActivityType(a.type),
            })),
          ),
        );
    },
  });

  private readonly paymentsData = rxResource<PaymentResponseDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (params === null) {
        return EMPTY;
      }

      return this.invoicesService.listPayments(params);
    },
  });

  // ---- Derived state ----

  readonly invoice = computed(() => this.data.value() ?? null);

  private readonly _titleEffect = effect(() => {
    const inv = this.invoice();

    if (inv?.number) {
      this.titleService.setTitle(`Счёт ${inv.number} — Navio`);
    }
  });

  readonly loading = computed(() => this.data.isLoading());
  readonly timelineItems = computed(() => this.activitiesData.value() ?? []);

  readonly hasError = computed(() => this.data.error() !== undefined && this.data.error() !== null);

  readonly loadErrorMessage = computed(() => {
    const error = this.data.error() as LoadError | undefined;

    if (!error) {
      return '';
    }

    if (error.status === 404) {
      return 'Счёт не найден';
    }

    if (error.status === 403) {
      return 'У вас нет доступа к этому счёту';
    }

    return error.error?.message ?? error.message ?? 'Не удалось загрузить счёт';
  });

  private readonly unresolvedClientId = computed(() => {
    const inv = this.invoice();

    if (!inv) {
      return null;
    }

    if (this.resolveClientNameFromInvoice(inv) !== null) {
      return null;
    }

    return inv.clientId;
  });

  private readonly clientData = rxResource<ClientResponseDto, string | null>({
    params: (): string | null => this.unresolvedClientId(),
    stream: ({ params }) => {
      if (params === null) {
        return EMPTY;
      }

      return this.clientsService.getById(params);
    },
  });

  readonly invoiceActions = computed<string[]>(() => {
    const inv = this.invoice();

    if (!inv) {
      return [];
    }

    return this.getInvoiceActions(inv.status);
  });
  readonly canPublishInvoice = computed(() => this.permissions.canPublishInvoice());
  readonly canRecordInvoicePayment = computed(() => this.permissions.canRecordInvoicePayment());
  readonly canCancelInvoice = computed(() => this.permissions.canDeleteInvoice());

  readonly isB2bAgent = computed(() => this.invoice()?.clientType === 'B2B_AGENT');

  readonly omitLineItemColumns = computed<string[]>(() => {
    if (this.isB2bAgent()) {
      return ['unitPrice', 'quantity', 'total'];
    }

    return ['tourCost', 'commissionAmount', 'commissionVat', 'netToPay'];
  });

  readonly lineItems = computed(() => this.invoice()?.lineItems ?? []);

  readonly payments = computed<PaymentResponseDto[]>(() => this.paymentsData.value() ?? []);

  readonly paidAmount = computed(() =>
    this.payments().reduce((sum, p) => sum + (p.amount ?? 0), 0),
  );

  readonly remainingAmount = computed(() => {
    const inv = this.invoice();
    const invoiceTotal = inv?.total ?? inv?.subtotal ?? 0;

    return Math.max(invoiceTotal - this.paidAmount(), 0);
  });

  readonly clientName = computed<string>(() => {
    const inv = this.invoice();

    if (!inv) {
      return '—';
    }

    const nameFromInvoice = this.resolveClientNameFromInvoice(inv);

    if (nameFromInvoice !== null) {
      return nameFromInvoice;
    }

    const fallbackClientName = this.resolveClientNameFromClient(this.clientData.value());

    if (fallbackClientName !== null) {
      return fallbackClientName;
    }

    return '—';
  });

  // ---- UI state ----

  readonly actionLoading = signal(false);
  readonly cancelDialogOpen = signal(false);

  // ---- Forms ----

  readonly cancelReasonControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/invoices']);
      }
    });
  }

  // ---- Helper methods ----

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  getClientTypeLabel(type: string | undefined): string {
    if (!type) {
      return '—';
    }

    return CLIENT_TYPE_LABELS[type] ?? type;
  }

  getPaymentMethodLabel(method: string): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  hasAction(action: string): boolean {
    return this.invoiceActions().includes(action);
  }

  canDeletePayment(): boolean {
    const status = this.invoice()?.status;

    return (status === 'ISSUED' || status === 'PARTIALLY_PAID') && this.canRecordInvoicePayment();
  }

  formatDateOnly(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return iso.slice(0, 10);
  }

  // ---- Edit ----

  goToEditPage(): void {
    const inv = this.invoice();

    if (!inv) {
      return;
    }

    this.router.navigate(['/app/invoices', inv.id, 'edit']);
  }

  // ---- Publish ----

  publishInvoice(): void {
    const inv = this.invoice();

    if (!inv) {
      return;
    }

    const dialogRef = this.dialog.open(PublishInvoiceDialogComponent, {
      data: { invoiceId: inv.id, invoiceNumber: inv.number },
      width: '480px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.published) {
        return;
      }

      this.data.set(result.invoice);
      this.activitiesData.reload();
    });
  }

  // ---- Cancel ----

  openCancelDialog(): void {
    this.cancelReasonControl.setValue('');
    this.cancelDialogOpen.set(true);
  }

  closeCancelDialog(): void {
    this.cancelDialogOpen.set(false);
  }

  confirmCancel(): void {
    const inv = this.invoice();

    if (!inv || this.actionLoading()) {
      return;
    }
    const reason = this.cancelReasonControl.value.trim();

    if (!reason) {
      this.snackBar.open('Укажите причину отмены', 'Close', { duration: 5000 });

      return;
    }
    this.actionLoading.set(true);
    this.invoicesService.cancel(inv.id, { reason }).subscribe({
      next: (updated) => {
        this.data.set(updated);
        this.activitiesData.reload();
        this.cancelDialogOpen.set(false);
        this.snackBar.open('Счёт отменён', 'Close', { duration: 4000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? err.message ?? 'Ошибка отмены', 'Close', {
          duration: 5000,
        }),
      complete: () => this.actionLoading.set(false),
    });
  }

  // ---- PDF ----

  openPdfPreview(): void {
    const inv = this.invoice();

    if (!inv) {
      return;
    }

    this.dialog.open(InvoicePdfPreviewModalComponent, {
      data: { invoiceId: inv.id, invoiceNumber: inv.number },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
  }

  downloadPdf(): void {
    const inv = this.invoice();

    if (!inv || this.actionLoading()) {
      return;
    }
    this.actionLoading.set(true);
    this.invoicesService.getPdf(inv.id).subscribe({
      next: (blob) => {
        const sanitized = inv.number.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
        const fileName = sanitized.length ? `${sanitized}.pdf` : 'invoice.pdf';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? err.message ?? 'Ошибка скачивания PDF', 'Close', {
          duration: 5000,
        }),
      complete: () => this.actionLoading.set(false),
    });
  }

  // ---- Payments ----

  openRecordPayment(): void {
    const inv = this.invoice();

    if (!inv) {
      return;
    }

    const outstandingAmount = this.remainingAmount();
    const dialogRef = this.dialog.open(RecordPaymentModalComponent, {
      data: {
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        currency: inv.currency,
        outstandingAmount,
      },
      width: '480px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.refresh) {
        return;
      }

      this.data.reload();
      this.paymentsData.reload();
      this.activitiesData.reload();
    });
  }

  confirmDeletePayment(payment: PaymentResponseDto): void {
    const inv = this.invoice();

    if (!inv || this.actionLoading()) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить платёж',
        message: `Удалить платёж на ${payment.amount} ${payment.currency}?`,
        confirmLabel: 'Удалить',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.actionLoading.set(true);
        this.invoicesService.deletePayment(inv.id, payment.id).subscribe({
          next: () => {
            this.data.reload();
            this.paymentsData.reload();
            this.activitiesData.reload();
            this.snackBar.open('Платёж удалён', 'Close', { duration: 4000 });
          },
          error: (err) =>
            this.snackBar.open(
              err.error?.message ?? err.message ?? 'Ошибка удаления платежа',
              'Close',
              { duration: 5000 },
            ),
          complete: () => this.actionLoading.set(false),
        });
      });
  }

  // ---- Private helpers ----

  private resolveClientNameFromInvoice(invoice: InvoiceResponseDto): string | null {
    const directClientName = invoice.clientName?.trim();

    if (directClientName) {
      return directClientName;
    }

    const snapshotRaw = invoice.clientSnapshot?.trim();

    if (!snapshotRaw) {
      return null;
    }

    try {
      const snapshot = JSON.parse(snapshotRaw) as {
        fullName?: string | null;
        companyName?: string | null;
      };
      const snapshotName = snapshot.fullName?.trim() ?? snapshot.companyName?.trim() ?? '';

      if (snapshotName) {
        return snapshotName;
      }

      return null;
    } catch {
      return snapshotRaw;
    }
  }

  private resolveClientNameFromClient(client: ClientResponseDto | undefined): string | null {
    if (!client) {
      return null;
    }

    const fullName = client.fullName?.trim();

    if (fullName) {
      return fullName;
    }

    const companyName = client.companyName?.trim();

    if (companyName) {
      return companyName;
    }

    return null;
  }

  private getInvoiceActions(status: string): string[] {
    switch (status) {
      case 'DRAFT':
        return ['edit', 'publish', 'cancel'];
      case 'ISSUED':
        return ['record_payment', 'download_pdf', 'cancel'];
      case 'PARTIALLY_PAID':
        return ['record_payment', 'download_pdf'];
      case 'OVERDUE':
        return ['record_payment', 'download_pdf'];
      case 'PAID':
        return ['download_pdf'];
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  }
}
