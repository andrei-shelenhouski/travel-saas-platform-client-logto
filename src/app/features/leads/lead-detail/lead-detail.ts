import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { LeadsService } from '../../../services/leads.service';
import type { LeadResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-lead-detail',
  imports: [RouterLink],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.css',
})
export class LeadDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id')))
  );

  private readonly data = rxResource<LeadResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.leadsService.findById(id);
    },
  });

  readonly lead = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/leads']);
      }
    });
  }
}
