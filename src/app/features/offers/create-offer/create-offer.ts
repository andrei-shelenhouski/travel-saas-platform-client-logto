import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RequestsService } from '@app/services/requests.service';
import { OffersService } from '@app/services/offers.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import type { CreateOfferDto, RequestResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-offer',
  imports: [RouterLink, ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './create-offer.html',
  styleUrl: './create-offer.scss',
})
export class CreateOfferComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);
  private readonly offersService = inject(OffersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly requests = signal<RequestResponseDto[]>([]);
  readonly requestsLoading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    selectedRequestId: ['', Validators.required],
    language: ['en', Validators.required],
    currency: ['EUR', Validators.required],
    destination: [''],
    departureCity: [''],
    departDate: [''],
    returnDate: [''],
    adults: [1],
    children: [0],
    validityDate: [''],
    internalNotes: [''],
  });

  ngOnInit(): void {
    this.requestsService.getList().subscribe({
      next: (res) => this.requests.set(res.items),
      error: () => this.requestsLoading.set(false),
      complete: () => this.requestsLoading.set(false),
    });
    const requestId = this.route.snapshot.queryParamMap.get('requestId');

    if (requestId) {
      this.form.patchValue({ selectedRequestId: requestId });
    }
  }

  onSubmit(): void {
    const requestId = this.form.controls.selectedRequestId.value?.trim();

    if (!requestId) {
      this.error.set('Please select a request.');

      return;
    }
    this.error.set('');
    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto: CreateOfferDto = {
      requestId,
      language: v.language,
      currency: v.currency.trim(),
      ...(v.destination?.trim() && { destination: v.destination.trim() }),
      ...(v.departureCity?.trim() && { departureCity: v.departureCity.trim() }),
      ...(v.departDate && { departDate: v.departDate }),
      ...(v.returnDate && { returnDate: v.returnDate }),
      ...(v.adults > 0 && { adults: v.adults }),
      ...(v.children > 0 && { children: v.children }),
      ...(v.validityDate && { validityDate: v.validityDate }),
      ...(v.internalNotes?.trim() && { internalNotes: v.internalNotes.trim() }),
    };
    this.offersService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Offer created');
        this.router.navigate(['/app/offers', created.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create offer');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }
}
