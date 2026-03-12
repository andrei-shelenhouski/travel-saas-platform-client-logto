import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClientsService } from '../../../services/clients.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClientType, type CreateClientDto } from '../../../shared/models';

const TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: ClientType.INDIVIDUAL, label: 'Individual' },
  { value: ClientType.AGENT, label: 'Agent' },
];

@Component({
  selector: 'app-create-client',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './create-client.html',
  styleUrl: './create-client.css',
})
export class CreateClientComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);

  readonly typeOptions = TYPE_OPTIONS;
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    type: [ClientType.INDIVIDUAL, [Validators.required]],
    name: ['', [Validators.required]],
    phone: [''],
    email: ['', [Validators.email]],
  });

  onSubmit(): void {
    this.error.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const dto: CreateClientDto = {
      type: value.type,
      name: value.name.trim(),
    };
    if (value.phone.trim()) dto.phone = value.phone.trim();
    if (value.email.trim()) dto.email = value.email.trim();

    this.clientsService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Client created');
        this.router.navigate(['/app/clients', created.id]);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to create client'
        );
      },
      complete: () => this.saving.set(false),
    });
  }
}
