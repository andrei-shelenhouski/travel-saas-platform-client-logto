import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LeadsService } from '../../../services/leads.service';
import type { LeadResponseDto } from '../../../shared/models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-lead-detail',
  imports: [RouterLink],
  templateUrl: './lead-detail.html',
  styleUrl: './lead-detail.css',
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);
  private readonly toast = inject(ToastService);

  readonly lead = signal<LeadResponseDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/app/leads']);
      return;
    }
    this.leadsService.findById(id).subscribe({
      next: (data) => this.lead.set(data),
      error: (err) => {
        this.toast.showError(
          err.error?.message ?? err.message ?? 'Failed to load lead'
        );
        this.router.navigate(['/app/leads']);
      },
      complete: () => this.loading.set(false),
    });
  }
}
