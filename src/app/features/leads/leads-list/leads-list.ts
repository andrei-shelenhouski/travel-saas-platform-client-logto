import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LeadsService } from '../../../services/leads.service';
import type { LeadResponseDto } from '../../../shared/models';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-leads-list',
  imports: [RouterLink],
  templateUrl: './leads-list.html',
  styleUrl: './leads-list.css',
})
export class LeadsListComponent {
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);
  private readonly data = rxResource({
    stream: () => this.leadsService.findAll(),
  });

  readonly leads = computed(() => this.data.value()?.data ?? []);
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const error = this.data.error();

    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? 'Failed to load leads';
    }

    return undefined;
  });

  goToDetail(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }
}
