import { DatePipe } from '@angular/common';
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { calculateNights } from '@app/features/offers/offer-builder.utils';
import { MEAL_PLAN_OPTIONS } from '@app/shared/models';

import type { BookingAccommodationDto } from '@app/shared/models';

@Component({
  selector: 'app-accommodation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './accommodation-table.html',
  styleUrl: './accommodation-table.scss',
})
export class AccommodationTableComponent {
  private readonly fb = inject(FormBuilder);

  readonly accommodationDetails = input<BookingAccommodationDto[] | null | undefined>(null);
  readonly editable = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly hideActions = input<boolean>(false);
  readonly save = output<BookingAccommodationDto[]>();

  readonly rows = computed<BookingAccommodationDto[]>(() => {
    const details = this.accommodationDetails();

    if (!details) {
      return [];
    }

    return details.map((detail) => {
      if (detail.nights !== undefined && detail.nights !== null) {
        return detail;
      }

      if (!detail.checkinDate || !detail.checkoutDate) {
        return detail;
      }

      return {
        ...detail,
        nights: calculateNights(detail.checkinDate, detail.checkoutDate),
      };
    });
  });

  readonly editing = signal(false);
  readonly editRows = signal<BookingAccommodationDto[]>([]);

  readonly columns = [
    'hotel',
    'roomType',
    'mealPlan',
    'checkinDate',
    'checkoutDate',
    'nights',
    'total',
  ];
  readonly mealPlanOptions = MEAL_PLAN_OPTIONS;

  readonly rowForm = this.fb.nonNullable.group({
    hotelName: [''],
    roomType: [''],
    mealPlan: [''],
    checkinDate: [''],
    checkoutDate: [''],
    total: this.fb.control<number | null>(null),
  });

  startEdit(): void {
    this.editRows.set([...this.rows()]);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.rowForm.reset();
  }

  addRow(): void {
    const val = this.rowForm.getRawValue();
    let nights: number | undefined;

    if (val.checkinDate && val.checkoutDate) {
      nights = calculateNights(val.checkinDate, val.checkoutDate);
    }

    const row: BookingAccommodationDto = {
      hotelName: val.hotelName || undefined,
      roomType: val.roomType || undefined,
      mealPlan: val.mealPlan || undefined,
      checkinDate: val.checkinDate || undefined,
      checkoutDate: val.checkoutDate || undefined,
      total: val.total ?? undefined,
      nights,
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
