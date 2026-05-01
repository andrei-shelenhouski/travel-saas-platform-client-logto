import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { DocumentRowComponent } from '@app/features/bookings/booking-detail/document-row/document-row';
import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentRowComponent, ConfirmationDialogComponent, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './document-list.html',
  styleUrl: './document-list.scss',
})
export class DocumentListComponent {
  readonly documents = input<BookingDocumentResponseDto[]>([]);
  readonly uploading = input<boolean>(false);

  readonly uploadFiles = output<File[]>();
  readonly deleteDocument = output<BookingDocumentResponseDto>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly deleteDialogOpen = signal(false);
  readonly pendingDelete = signal<BookingDocumentResponseDto | null>(null);
  readonly deleteConfirmMessage = signal('');

  triggerUpload(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const el = event.target as HTMLInputElement;
    const files = Array.from(el.files ?? []);

    if (files.length > 0) {
      this.uploadFiles.emit(files);
    }

    // Reset so the same file can be re-uploaded
    el.value = '';
  }

  onDeleteRequest(doc: BookingDocumentResponseDto): void {
    this.pendingDelete.set(doc);
    this.deleteConfirmMessage.set(
      $localize`:@@bookingDeleteDocumentConfirmation:Delete document "${doc.filename ?? 'Document'}:documentName:"? This action cannot be undone.`,
    );
    this.deleteDialogOpen.set(true);
  }

  onDeleteCancel(): void {
    this.deleteDialogOpen.set(false);
    this.pendingDelete.set(null);
  }

  onDeleteConfirm(): void {
    const doc = this.pendingDelete();

    if (doc) {
      this.deleteDocument.emit(doc);
    }

    this.deleteDialogOpen.set(false);
    this.pendingDelete.set(null);
  }
}
