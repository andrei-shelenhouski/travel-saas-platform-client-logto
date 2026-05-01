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
import { DatePipe } from '@angular/common';

import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';

import type { BookingResponseDto, UpdateBookingDto } from '@app/shared/models';

@Component({
  selector: 'app-travel-details-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Детали тура</h2>
        @if (isEditable() && !editing()) {
          <button mat-icon-button type="button" (click)="startEdit()">
            <mat-icon>edit</mat-icon>
          </button>
        }
      </div>

      @if (editing()) {
        <form class="mt-3 space-y-3" [formGroup]="form" (ngSubmit)="onSave()">
          <mat-form-field class="w-full">
            <mat-label>Направление</mat-label>
            <input formControlName="destination" matInput />
          </mat-form-field>

          <div class="grid gap-3 sm:grid-cols-2">
            <mat-form-field class="w-full">
              <mat-label>Дата вылета</mat-label>
              <input formControlName="departDate" matInput type="date" />
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Дата возвращения</mat-label>
              <input formControlName="returnDate" matInput type="date" />
            </mat-form-field>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <mat-form-field class="w-full">
              <mat-label>Взрослых</mat-label>
              <input formControlName="adults" matInput min="0" type="number" />
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Детей</mat-label>
              <input formControlName="children" matInput min="0" type="number" />
            </mat-form-field>
          </div>

          <div class="flex justify-end gap-2">
            <button mat-button type="button" (click)="cancelEdit()">Отмена</button>
            <button color="primary" mat-flat-button type="submit" [disabled]="saving()">
              Сохранить
            </button>
          </div>
        </form>
      } @else {
        <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-gray-500">Направление</dt>
            <dd class="font-medium text-gray-900">{{ booking().destination || '—' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Дата вылета</dt>
            <dd class="font-medium text-gray-900">
              {{ booking().departDate ? (booking().departDate | date: 'mediumDate') : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Дата возвращения</dt>
            <dd class="font-medium text-gray-900">
              {{ booking().returnDate ? (booking().returnDate | date: 'mediumDate') : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Взрослых / Детей</dt>
            <dd class="font-medium text-gray-900">
              {{ booking().adults ?? 0 }} / {{ booking().children ?? 0 }}
            </dd>
          </div>
        </dl>
      }
    </section>
  `,
})
export class TravelDetailsSectionComponent {
  private readonly fb = inject(FormBuilder);

  readonly booking = input.required<BookingResponseDto>();
  readonly saving = input<boolean>(false);

  readonly save = output<UpdateBookingDto>();

  readonly editing = signal(false);

  readonly isEditable = computed(() => {
    const s = this.booking().status;

    return s !== BookingStatus.COMPLETED && s !== BookingStatus.CANCELLED;
  });

  readonly form = this.fb.nonNullable.group({
    destination: [''],
    departDate: [''],
    returnDate: [''],
    adults: [0],
    children: [0],
  });

  startEdit(): void {
    const b = this.booking();
    this.form.setValue({
      destination: b.destination ?? '',
      departDate: b.departDate ?? '',
      returnDate: b.returnDate ?? '',
      adults: b.adults ?? 0,
      children: b.children ?? 0,
    });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  onSave(): void {
    const v = this.form.getRawValue();
    this.save.emit({
      destination: v.destination || undefined,
      departDate: v.departDate || undefined,
      returnDate: v.returnDate || undefined,
    });
    this.editing.set(false);
  }
}
