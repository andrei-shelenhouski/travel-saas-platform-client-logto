import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { OffersService } from '../../services/offers.service';
import { ToastService } from '../../shared/services/toast.service';
import type { OfferResponseDto, UpdateOfferDto } from '../../shared/models';
import { OfferStatus } from '../../shared/models';

@Component({
  selector: 'app-offer-edit',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './offer-edit.component.html',
  styleUrl: './offer-edit.component.css',
})
export class OfferEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);

  readonly offer = signal<OfferResponseDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  title = '';
  supplierTotal = 0;
  markup = 0;
  commission = 0;
  finalPrice = 0;
  currency = '';
  validUntil = '';
  description = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/app/offers']);
      return;
    }
    this.offersService.getById(id).subscribe({
      next: (o) => {
        if (o.status !== OfferStatus.DRAFT) {
          this.toast.showError('Only draft offers can be edited.');
          this.router.navigate(['/app/offers', o.id]);
          return;
        }
        this.offer.set(o);
        this.title = o.title;
        this.supplierTotal = o.supplierTotal;
        this.markup = o.markup;
        this.commission = o.commission;
        this.finalPrice = o.finalPrice;
        this.currency = o.currency;
        this.validUntil = o.validUntil ?? '';
        this.description = o.description ?? '';
      },
      error: (err) => {
        this.toast.showError(
          err.error?.message ?? err.message ?? 'Failed to load offer'
        );
        this.router.navigate(['/app/offers']);
      },
      complete: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    const o = this.offer();
    if (!o || o.status !== OfferStatus.DRAFT || this.saving()) return;

    this.error.set('');
    this.saving.set(true);
    const dto: UpdateOfferDto = {
      title: this.title.trim(),
      supplierTotal: this.supplierTotal,
      markup: this.markup,
      commission: this.commission,
      finalPrice: this.finalPrice,
      currency: this.currency.trim(),
    };
    // validUntil and description not in OpenAPI UpdateOfferDto yet; keep in form for when backend supports them

    this.offersService.update(o.id, dto).subscribe({
      next: (updated) => {
        this.offer.set(updated);
        this.toast.showSuccess('Offer updated');
        this.router.navigate(['/app/offers', o.id]);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to update offer'
        );
      },
      complete: () => this.saving.set(false),
    });
  }
}
