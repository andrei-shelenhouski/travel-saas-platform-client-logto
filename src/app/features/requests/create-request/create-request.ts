import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { MeService } from '../../../services/me.service';
import { RequestsService } from '../../../services/requests.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { CreateRequestDto } from '../../../shared/models';

const dateRangeValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value as string;
  const endDate = control.get('endDate')?.value as string;

  if (!startDate || !endDate) {
    return null;
  }

  return startDate <= endDate ? null : { dateRange: true };
};

@Component({
  selector: 'app-create-request',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './create-request.html',
  styleUrl: './create-request.css',
})
export class CreateRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meService = inject(MeService);
  private readonly requestsService = inject(RequestsService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      clientId: ['', [Validators.required]],
      managerId: ['', [Validators.required]],
      destination: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.min(0)]],
      comment: [''],
    },
    { validators: dateRangeValidator }
  );

  ngOnInit(): void {
    const clientIdParam = this.route.snapshot.queryParamMap.get('clientId');
    if (clientIdParam) {
      this.form.controls.clientId.setValue(clientIdParam);
    }

    const cached = this.meService.getMeData();
    if (cached?.id) {
      this.form.controls.managerId.setValue(cached.id);
    }

    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res?.id) {
            this.form.controls.managerId.setValue(res.id);
            this.cdr.markForCheck();
          }
        },
      });
  }

  onSubmit(): void {
    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    const dto: CreateRequestDto = {
      clientId: value.clientId.trim(),
      managerId: value.managerId.trim(),
      destination: value.destination.trim(),
      startDate: value.startDate,
      endDate: value.endDate,
      adults: value.adults,
    };

    if (value.children > 0) dto.children = value.children;
    if (value.comment.trim()) dto.comment = value.comment.trim();

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
