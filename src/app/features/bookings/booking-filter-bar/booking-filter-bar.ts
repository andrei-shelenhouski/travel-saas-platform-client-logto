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

const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  {
    value: BookingStatus.PENDING_CONFIRMATION,
    label: $localize`:@@bookingStatusOptionPendingConfirmation:Pending confirmation`,
  },
  {
    value: BookingStatus.CONFIRMED,
    label: $localize`:@@bookingStatusOptionConfirmed:Confirmed`,
  },
  {
    value: BookingStatus.IN_PROGRESS,
    label: $localize`:@@bookingStatusOptionInProgress:In progress`,
  },
  {
    value: BookingStatus.COMPLETED,
    label: $localize`:@@bookingStatusOptionCompleted:Completed`,
  },
  {
    value: BookingStatus.CANCELLED,
    label: $localize`:@@bookingStatusOptionCancelled:Cancelled`,
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
          departDateFrom: this.parseDate(value.departDateFrom),
          departDateTo: this.parseDate(value.departDateTo),
        },
        { emitEvent: false },
      );
    });

    this.form.valueChanges
      .pipe(
        distinctUntilChanged((a, b) =>
          this.compareFilters(
            {
              status: a.status ?? [],
              assignedBackofficeId: a.assignedBackofficeId ?? '',
              departDateFrom: this.formatDate(a.departDateFrom ?? null),
              departDateTo: this.formatDate(a.departDateTo ?? null),
            },
            {
              status: b.status ?? [],
              assignedBackofficeId: b.assignedBackofficeId ?? '',
              departDateFrom: this.formatDate(b.departDateFrom ?? null),
              departDateTo: this.formatDate(b.departDateTo ?? null),
            },
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((formValue) => {
        this.filterChange.emit({
          status: formValue.status ?? [],
          assignedBackofficeId: formValue.assignedBackofficeId ?? '',
          departDateFrom: this.formatDate(formValue.departDateFrom ?? null),
          departDateTo: this.formatDate(formValue.departDateTo ?? null),
        });
      });
  }

  private parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private formatDate(value: Date | null): string {
    if (!value) {
      return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private compareFilters(a: BookingListFilterValue, b: BookingListFilterValue): boolean {
    if (a.assignedBackofficeId !== b.assignedBackofficeId) {
      return false;
    }

    if (a.departDateFrom !== b.departDateFrom || a.departDateTo !== b.departDateTo) {
      return false;
    }

    if (a.status.length !== b.status.length) {
      return false;
    }

    return a.status.every((status, index) => status === b.status[index]);
  }
}
