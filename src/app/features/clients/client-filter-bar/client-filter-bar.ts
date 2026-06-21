import { ChangeDetectionStrategy, Component, effect, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CLIENT_ROLE_LABELS, ClientRole, ClientType } from '@app/shared/models';

export type ClientFilterValue = {
  type: ClientType | 'ALL';
  search: string;
  role?: string;
};

const TYPE_OPTIONS: { value: ClientType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: ClientType.INDIVIDUAL, label: 'Физ. лицо' },
  { value: ClientType.ORGANIZATION, label: 'Организация' },
  { value: ClientType.COMPANY, label: 'Компания' },
  { value: ClientType.B2B_AGENT, label: 'B2B агент' },
  { value: ClientType.AGENT, label: 'Агент' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-filter-bar',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  styleUrl: './client-filter-bar.scss',
  templateUrl: './client-filter-bar.html',
})
export class ClientFilterBarComponent {
  private readonly fb = inject(FormBuilder);

  readonly filterChange = output<ClientFilterValue>();

  readonly typeOptions = TYPE_OPTIONS;
  readonly roleOptions = Object.entries(CLIENT_ROLE_LABELS).map(([value, label]) => ({
    value: value as ClientRole,
    label,
  }));
  readonly ClientType = ClientType;

  readonly form = this.fb.nonNullable.group({
    type: this.fb.nonNullable.control<ClientType | 'ALL'>('ALL'),
    search: this.fb.nonNullable.control(''),
    role: this.fb.nonNullable.control<string | ''>(''),
  });

  private readonly formValueChanges$ = this.form.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => a.type === b.type && a.search === b.search && a.role === b.role),
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
        role: formValue.role || undefined,
      });
    });
  }

  clearSearch(): void {
    this.form.patchValue({ search: '' });
  }
}
