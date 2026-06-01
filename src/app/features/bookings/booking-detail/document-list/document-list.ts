import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { DocumentRowComponent } from '@app/features/bookings/booking-detail/document-row/document-row';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog.component';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentRowComponent, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './document-list.html',
  styleUrl: './document-list.scss',
})
export class DocumentListComponent {
  private readonly dialog = inject(MatDialog);

  readonly documents = input<BookingDocumentResponseDto[]>([]);
  readonly uploading = input<boolean>(false);

  readonly uploadFiles = output<File[]>();
  readonly deleteDocument = output<BookingDocumentResponseDto>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

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
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Удалить документ',
          message: `Удалить документ "${doc.filename ?? 'Документ'}"? Это действие необратимо.`,
          confirmLabel: 'Удалить',
          destructive: true,
        },
        width: '400px',
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.deleteDocument.emit(doc);
        }
      });
  }
}
