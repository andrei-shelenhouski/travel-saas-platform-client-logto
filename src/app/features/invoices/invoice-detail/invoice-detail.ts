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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { InvoicesService } from '@app/services/invoices.service';
import { PermissionService } from '@app/services/permission.service';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';

import type { InvoiceResponseDto } from '@app/shared/models';

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-detail',
  imports: [RouterLink, ReactiveFormsModule, ConfirmationDialogComponent, ...MAT_FORM_BUTTONS],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoicesService = inject(InvoicesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<InvoiceResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.invoicesService.getById(id);
    },
  });

  readonly invoice = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly statusBadgeClass = STATUS_BADGE_CLASS;
  readonly actionLoading = signal(false);
  readonly editing = signal(false);
  readonly confirmOpen = signal(false);
  readonly confirmPayload = signal<{
    action: 'CANCEL';
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  } | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    invoiceDate: [''],
    dueDate: [''],
    currency: [''],
    language: [''],
    paymentTerms: [''],
    internalNotes: [''],
  });

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
    if (!iso) {
      return '—';
    }
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
    const dto: {
      invoiceDate?: string;
      dueDate?: string;
      currency?: string;
      language?: string;
      paymentTerms?: string;
      internalNotes?: string;
    } = {};

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
      error: (err) => this.toast.showError(err.error?.message ?? err.message ?? 'Failed to update'),
      complete: () => this.actionLoading.set(false),
    });
  }

  cancelInvoice(): void {
    const inv = this.invoice();

    if (!inv || this.actionLoading()) {
      return;
    }

    this.confirmPayload.set({
      action: 'CANCEL',
      title: 'Cancel invoice',
      message: 'Are you sure you want to cancel this invoice?',
      confirmLabel: 'Cancel invoice',
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
    this.invoicesService.cancel(inv.id, { reason: 'Cancelled from CRM' }).subscribe({
      next: (updated) => {
        this.data.set(updated);
        this.toast.showSuccess('Invoice cancelled');
      },
      error: (err) =>
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to cancel invoice'),
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
