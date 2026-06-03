import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';

import { RequestsService } from '@app/services/requests.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { RequestResponseDto } from '@app/shared/models';

type LoadError = {
  status?: number;
  error?: { message?: string };
  message?: string;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-request-detail',
  imports: [RouterLink, ...MAT_BUTTONS, PageHeading],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<RequestResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.requestsService.getById(id);
    },
  });

  readonly request = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly travelRequestSubtitle = 'Запрос на поездку';

  protected readonly hasError = computed(
    () => this.data.error() !== undefined && this.data.error() !== null,
  );

  protected readonly loadErrorMessage = computed(() => {
    const error = this.data.error() as LoadError | undefined;

    if (!error) {
      return '';
    }

    if (error.status === 404) {
      return 'Запрос не найден';
    }

    if (error.status === 403) {
      return 'У вас нет доступа к этому запросу';
    }

    return error.error?.message ?? error.message ?? 'Не удалось загрузить запрос';
  });

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/requests']);
      }
    });
  }

  createOffer(): void {
    const r = this.request();

    if (!r) {
      return;
    }
    this.router.navigate(['/app/offers/new'], {
      queryParams: { requestId: r.id },
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) {
      return '—';
    }

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
