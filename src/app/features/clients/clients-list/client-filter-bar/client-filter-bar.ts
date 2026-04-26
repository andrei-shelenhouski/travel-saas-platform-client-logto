import { ChangeDetectionStrategy, Component, effect, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';

export type ClientFilterValue = {
  type: ClientType | 'ALL';
  search: string;
};

const TYPE_OPTIONS: { value: ClientType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: ClientType.INDIVIDUAL, label: 'Individual' },
  { value: ClientType.COMPANY, label: 'Company' },
  { value: ClientType.B2B_AGENT, label: 'B2B Agent' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-filter-bar',
  imports: [ReactiveFormsModule, ...MAT_FORM_BUTTONS, MatIconModule],
  styleUrl: './client-filter-bar.scss',
  templateUrl: './client-filter-bar.html',
})
export class ClientFilterBarComponent {
  private readonly fb = inject(FormBuilder);

  readonly filterChange = output<ClientFilterValue>();

  readonly typeOptions = TYPE_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<ClientType | 'ALL'>('ALL'),
    search: this.fb.nonNullable.control(''),
  });

  private readonly formValueChanges$ = this.form.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => a.type === b.type && a.search === b.search),
  );

  private readonly formValue = toSignal(this.formValueChanges$, {
    initialValue: this.form.value,
  });

  constructor() {
    effect(() => {
      const formValue = this.formValue();

      const raw = formValue.search ?? '';
      const search = raw.length > 0 && raw.length < 2 ? '' : raw;

      this.filterChange.emit({
        type: formValue.type ?? 'ALL',
        search,
      });
    });
  }

  clearSearch(): void {
    this.form.patchValue({ search: '' });
  }
}
