import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { LeadsService } from '@app/services/leads.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { PermissionService } from '@app/services/permission.service';
import { ToastService } from '@app/shared/services/toast.service';
import type { LeadResponseDto } from '@app/shared/models';
import { LeadStatus } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail',
  imports: [RouterLink, ...MAT_BUTTONS],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.scss',
})
export class LeadDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);
  private readonly toast = inject(ToastService);
  readonly permissions = inject(PermissionService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<LeadResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.leadsService.findById(id);
    },
  });

  readonly lead = computed(() => this.data.value() ?? null);
  /** Optimistic: show CONVERTED while converting */
  readonly displayLead = computed(() => {
    const l = this.lead();

    if (!l) {
      return null;
    }

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

    if (!l || this.convertLoading()) {
      return;
    }
    this.convertLoading.set(true);
    this.leadsService.convertToClient(l.id).subscribe({
      next: (res) => {
        this.toast.showSuccess('Lead converted to client');
        this.router.navigate(['/app/clients', res.convertedToClientId]);
      },
      error: (err) => {
        this.toast.showError(err.error?.message ?? err.message ?? 'Failed to convert lead');
      },
      complete: () => this.convertLoading.set(false),
    });
  }
}
