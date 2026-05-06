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
import { RequestStatus } from '@app/shared/models';

const REQUEST_STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  {
    value: RequestStatus.OPEN,
    label: $localize`:@@requestStatusOptionOpen:Open`,
  },
  {
    value: RequestStatus.QUOTED,
    label: $localize`:@@requestStatusOptionQuoted:Quoted`,
  },
  {
    value: RequestStatus.CLOSED,
    label: $localize`:@@requestStatusOptionClosed:Closed`,
  },
];

export type ManagerOption = {
  id: string;
  name: string;
};

export type RequestListFilterValue = {
  status: RequestStatus[];
  managerId: string;
  departDateFrom: string;
  departDateTo: string;
};

@Component({
  selector: 'app-request-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './request-filter-bar.html',
  styleUrl: './request-filter-bar.scss',
})
export class RequestFilterBarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<RequestListFilterValue>();
  readonly managerOptions = input.required<ManagerOption[]>();

  readonly filterChange = output<RequestListFilterValue>();

  readonly statusOptions = REQUEST_STATUS_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    status: this.fb.nonNullable.control<RequestStatus[]>([]),
    managerId: this.fb.nonNullable.control(''),
    departDateFrom: this.fb.control<Date | null>(null),
    departDateTo: this.fb.control<Date | null>(null),
  });

  constructor() {
    effect(() => {
      const value = this.value();

      this.form.patchValue(
        {
          status: value.status,
          managerId: value.managerId,
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
              managerId: a.managerId ?? '',
              departDateFrom: this.formatDate(a.departDateFrom ?? null),
              departDateTo: this.formatDate(a.departDateTo ?? null),
            },
            {
              status: b.status ?? [],
              managerId: b.managerId ?? '',
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
          managerId: formValue.managerId ?? '',
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

  private compareFilters(a: RequestListFilterValue, b: RequestListFilterValue): boolean {
    if (a.managerId !== b.managerId) {
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
