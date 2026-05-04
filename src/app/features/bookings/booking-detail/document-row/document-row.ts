import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './document-row.html',
  styleUrl: './document-row.scss',
})
export class DocumentRowComponent {
  readonly document = input.required<BookingDocumentResponseDto>();
  readonly delete = output<BookingDocumentResponseDto>();
}
