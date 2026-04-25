import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClientsService } from '@app/services/clients.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ToastService } from '@app/shared/services/toast.service';
import { ClientType, type CreateClientDto } from '@app/shared/models';

const TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: ClientType.INDIVIDUAL, label: 'Individual' },
  { value: ClientType.AGENT, label: 'Agent' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-client',
  imports: [RouterLink, ReactiveFormsModule, ...MAT_FORM_BUTTONS],
  templateUrl: './create-client.html',
  styleUrl: './create-client.scss',
})
export class CreateClientComponent {
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly typeOptions = TYPE_OPTIONS;
  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    type: [ClientType.INDIVIDUAL],
    name: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
  });

  onSubmit(): void {
    this.error.set('');

    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    const dto: CreateClientDto = {
      type: v.type,
      name: v.name.trim(),
    };

    if (v.phone.trim()) {
      dto.phone = v.phone.trim();
    }

    if (v.email.trim()) {
      dto.email = v.email.trim();
    }

    this.clientsService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Client created');
        this.router.navigate(['/app/clients', created.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create client');
      },
      complete: () => this.saving.set(false),
    });
  }
}
