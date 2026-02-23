import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LeadsService } from '../../../services/leads.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LeadSource, type CreateLeadDto } from '../../../shared/models';

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: LeadSource.PHONE, label: 'Phone' },
  { value: LeadSource.EMAIL, label: 'Email' },
  { value: LeadSource.WHATSAPP, label: 'WhatsApp' },
  { value: LeadSource.AGENT, label: 'Agent' },
  { value: LeadSource.OTHER, label: 'Other' },
];

@Component({
  selector: 'app-create-lead',
  imports: [FormsModule, RouterLink],
  templateUrl: './create-lead.html',
  styleUrl: './create-lead.css',
})
export class CreateLeadComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly sourceOptions = SOURCE_OPTIONS;
  source: LeadSource = LeadSource.OTHER;
  contactName = '';
  contactEmail = '';
  contactPhone = '';
  notes = '';

  readonly loading = signal(false);
  readonly error = signal('');

  onSubmit(): void {
    this.error.set('');
    this.loading.set(true);
    const dto: CreateLeadDto = {
      source: this.source,
      contactName: this.contactName.trim(),
    };
    if (this.contactEmail.trim()) dto.contactEmail = this.contactEmail.trim();
    if (this.contactPhone.trim()) dto.contactPhone = this.contactPhone.trim();
    if (this.notes.trim()) dto.notes = this.notes.trim();

    this.leadsService.create(dto).subscribe({
      next: () => {
        this.toast.showSuccess('Lead created');
        this.router.navigate(['/app/leads']);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to create lead'
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
