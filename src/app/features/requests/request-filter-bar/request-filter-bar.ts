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
import { compareDateRangeFilters, formatDate, parseDate } from '@app/shared/utils/date.utils';

const REQUEST_STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  {
    value: RequestStatus.OPEN,
    label: 'Открыто',
  },
  {
    value: RequestStatus.QUOTED,
    label: 'Расценено',
  },
  {
    value: RequestStatus.CLOSED,
    label: 'Закрыто',
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
            managerId: a.managerId ?? '',
            departDateFrom: formatDate(a.departDateFrom ?? null),
            departDateTo: formatDate(a.departDateTo ?? null),
          };
          const fb = {
            status: b.status ?? [],
            managerId: b.managerId ?? '',
            departDateFrom: formatDate(b.departDateFrom ?? null),
            departDateTo: formatDate(b.departDateTo ?? null),
          };

          return fa.managerId === fb.managerId && compareDateRangeFilters(fa, fb);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((formValue) => {
        this.filterChange.emit({
          status: formValue.status ?? [],
          managerId: formValue.managerId ?? '',
          departDateFrom: formatDate(formValue.departDateFrom ?? null),
          departDateTo: formatDate(formValue.departDateTo ?? null),
        });
      });
  }
}
