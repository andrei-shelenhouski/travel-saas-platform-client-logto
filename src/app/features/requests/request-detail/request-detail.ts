import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { RequestsService } from '../../../services/requests.service';
import type { RequestResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-request-detail',
  imports: [RouterLink],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.css',
})
export class RequestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id')))
  );

  private readonly data = rxResource<RequestResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.requestsService.getById(id);
    },
  });

  readonly request = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/requests']);
      }
    });
  }

  createOffer(): void {
    const r = this.request();
    if (!r) return;
    this.router.navigate(['/app/offers/new'], {
      queryParams: { requestId: r.id },
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
