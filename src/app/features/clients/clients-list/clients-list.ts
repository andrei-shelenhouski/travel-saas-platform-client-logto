import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MAT_BUTTONS } from '@app/shared/material-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

import { ClientsService } from '@app/services/clients.service';
import type { ClientResponseDto } from '@app/shared/models';
import { ClientType } from '@app/shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.AGENT]: 'Agent',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-clients-list',
  imports: [RouterLink, ...MAT_BUTTONS],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss',
})
export class ClientsListComponent {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly data = rxResource({
    stream: () => this.clientsService.getList(),
  });

  readonly typeLabel = TYPE_LABEL;
  readonly clients = computed(() => this.data.value()?.items ?? []);
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
