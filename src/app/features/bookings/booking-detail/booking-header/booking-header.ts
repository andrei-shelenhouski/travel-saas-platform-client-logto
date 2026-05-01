import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingStatusChipComponent } from '@app/shared/components/booking-status-chip/booking-status-chip';
import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';
import { BookingStatus } from '@app/shared/models';

import type { BookingResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-booking-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BookingStatusChipComponent, ...MAT_BUTTONS, ...MAT_ICONS],
  template: `
    <header class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
      <div class="min-w-0 space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <a class="text-sm text-gray-500 hover:text-primary" mat-button routerLink="/app/bookings">
            <mat-icon class="text-base">arrow_back</mat-icon>
          </a>
          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              Бронирование {{ booking().number ? '#' + booking().number : '' }}
            </h1>
            <p class="mt-0.5 text-xs text-gray-400">ID: {{ booking().id }}</p>
          </div>
          <app-booking-status-chip [status]="booking().status" />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        @if (booking().status === BookingStatus.PENDING_CONFIRMATION) {
          <button
            color="primary"
            mat-flat-button
            type="button"
            [disabled]="actionLoading()"
            (click)="confirmBooking.emit()"
          >
            Подтвердить бронирование
          </button>
          <button
            color="warn"
            mat-stroked-button
            type="button"
            [disabled]="actionLoading()"
            (click)="cancelBooking.emit()"
          >
            Отменить
          </button>
        }
        @if (booking().status === BookingStatus.CONFIRMED) {
          <button
            color="warn"
            mat-stroked-button
            type="button"
            [disabled]="actionLoading()"
            (click)="cancelBooking.emit()"
          >
            Отменить
          </button>
        }
      </div>
    </header>
  `,
})
export class BookingHeaderComponent {
  readonly booking = input.required<BookingResponseDto>();
  readonly actionLoading = input<boolean>(false);

  readonly confirmBooking = output<void>();
  readonly cancelBooking = output<void>();

  readonly BookingStatus = BookingStatus;
}
