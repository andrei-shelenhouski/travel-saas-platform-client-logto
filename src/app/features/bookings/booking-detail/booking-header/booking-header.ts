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
  templateUrl: './booking-header.html',
  styleUrl: './booking-header.scss',
})
export class BookingHeaderComponent {
  readonly booking = input.required<BookingResponseDto>();
  readonly actionLoading = input<boolean>(false);

  readonly confirmBooking = output<void>();
  readonly cancelBooking = output<void>();

  readonly BookingStatus = BookingStatus;
}
