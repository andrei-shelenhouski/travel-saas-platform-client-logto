import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DocumentRowComponent } from '@app/features/bookings/booking-detail/document-row/document-row';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentRowComponent, MatButtonModule, MatIconModule],
  templateUrl: './document-list.html',
  styleUrl: './document-list.scss',
})
export class DocumentListComponent {
  private readonly confirmDialog = inject(ConfirmDialogService);

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
    this.confirmDialog
      .open({
        title: 'Удалить документ',
        message: `Удалить документ "${doc.filename ?? 'Документ'}"? Это действие необратимо.`,
        confirmLabel: 'Удалить',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteDocument.emit(doc);
        }
      });
  }
}
