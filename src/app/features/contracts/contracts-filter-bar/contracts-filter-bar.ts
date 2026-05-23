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

import { distinctUntilChanged } from 'rxjs';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ContractStatus } from '@app/shared/models';

import type { ContractStatus as ContractStatusType } from '@app/shared/models';

export type ContractsFilterValue = {
  status: ContractStatusType | '';
  clientId: string;
};

const CONTRACT_STATUS_OPTIONS: { value: ContractStatusType; label: string }[] = [
  { value: ContractStatus.ACTIVE, label: 'Активный' },
  { value: ContractStatus.EXPIRED, label: 'Истёкший' },
  { value: ContractStatus.TERMINATED, label: 'Расторгнутый' },
];

@Component({
  selector: 'app-contracts-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './contracts-filter-bar.html',
  styleUrl: './contracts-filter-bar.scss',
})
export class ContractsFilterBarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input.required<ContractsFilterValue>();
  readonly filterChange = output<ContractsFilterValue>();

  readonly statusOptions = CONTRACT_STATUS_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    status: this.fb.nonNullable.control<ContractStatusType | ''>(''),
    clientId: this.fb.nonNullable.control(''),
  });

  constructor() {
    effect(() => {
      const value = this.value();

      this.form.patchValue(
        {
          status: value.status,
          clientId: value.clientId,
        },
        { emitEvent: false },
      );
    });

    this.form.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => {
          return (a.status ?? '') === (b.status ?? '') && (a.clientId ?? '') === (b.clientId ?? '');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.filterChange.emit({
          status: value.status ?? '',
          clientId: value.clientId ?? '',
        });
      });
  }
}
