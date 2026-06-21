import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

import { SuppliersService } from '@app/services/suppliers.service';

import type { SupplierResponse } from '@app/shared/models';

@Component({
  selector: 'app-supplier-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SupplierPickerComponent),
      multi: true,
    },
  ],
  templateUrl: './supplier-picker.html',
})
export class SupplierPickerComponent implements ControlValueAccessor, OnDestroy {
  private readonly suppliersService = inject(SuppliersService);
  private readonly destroy$ = new Subject<void>();

  readonly serviceTypeFilter = input<string[]>();
  readonly label = input<string>('Поставщик');
  readonly required = input<boolean>(false);

  readonly supplierSelected = output<SupplierResponse | null>();

  readonly searchControl = new FormControl<string | SupplierResponse>('');
  readonly loading = signal(false);
  readonly options = signal<SupplierResponse[]>([]);
  readonly selectedSupplier = signal<SupplierResponse | null>(null);

  private onChange: (val: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (typeof value !== 'string' || value.length < 2) {
            this.options.set([]);

            return [];
          }

          this.loading.set(true);

          return this.suppliersService.getList({
            search: value,
            serviceType: this.serviceTypeFilter()?.[0],
            isActive: true,
            limit: 20,
          });
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          if (typeof result === 'object' && result !== null && 'items' in result) {
            this.options.set((result as { items: SupplierResponse[] }).items);
          }

          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  displayFn(supplier: SupplierResponse | string | null): string {
    if (!supplier) {
      return '';
    }

    if (typeof supplier === 'string') {
      return supplier;
    }

    return supplier.name;
  }

  onOptionSelected(supplier: SupplierResponse): void {
    this.selectedSupplier.set(supplier);
    this.onChange(supplier.id);
    this.supplierSelected.emit(supplier);
  }

  clearSelection(): void {
    this.searchControl.setValue('');
    this.selectedSupplier.set(null);
    this.onChange(null);
    this.supplierSelected.emit(null);
  }

  // ControlValueAccessor
  writeValue(value: string | null): void {
    if (!value) {
      this.searchControl.setValue('', { emitEvent: false });
      this.selectedSupplier.set(null);
    }
  }

  registerOnChange(fn: (val: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
