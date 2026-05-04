import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { finalize } from 'rxjs/operators';

import { InvoicesService } from '@app/services/invoices.service';
import { MAT_BUTTONS, MAT_DIALOG, MAT_ICONS } from '@app/shared/material-imports';

export type InvoicePdfPreviewModalData = {
  invoiceId: string;
  invoiceNumber: string;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-pdf-preview-modal',
  imports: [...MAT_DIALOG, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './invoice-pdf-preview-modal.html',
  styleUrl: './invoice-pdf-preview-modal.scss',
})
export class InvoicePdfPreviewModalComponent implements OnInit, OnDestroy {
  private readonly invoicesService = inject(InvoicesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogRef = inject(MatDialogRef<InvoicePdfPreviewModalComponent>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly data = inject<InvoicePdfPreviewModalData>(MAT_DIALOG_DATA);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly errorMessage = signal(
    $localize`:@@invoicePdfPreviewLoadError:Unable to load PDF. Please try again.`,
  );
  protected readonly pdfUrl = signal<SafeResourceUrl | null>(null);

  private blobUrl: string | null = null;

  ngOnInit(): void {
    this.loadPdf();
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected retry(): void {
    this.loadPdf();
  }

  protected downloadPdf(): void {
    const objectUrl = this.blobUrl;

    if (!objectUrl) {
      return;
    }

    const safeNumber = this.data.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = `invoice-${safeNumber}.pdf`;
    link.click();
  }

  private loadPdf(): void {
    this.loading.set(true);
    this.error.set(false);

    this.invoicesService
      .getPdf(this.data.invoiceId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (blob) => {
          this.revokeBlobUrl();
          this.blobUrl = URL.createObjectURL(blob);
          this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
        },
        error: () => {
          this.revokeBlobUrl();
          this.error.set(true);
          this.pdfUrl.set(null);
        },
      });
  }

  private revokeBlobUrl(): void {
    if (!this.blobUrl) {
      return;
    }

    URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = null;
  }
}
