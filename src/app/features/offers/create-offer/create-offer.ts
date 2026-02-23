import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { RequestsService } from '../../../services/requests.service';
import { OffersService } from '../../../services/offers.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { CreateOfferDto } from '../../../shared/models';
import type { RequestResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-create-offer',
  imports: [RouterLink, FormsModule],
  templateUrl: './create-offer.html',
  styleUrl: './create-offer.css',
})
export class CreateOfferComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<RequestResponseDto[]>([]);
  readonly requestsLoading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  selectedRequestId = '';
  title = '';
  supplierTotal = 0;
  markup = 0;
  commission = 0;
  finalPrice = 0;
  currency = 'EUR';

  ngOnInit(): void {
    this.requestsService.getList().subscribe({
      next: (list) => this.requests.set(list),
      error: () => this.requestsLoading.set(false),
      complete: () => this.requestsLoading.set(false),
    });
    const requestId = this.route.snapshot.queryParamMap.get('requestId');
    if (requestId) this.selectedRequestId = requestId;
  }

  onSubmit(): void {
    if (!this.selectedRequestId?.trim()) {
      this.error.set('Please select a request.');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    const dto: CreateOfferDto = {
      requestId: this.selectedRequestId.trim(),
      title: this.title.trim() || 'Offer',
      supplierTotal: this.supplierTotal,
      markup: this.markup,
      commission: this.commission,
      finalPrice: this.finalPrice,
      currency: this.currency.trim(),
    };
    this.offersService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Offer created');
        this.router.navigate(['/app/offers', created.id]);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to create offer'
        );
      },
      complete: () => this.saving.set(false),
    });
  }
}
