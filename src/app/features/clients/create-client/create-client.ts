import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ClientsService } from '../../../services/clients.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClientType, type CreateClientDto } from '../../../shared/models';

const TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: ClientType.INDIVIDUAL, label: 'Individual' },
  { value: ClientType.AGENT, label: 'Agent' },
];

@Component({
  selector: 'app-create-client',
  imports: [RouterLink, FormsModule],
  templateUrl: './create-client.html',
  styleUrl: './create-client.css',
})
export class CreateClientComponent {
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);

  readonly typeOptions = TYPE_OPTIONS;
  readonly saving = signal(false);
  readonly error = signal('');

  type: ClientType = ClientType.INDIVIDUAL;
  name = '';
  phone = '';
  email = '';

  onSubmit(): void {
    this.error.set('');
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    this.saving.set(true);
    const dto: CreateClientDto = {
      type: this.type,
      name: this.name.trim(),
    };
    if (this.phone.trim()) dto.phone = this.phone.trim();
    if (this.email.trim()) dto.email = this.email.trim();

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
