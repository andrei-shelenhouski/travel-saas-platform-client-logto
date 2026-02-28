import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { InvoicesService } from '../../../services/invoices.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog.component';
import type { InvoiceResponseDto } from '../../../shared/models';
import { InvoiceStatus } from '../../../shared/models';

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: InvoiceStatus.DRAFT, label: 'Draft' },
  { value: InvoiceStatus.SENT, label: 'Sent' },
  { value: InvoiceStatus.PAID, label: 'Paid' },
  { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
];

@Component({
  selector: 'app-invoice-detail',
  imports: [RouterLink, FormsModule, ConfirmationDialogComponent],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.css',
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoicesService = inject(InvoicesService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<InvoiceResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.invoicesService.getById(id);
    },
  });

  readonly invoice = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly statusOptions = STATUS_OPTIONS;
  readonly actionLoading = signal(false);
  readonly editing = signal(false);
  readonly confirmOpen = signal(false);
  readonly confirmPayload = signal<{ action: 'DELETE'; title: string; message: string; confirmLabel: string; danger: boolean } | null>(null);

  editStatus: InvoiceStatus = InvoiceStatus.DRAFT;
  editDueDate = '';
  editPdfUrl = '';

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/invoices']);
      }
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  formatDateOnly(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch {
      return iso;
    }
  }

  getStatusBadgeClass(status: string): string {
    return STATUS_BADGE_CLASS[status] ?? 'bg-gray-100 text-gray-500';
  }

  startEdit(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.editStatus = (inv.status as InvoiceStatus) ?? InvoiceStatus.DRAFT;
    this.editDueDate = this.formatDateOnly(inv.dueDate);
    this.editPdfUrl = inv.pdfUrl ?? '';
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    const inv = this.invoice();
    if (!inv || this.actionLoading()) return;
    this.actionLoading.set(true);
    const dto: { status?: InvoiceStatus; dueDate?: string; pdfUrl?: string } = {
      status: this.editStatus,
    };
    if (this.editDueDate.trim()) dto.dueDate = this.editDueDate.trim();
    if (this.editPdfUrl.trim()) dto.pdfUrl = this.editPdfUrl.trim();

    this.invoicesService.update(inv.id, dto).subscribe({
      next: (updated) => {
        this.data.set(updated);
        this.editing.set(false);
      },
      error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to update'),
      complete: () => this.actionLoading.set(false),
    });
  }

  deleteInvoice(): void {
    const inv = this.invoice();
    if (!inv || this.actionLoading()) return;
    this.confirmPayload.set({
      action: 'DELETE',
      title: 'Delete invoice',
      message: 'Are you sure you want to delete this invoice?',
      confirmLabel: 'Delete',
      danger: true,
    });
    this.confirmOpen.set(true);
  }

  onConfirmDialogConfirm(): void {
    const payload = this.confirmPayload();
    const inv = this.invoice();
    if (!payload || !inv) {
      this.confirmOpen.set(false);
      return;
    }
    this.actionLoading.set(true);
    this.invoicesService.delete(inv.id).subscribe({
      next: () => {
        this.toast.showSuccess('Invoice deleted');
        this.router.navigate(['/app/invoices']);
      },
      error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to delete'),
      complete: () => {
        this.actionLoading.set(false);
        this.confirmOpen.set(false);
        this.confirmPayload.set(null);
      },
    });
  }

  onConfirmDialogCancel(): void {
    this.confirmOpen.set(false);
    this.confirmPayload.set(null);
  }
}
