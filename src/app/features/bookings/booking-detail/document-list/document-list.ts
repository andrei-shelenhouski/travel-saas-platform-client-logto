import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { ConfirmationDialogComponent } from '@app/shared/components/confirmation-dialog.component';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import { DocumentRowComponent } from './document-row';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentRowComponent, ConfirmationDialogComponent, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Документы</h2>
        <button mat-stroked-button type="button" [disabled]="uploading()" (click)="triggerUpload()">
          <mat-icon>upload</mat-icon>
          Загрузить
        </button>
      </div>

      <!-- hidden file input -->
      <input
        #fileInput
        accept="*/*"
        class="hidden"
        multiple
        type="file"
        (change)="onFileSelected($event)"
      />

      <div class="mt-3 space-y-2">
        @for (doc of documents(); track doc.id) {
          <app-document-row [document]="doc" (delete)="onDeleteRequest($event)" />
        } @empty {
          <p class="text-sm text-gray-500">Документы не загружены</p>
        }
      </div>
    </section>

    <app-confirmation-dialog
      cancelLabel="Отмена"
      confirmLabel="Удалить"
      [danger]="true"
      [message]="deleteConfirmMessage()"
      [open]="deleteDialogOpen()"
      [title]="'Удалить документ'"
      (cancel)="onDeleteCancel()"
      (confirm)="onDeleteConfirm()"
    />
  `,
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
      `Удалить документ "${doc.filename ?? 'Документ'}"? Это действие необратимо.`,
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
