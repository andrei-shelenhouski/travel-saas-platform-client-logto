import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

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
export class ClientsListComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly data = rxResource({
    stream: () => this.clientsService.getList(),
  });

  readonly typeLabel = TYPE_LABEL;
  readonly clients = computed(() => this.data.value()?.data ?? []);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load clients';
    }
    return undefined;
  });

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
