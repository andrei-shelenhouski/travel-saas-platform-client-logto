import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RequestsService } from '../../../services/requests.service';
import { OffersService } from '../../../services/offers.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { CreateOfferDto } from '../../../shared/models';
import type { RequestResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-create-offer',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './create-offer.html',
  styleUrl: './create-offer.css',
})
export class CreateOfferComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<RequestResponseDto[]>([]);
  readonly requestsLoading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    selectedRequestId: ['', [Validators.required]],
    title: [''],
    supplierTotal: [0, [Validators.min(0)]],
    markup: [0, [Validators.min(0)]],
    commission: [0, [Validators.min(0)]],
    finalPrice: [0, [Validators.min(0)]],
    currency: ['EUR', [Validators.required]],
  });

  ngOnInit(): void {
    this.requestsService.getList().subscribe({
      next: (res) => this.requests.set(res.data),
      error: () => this.requestsLoading.set(false),
      complete: () => this.requestsLoading.set(false),
    });
    const requestId = this.route.snapshot.queryParamMap.get('requestId');
    if (requestId) this.form.controls.selectedRequestId.setValue(requestId);
  }

  onSubmit(): void {
    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    const dto: CreateOfferDto = {
      requestId: value.selectedRequestId.trim(),
      title: value.title.trim() || 'Offer',
      supplierTotal: value.supplierTotal,
      markup: value.markup,
      commission: value.commission,
      finalPrice: value.finalPrice,
      currency: value.currency.trim(),
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
