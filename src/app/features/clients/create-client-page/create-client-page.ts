import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientsService } from '@app/services/clients.service';

import { ClientFormComponent } from '../client-form/client-form';

import type { CreateClientDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-client-page',
  imports: [ClientFormComponent],
  templateUrl: './create-client-page.html',
  styleUrl: './create-client-page.scss',
})
export class CreateClientPageComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly clientsService = inject(ClientsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal(false);
  readonly submitError = signal('');

  cancel(): void {
    void this.router.navigate(['..'], { relativeTo: this.activatedRoute });
  }

  onCreateSubmitted(dto: CreateClientDto): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.clientsService.create(dto).subscribe({
      next: (created) => {
        this.snackBar.open('Client created', 'Close', { duration: 3000 });
        void this.router.navigate(['..', created.id], { relativeTo: this.activatedRoute });
      },
      error: (err) => {
        this.submitError.set(err.error?.message ?? err.message ?? 'Failed to create client');
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      },
    });
  }
}
