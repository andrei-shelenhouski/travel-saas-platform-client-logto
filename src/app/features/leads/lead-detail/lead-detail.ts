import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { LeadsService } from '../../../services/leads.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { LeadResponseDto } from '../../../shared/models';
import { LeadStatus } from '../../../shared/models';

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
  private readonly toast = inject(ToastService);

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
  /** Optimistic: show CONVERTED while converting */
  readonly displayLead = computed(() => {
    const l = this.lead();
    if (!l) return null;
    if (this.convertLoading()) {
      return { ...l, status: LeadStatus.CONVERTED };
    }
    return l;
  });
  readonly loading = computed(() => this.data.isLoading());
  readonly convertLoading = signal(false);

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/leads']);
      }
    });
  }

  convertToClient(): void {
    const l = this.lead();
    if (!l || this.convertLoading()) return;
    this.convertLoading.set(true);
    this.leadsService.convertToClient(l.id).subscribe({
      next: (res) => {
        this.toast.showSuccess('Lead converted to client');
        this.router.navigate(['/app/clients', res.client.id]);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to convert lead');
      },
      complete: () => this.convertLoading.set(false),
    });
  }
}
