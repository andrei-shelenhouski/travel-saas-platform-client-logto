import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <div class="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
      <div class="flex min-w-0 items-center gap-2">
        <mat-icon class="shrink-0 text-gray-400">insert_drive_file</mat-icon>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-900">
            {{ document().filename || 'Документ' }}
          </p>
          @if (document().uploadedAt) {
            <p class="text-xs text-gray-500">
              {{ document().uploadedAt | date: 'medium' }}
              @if (document().uploadedByName) {
                &middot; {{ document().uploadedByName }}
              }
            </p>
          }
        </div>
      </div>

      <button
        aria-label="Удалить документ"
        color="warn"
        mat-icon-button
        type="button"
        (click)="delete.emit(document())"
      >
        <mat-icon>delete</mat-icon>
      </button>
    </div>
  `,
})
export class DocumentRowComponent {
  readonly document = input.required<BookingDocumentResponseDto>();
  readonly delete = output<BookingDocumentResponseDto>();
}
