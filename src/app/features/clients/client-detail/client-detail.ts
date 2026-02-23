import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { ClientsService } from '../../../services/clients.service';
import type { ClientResponseDto } from '../../../shared/models';
import { ClientType } from '../../../shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.AGENT]: 'Agent',
};

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css',
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id')))
  );

  private readonly data = rxResource<ClientResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.clientsService.getById(id);
    },
  });

  readonly typeLabel = TYPE_LABEL;
  readonly client = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/clients']);
      }
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
