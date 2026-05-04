import { DatePipe } from '@angular/common';
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

import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';

import type { BookingResponseDto, UpdateBookingDto } from '@app/shared/models';

@Component({
  selector: 'app-travel-details-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ...MAT_FORM_BUTTONS, ...MAT_BUTTONS, ...MAT_ICONS],
  templateUrl: './travel-details-section.html',
  styleUrl: './travel-details-section.scss',
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
  });

  startEdit(): void {
    const b = this.booking();

    this.form.setValue({
      destination: b.destination ?? '',
      departDate: b.departDate ?? '',
      returnDate: b.returnDate ?? '',
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
