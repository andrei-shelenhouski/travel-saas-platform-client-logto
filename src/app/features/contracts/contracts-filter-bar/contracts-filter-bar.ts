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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { distinctUntilChanged } from 'rxjs';

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
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
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
