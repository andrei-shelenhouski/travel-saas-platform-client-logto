import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ClientsService } from '../../services/clients.service';
import type { ClientResponseDto } from '../../shared/models';
import { ClientType } from '../../shared/models';
import { ToastService } from '../../shared/services/toast.service';

const TYPE_LABEL: Record<ClientType, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.AGENT]: 'Agent',
};

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css',
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);

  readonly typeLabel = TYPE_LABEL;
  readonly client = signal<ClientResponseDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/app/clients']);
      return;
    }
    this.clientsService.getById(id).subscribe({
      next: (data) => this.client.set(data),
      error: (err) => {
        this.toast.showError(
          err.error?.message ?? err.message ?? 'Failed to load client'
        );
        this.router.navigate(['/app/clients']);
      },
      complete: () => this.loading.set(false),
    });
  }

  createRequest(): void {
    const c = this.client();
    if (!c) return;
    this.router.navigate(['/app/requests/new'], {
      queryParams: { clientId: c.id },
    });
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }
}
