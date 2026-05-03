import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { InvoicePdfPreviewModalComponent } from '@app/features/invoices/invoice-pdf-preview-modal';
import { PublishInvoiceDialogComponent } from '@app/features/invoices/publish-invoice-dialog/publish-invoice-dialog';
import { RecordPaymentModalComponent } from '@app/features/invoices/record-payment-modal/record-payment-modal';
import { ActivitiesService } from '@app/services/activities.service';
import { InvoicesService } from '@app/services/invoices.service';
import { PermissionService } from '@app/services/permission.service';
import { ActivityTimelineComponent } from '@app/shared/components/activity-timeline.component';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { EntityType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import type {
  ActivityTimelineItem,
  InvoiceResponseDto,
  PaymentResponseDto,
} from '@app/shared/models';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
  CARD: 'Card',
  OTHER: 'Other',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    DecimalPipe,
    ActivityTimelineComponent,
    ConfirmationDialogComponent,
    ...MAT_FORM_BUTTONS,
    ...MAT_ICONS,
  ],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoicesService = inject(InvoicesService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
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
              label: a.type,
              date: a.createdAt,
              type: a.type === 'CREATED' ? 'created' : a.type === 'UPDATED' ? 'updated' : 'status',
            })),
          ),
        );
    },
  });

  // ---- Derived state ----

  readonly invoice = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly timelineItems = computed(() => this.activitiesData.value() ?? []);

  readonly invoiceActions = computed<string[]>(() => {
    const inv = this.invoice();

    if (!inv) {
      return [];
    }

    return this.getInvoiceActions(inv.status);
  });

  readonly isB2bAgent = computed(() => this.invoice()?.clientType === 'B2B_AGENT');

  readonly displayedColumns = computed<string[]>(() => {
    if (this.isB2bAgent()) {
      return [
        'description',
        'serviceDates',
        'travelers',
        'tourCost',
        'commissionAmount',
        'commissionVat',
        'netToPay',
      ];
    }

    return ['description', 'serviceDates', 'travelers', 'unitPrice', 'quantity', 'total'];
  });

  readonly lineItems = computed(() => this.invoice()?.lineItems ?? []);

  readonly payments = computed<PaymentResponseDto[]>(() => {
    const inv = this.invoice();

    return (inv?.payments ?? []) as PaymentResponseDto[];
  });

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

    if (!inv?.clientSnapshot) {
      return '—';
    }
    try {
      const snap = JSON.parse(inv.clientSnapshot) as { fullName?: string };

      return snap.fullName ?? '—';
    } catch {
      return '—';
    }
  });

  // ---- UI state ----

  readonly actionLoading = signal(false);
  readonly editing = signal(false);
  readonly cancelDialogOpen = signal(false);
  readonly deletePaymentConfirmOpen = signal(false);
  readonly pendingDeletePaymentId = signal<string | null>(null);
  readonly pendingDeletePaymentLabel = signal<string>('');
  readonly deletePaymentMessage = computed(
    () =>
      $localize`:@@invoiceDetailDeletePaymentMessage:Delete payment of ${this.pendingDeletePaymentLabel()}:AMOUNT:? This action is irreversible.`,
  );

  // ---- Forms ----

  readonly editForm = this.fb.nonNullable.group({
    invoiceDate: [''],
    dueDate: [''],
    currency: [''],
    language: [''],
    paymentTerms: [''],
    internalNotes: [''],
  });

  readonly cancelReasonControl = this.fb.nonNullable.control('');

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

  getPaymentMethodLabel(method: string): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  hasAction(action: string): boolean {
    return this.invoiceActions().includes(action);
  }

  canDeletePayment(): boolean {
    const status = this.invoice()?.status;

    return (
      (status === 'ISSUED' || status === 'PARTIALLY_PAID') && this.permissions.canDeleteInvoice()
    );
  }

  formatDateOnly(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return iso.slice(0, 10);
  }

  formatServiceDates(from?: string | null, to?: string | null): string {
    if (!from && !to) {
      return '—';
    }

    if (from && to) {
      return `${this.formatDateOnly(from)} – ${this.formatDateOnly(to)}`;
    }

    return this.formatDateOnly(from ?? to);
  }

  // ---- Edit ----

  startEdit(): void {
    const inv = this.invoice();

    if (!inv) {
      return;
    }
    this.editForm.patchValue({
      invoiceDate: this.formatDateOnly(inv.invoiceDate),
      dueDate: this.formatDateOnly(inv.dueDate),
      currency: inv.currency ?? '',
      language: inv.language ?? '',
      paymentTerms: inv.paymentTerms ?? '',
      internalNotes: inv.internalNotes ?? '',
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    const inv = this.invoice();

    if (!inv || this.actionLoading()) {
      return;
    }
    this.actionLoading.set(true);
    const v = this.editForm.getRawValue();
    const dto: Parameters<typeof this.invoicesService.update>[1] = {};

    if (v.invoiceDate.trim()) {
      dto.invoiceDate = v.invoiceDate.trim();
    }

    if (v.dueDate.trim()) {
      dto.dueDate = v.dueDate.trim();
    }

    if (v.currency.trim()) {
      dto.currency = v.currency.trim().toUpperCase();
    }

    if (v.language.trim()) {
      dto.language = v.language.trim();
    }

    if (v.paymentTerms.trim()) {
      dto.paymentTerms = v.paymentTerms.trim();
    }

    if (v.internalNotes.trim()) {
      dto.internalNotes = v.internalNotes.trim();
    }
    this.invoicesService.update(inv.id, dto).subscribe({
      next: (updated) => {
        this.data.set(updated);
        this.editing.set(false);
      },
      error: (err) =>
        this.toast.showError(err.error?.message ?? err.message ?? 'Ошибка обновления'),
      complete: () => this.actionLoading.set(false),
    });
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
    this.cancelReasonControl.reset('');
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
      this.toast.showError('Укажите причину отмены');

      return;
    }
    this.actionLoading.set(true);
    this.invoicesService.cancel(inv.id, { reason }).subscribe({
      next: (updated) => {
        this.data.set(updated);
        this.activitiesData.reload();
        this.cancelDialogOpen.set(false);
        this.toast.showSuccess('Счёт отменён');
      },
      error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Ошибка отмены'),
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
        this.toast.showError(err.error?.message ?? err.message ?? 'Ошибка скачивания PDF'),
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
      this.activitiesData.reload();
    });
  }

  confirmDeletePayment(payment: PaymentResponseDto): void {
    this.pendingDeletePaymentId.set(payment.id);
    this.pendingDeletePaymentLabel.set(`${payment.amount} ${payment.currency}`);
    this.deletePaymentConfirmOpen.set(true);
  }

  onDeletePaymentConfirm(): void {
    const inv = this.invoice();
    const paymentId = this.pendingDeletePaymentId();

    if (!inv || !paymentId || this.actionLoading()) {
      return;
    }
    this.actionLoading.set(true);
    this.invoicesService.deletePayment(inv.id, paymentId).subscribe({
      next: () => {
        this.data.reload();
        this.activitiesData.reload();
        this.toast.showSuccess('Платёж удалён');
      },
      error: (err) =>
        this.toast.showError(err.error?.message ?? err.message ?? 'Ошибка удаления платежа'),
      complete: () => {
        this.actionLoading.set(false);
        this.deletePaymentConfirmOpen.set(false);
        this.pendingDeletePaymentId.set(null);
        this.pendingDeletePaymentLabel.set('');
      },
    });
  }

  onDeletePaymentCancel(): void {
    this.deletePaymentConfirmOpen.set(false);
    this.pendingDeletePaymentId.set(null);
    this.pendingDeletePaymentLabel.set('');
  }

  // ---- Private helpers ----

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
