import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AccommodationDto } from '@app/shared/models';

@Component({
  selector: 'app-accommodation-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './accommodation-table.html',
  styleUrl: './accommodation-table.scss',
})
export class AccommodationTableComponent {
  readonly accommodationDetails = input<AccommodationDto[] | null | undefined>(null);

  readonly rows = computed<AccommodationDto[]>(() => {
    const details = this.accommodationDetails();

    if (!details) {
      return [];
    }

    return details;
  });
}
