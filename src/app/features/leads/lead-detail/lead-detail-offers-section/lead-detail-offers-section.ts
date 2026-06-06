import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';

import { MAT_BUTTONS } from '@app/shared/material-imports';
import { MatIconModule } from '@angular/material/icon';
import { OfferStatusChipComponent } from '@app/shared/components/offer-status-chip/offer-status-chip';

import type { OfferResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail-offers-section',
  imports: [
    RouterLink,
    MatTableModule,
    MatIconModule,
    DecimalPipe,
    OfferStatusChipComponent,
    ...MAT_BUTTONS,
  ],
  templateUrl: './lead-detail-offers-section.html',
  styleUrl: './lead-detail-offers-section.scss',
})
export class LeadDetailOffersSectionComponent {
  readonly offers = input<OfferResponseDto[]>([]);
  readonly canCreateOffer = input<boolean>(false);

  readonly createOfferClicked = output<void>();

  readonly columns = ['number', 'destination', 'status', 'total'];
}
