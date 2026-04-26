import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { RequestsService } from '@app/services/requests.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import type { CreateRequestDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-request',
  imports: [RouterLink, ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './create-request.html',
  styleUrl: './create-request.scss',
})
export class CreateRequestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meService = inject(MeService);
  private readonly requestsService = inject(RequestsService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    managerId: ['', Validators.required],
    destination: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    adults: [1, [Validators.required, Validators.min(1)]],
    children: [0, [Validators.min(0)]],
    comment: [''],
  });

  ngOnInit(): void {
    const clientIdParam = this.route.snapshot.queryParamMap.get('clientId');

    if (clientIdParam) {
      this.form.patchValue({ clientId: clientIdParam });
    }

    const cached = this.meService.getMeData();

    if (cached?.id) {
      this.form.patchValue({ managerId: cached.id });
    }

    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res?.id) {
            this.form.patchValue({ managerId: res.id });
            this.cdr.markForCheck();
          }
        },
      });
  }

  onSubmit(): void {
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in all required fields.');

      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    const dto: CreateRequestDto = {
      leadId: v.clientId.trim(),
      managerId: v.managerId.trim(),
      destination: v.destination.trim(),
      departDate: v.startDate,
      returnDate: v.endDate,
      adults: Number(v.adults) || 1,
    };

    if (Number(v.children) > 0) {
      dto.children = Number(v.children);
    }

    if (v.comment.trim()) {
      dto.notes = v.comment.trim();
    }

    this.requestsService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Request created');
        this.router.navigate(['/app/requests', created.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create request');
      },
      complete: () => this.saving.set(false),
    });
  }
}
