import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvoicePdfPreviewModalComponent } from '@app/features/invoices/invoice-pdf-preview-modal';
import { InvoicesService } from '@app/services/invoices.service';

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
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
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
    this.dialogRef.disableClose = true;
    this.invoicesService.publish(this.data.invoiceId).subscribe({
      next: (invoice) => {
        this.dialogRef.close({ published: true, invoice });
        this.snackBar.open('Счёт опубликован и выставлен клиенту.', 'OK', { duration: 4000 });
      },
      error: () => {
        this.loading.set(false);
        this.dialogRef.disableClose = false;
        this.snackBar.open('Ошибка при публикации. Попробуйте ещё раз.', 'Закрыть', {
          duration: 5000,
        });
      },
    });
  }
}
