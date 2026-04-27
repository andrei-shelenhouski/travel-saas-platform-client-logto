import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientsService } from '@app/services/clients.service';

import { ClientFormComponent } from '../client-form/client-form';

import type { ClientResponseDto, UpdateClientDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-client-page',
  imports: [ClientFormComponent],
  templateUrl: './edit-client-page.html',
  styleUrl: './edit-client-page.scss',
})
export class EditClientPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly client = signal<ClientResponseDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitError = signal('');

  private clientId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id === null) {
      void this.router.navigate(['..'], { relativeTo: this.route });

      return;
    }

    this.clientId = id;
    this.loadClient(id);
  }

  cancel(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  onUpdateSubmitted(dto: UpdateClientDto): void {
    const id = this.clientId;

    if (id === null || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.submitError.set('');

    this.clientsService.update(id, dto).subscribe({
      next: (updated) => {
        this.snackBar.open('Client updated', 'Close', { duration: 3000 });
        this.client.set(updated);
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err) => {
        this.submitError.set(err.error?.message ?? err.message ?? 'Failed to update client');
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      },
    });
  }

  private loadClient(id: string): void {
    this.loading.set(true);
    this.submitError.set('');

    this.clientsService.getById(id).subscribe({
      next: (client) => {
        this.client.set(client);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? err.message ?? 'Failed to load client', 'Close', {
          duration: 5000,
        });
        void this.router.navigate(['..'], { relativeTo: this.route });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
