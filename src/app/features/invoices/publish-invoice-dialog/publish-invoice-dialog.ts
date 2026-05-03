import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvoicePdfPreviewModalComponent } from '@app/features/invoices/invoice-pdf-preview-modal';
import { InvoicesService } from '@app/services/invoices.service';
import { MAT_BUTTONS, MAT_DIALOG, MAT_ICONS } from '@app/shared/material-imports';

import type { InvoiceResponseDto } from '@app/shared/models';

export type PublishInvoiceDialogData = {
  invoiceId: string;
  invoiceNumber: string;
};

export type PublishInvoiceDialogResult = {
  published: true;
  invoice: InvoiceResponseDto;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-publish-invoice-dialog',
  imports: [...MAT_DIALOG, ...MAT_BUTTONS, ...MAT_ICONS, MatProgressSpinnerModule],
  templateUrl: './publish-invoice-dialog.html',
  styleUrl: './publish-invoice-dialog.scss',
})
export class PublishInvoiceDialogComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(
    MatDialogRef<PublishInvoiceDialogComponent, PublishInvoiceDialogResult>,
  );

  protected readonly data = inject<PublishInvoiceDialogData>(MAT_DIALOG_DATA);
  protected readonly loading = signal(false);

  protected previewPdf(): void {
    this.dialog.open(InvoicePdfPreviewModalComponent, {
      data: { invoiceId: this.data.invoiceId, invoiceNumber: this.data.invoiceNumber },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.invoicesService.publish(this.data.invoiceId).subscribe({
      next: (invoice) => {
        this.dialogRef.close({ published: true, invoice });
        this.snackBar.open(
          $localize`:@@publishInvoiceDialogSuccessMessage:Invoice published and issued to the client.`,
          $localize`:@@publishInvoiceDialogSuccessAction:OK`,
          { duration: 4000 },
        );
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open(
          $localize`:@@publishInvoiceDialogErrorMessage:Error publishing invoice. Please try again.`,
          $localize`:@@publishInvoiceDialogErrorAction:Dismiss`,
          { duration: 5000 },
        );
      },
    });
  }
}
