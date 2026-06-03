import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

import type {
  BookingServiceInputEntryDto,
  BookingServiceSnapshotEntryDto,
} from '@app/shared/models';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  TRANSFER: 'Трансфер',
  EXCURSION: 'Экскурсия',
  VISA: 'Виза',
  INSURANCE: 'Страховка',
  FLIGHT: 'Перелет',
  OTHER: 'Другое',
};

@Component({
  selector: 'app-additional-services-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './additional-services-table.html',
  styleUrl: './additional-services-table.scss',
})
export class AdditionalServicesTableComponent {
  private readonly fb = inject(FormBuilder);

  readonly services = input<BookingServiceSnapshotEntryDto[] | null | undefined>(null);
  readonly currency = input<string | null | undefined>(null);
  readonly editable = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly save = output<BookingServiceInputEntryDto[]>();

  readonly rows = computed<BookingServiceSnapshotEntryDto[]>(() => this.services() ?? []);

  readonly editing = signal(false);
  readonly editRows = signal<BookingServiceInputEntryDto[]>([]);

  readonly rowForm = this.fb.nonNullable.group({
    type: [''],
    description: [''],
    qty: this.fb.control<number | null>(1),
    unitPrice: this.fb.control<number | null>(null),
    currency: [''],
  });

  serviceTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return '—';
    }

    return SERVICE_TYPE_LABELS[type] ?? type;
  }

  startEdit(): void {
    this.editRows.set(
      this.rows().map((row) => ({
        type: row.serviceType,
        description: row.description,
        qty: row.quantity,
        unitPrice: row.unitPrice,
        currency: this.currency() ?? undefined,
      })),
    );
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.rowForm.reset();
  }

  addRow(): void {
    const val = this.rowForm.getRawValue();
    const row: BookingServiceInputEntryDto = {
      type: val.type || undefined,
      description: val.description || undefined,
      qty: val.qty ?? undefined,
      unitPrice: val.unitPrice ?? undefined,
      currency: val.currency || undefined,
    };

    this.editRows.update((rows) => [...rows, row]);
    this.rowForm.reset();
  }

  removeRow(index: number): void {
    this.editRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  onSave(): void {
    this.save.emit(this.editRows());
    this.editing.set(false);
  }
}
