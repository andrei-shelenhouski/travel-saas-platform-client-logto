import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ClientsService } from '../../../services/clients.service';
import type { ClientResponseDto } from '../../../shared/models';
import { ClientType } from '../../../shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.AGENT]: 'Agent',
};

@Component({
  selector: 'app-clients-list',
  imports: [RouterLink],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.css',
})
export class ClientsListComponent implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);

  readonly typeLabel = TYPE_LABEL;
  readonly clients = signal<ClientResponseDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.loading.set(true);
    this.error.set('');
    this.clientsService.getList().subscribe({
      next: (res) => this.clients.set(res.data),
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to load clients'
        );
      },
      complete: () => this.loading.set(false),
    });
  }

  goToDetail(client: ClientResponseDto): void {
    this.router.navigate(['/app/clients', client.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }
}
