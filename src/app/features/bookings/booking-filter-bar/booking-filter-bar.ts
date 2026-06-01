import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { distinctUntilChanged } from 'rxjs';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';
import { compareDateRangeFilters, formatDate, parseDate } from '@app/shared/utils/date.utils';

const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  {
    value: BookingStatus.PENDING_CONFIRMATION,
    label: 'Ожидает подтверждения',
  },
  {
    value: BookingStatus.CONFIRMED,
    label: 'Подтверждено',
  },
  {
    value: BookingStatus.IN_PROGRESS,
    label: 'В поездке',
  },
  {
    value: BookingStatus.COMPLETED,
    label: 'Завершено',
  },
  {
    value: BookingStatus.CANCELLED,
    label: 'Отменено',
  },
];

export type StaffOption = {
  id: string;
  name: string;
};

export type BookingListFilterValue = {
  status: BookingStatus[];
  assignedBackofficeId: string;
  departDateFrom: string;
  departDateTo: string;
};

@Component({
  selector: 'app-booking-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './booking-filter-bar.html',
  styleUrl: './booking-filter-bar.scss',
})
export class BookingFilterBarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<BookingListFilterValue>();
  readonly staffOptions = input.required<StaffOption[]>();

  readonly filterChange = output<BookingListFilterValue>();

  readonly statusOptions = BOOKING_STATUS_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    status: this.fb.nonNullable.control<BookingStatus[]>([]),
    assignedBackofficeId: this.fb.nonNullable.control(''),
    departDateFrom: this.fb.control<Date | null>(null),
    departDateTo: this.fb.control<Date | null>(null),
  });

  constructor() {
    effect(() => {
      const value = this.value();

      this.form.patchValue(
        {
          status: value.status,
          assignedBackofficeId: value.assignedBackofficeId,
          departDateFrom: parseDate(value.departDateFrom),
          departDateTo: parseDate(value.departDateTo),
        },
        { emitEvent: false },
      );
    });

    this.form.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => {
          const fa = {
            status: a.status ?? [],
            assignedBackofficeId: a.assignedBackofficeId ?? '',
            departDateFrom: formatDate(a.departDateFrom ?? null),
            departDateTo: formatDate(a.departDateTo ?? null),
          };
          const fb = {
            status: b.status ?? [],
            assignedBackofficeId: b.assignedBackofficeId ?? '',
            departDateFrom: formatDate(b.departDateFrom ?? null),
            departDateTo: formatDate(b.departDateTo ?? null),
          };

          return (
            fa.assignedBackofficeId === fb.assignedBackofficeId && compareDateRangeFilters(fa, fb)
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((formValue) => {
        this.filterChange.emit({
          status: formValue.status ?? [],
          assignedBackofficeId: formValue.assignedBackofficeId ?? '',
          departDateFrom: formatDate(formValue.departDateFrom ?? null),
          departDateTo: formatDate(formValue.departDateTo ?? null),
        });
      });
  }
}
