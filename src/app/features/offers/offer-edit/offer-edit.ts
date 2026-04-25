import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OffersService } from '@app/services/offers.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import type { OfferResponseDto, UpdateOfferDto } from '@app/shared/models';
import { OfferStatus } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-offer-edit',
  imports: [RouterLink, ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './offer-edit.html',
  styleUrl: './offer-edit.scss',
})
export class OfferEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly offer = signal<OfferResponseDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    finalPrice: [0],
    currency: [''],
    validUntil: [''],
    description: [''],
  });

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
        this.form.patchValue({
          title: o.title,
          finalPrice: Number(o.finalPrice) || 0,
          currency: o.currency,
          validUntil: '',
          description: '',
        });
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to load offer');
        this.router.navigate(['/app/offers']);
      },
      complete: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    const o = this.offer();

    if (!o || o.status !== OfferStatus.DRAFT || this.saving() || this.form.invalid) {
      return;
    }

    this.error.set('');
    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto: UpdateOfferDto = {
      title: v.title.trim(),
      supplierTotal: Number(o.supplierTotal) || 0,
      markup: Number(o.markup) || 0,
      commission: Number(o.commission) || 0,
      finalPrice: v.finalPrice,
      currency: v.currency.trim(),
    };

    this.offersService.update(o.id, dto).subscribe({
      next: (updated) => {
        this.offer.set(updated);
        this.toast.showSuccess('Offer updated');
        this.router.navigate(['/app/offers', o.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to update offer');
      },
      complete: () => this.saving.set(false),
    });
  }
}
