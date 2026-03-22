import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LeadsService } from '@app/services/leads.service';
import { ToastService } from '@app/shared/services/toast.service';
import { type CreateLeadDto, LeadSource } from '@app/shared/models';

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const s = typeof control.value === 'string' ? control.value.trim() : '';

  return s ? null : { required: true };
}

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: LeadSource.PHONE, label: 'Phone' },
  { value: LeadSource.EMAIL, label: 'Email' },
  { value: LeadSource.WHATSAPP, label: 'WhatsApp' },
  { value: LeadSource.AGENT, label: 'Agent' },
  { value: LeadSource.OTHER, label: 'Other' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-lead',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-lead.html',
  styleUrl: './create-lead.css',
})
export class CreateLeadComponent {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly sourceOptions = SOURCE_OPTIONS;
  protected readonly form = this.fb.nonNullable.group({
    source: [LeadSource.OTHER],
    contactName: ['', trimmedRequired],
    contactEmail: ['', Validators.email],
    contactPhone: ['', Validators.pattern(/^\+?\d{10,15}$/)],
    notes: [''],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    const v = this.form.getRawValue();
    const dto: CreateLeadDto = {
      source: v.source,
      contactName: v.contactName.trim(),
    };

    if (v.contactEmail.trim()) {
      dto.contactEmail = v.contactEmail.trim();
    }

    if (v.contactPhone.trim()) {
      dto.contactPhone = v.contactPhone.trim();
    }

    if (v.notes.trim()) {
      dto.notes = v.notes.trim();
    }

    this.leadsService.create(dto).subscribe({
      next: () => {
        this.toast.showSuccess('Lead created');
        this.router.navigate(['/app/leads']);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create lead');
      },
      complete: () => this.loading.set(false),
    });
  }
}
