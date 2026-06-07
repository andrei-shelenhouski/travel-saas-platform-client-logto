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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { finalize } from 'rxjs/operators';

import { OffersService } from '@app/services/offers.service';

export type OfferPdfPreviewModalData = {
  offerId: string;
  offerNumber?: string;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offer-pdf-preview-modal',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './offer-pdf-preview-modal.html',
  styleUrl: './offer-pdf-preview-modal.scss',
})
export class OfferPdfPreviewModalComponent implements OnInit, OnDestroy {
  private readonly offersService = inject(OffersService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialogRef = inject(MatDialogRef<OfferPdfPreviewModalComponent>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly data = inject<OfferPdfPreviewModalData>(MAT_DIALOG_DATA);

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly errorMessage = signal('Не удалось загрузить PDF. Попробуйте еще раз.');
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

  protected downloadPdf(): void {
    const objectUrl = this.blobUrl;

    if (!objectUrl) {
      return;
    }

    const safeOfferNumber = (this.data.offerNumber ?? this.data.offerId).replace(
      /[^a-zA-Z0-9_-]/g,
      '-',
    );
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = `offer-${safeOfferNumber}.pdf`;
    link.click();
  }

  private loadPdf(): void {
    this.loading.set(true);
    this.error.set(false);

    this.offersService
      .getPdf(this.data.offerId)
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
