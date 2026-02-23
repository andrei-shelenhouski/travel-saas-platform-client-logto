import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LeadsService } from '../../../services/leads.service';
import type { LeadResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-leads-list',
  imports: [RouterLink],
  templateUrl: './leads-list.html',
  styleUrl: './leads-list.css',
})
export class LeadsListComponent implements OnInit {
  private readonly leadsService = inject(LeadsService);
  private readonly router = inject(Router);

  readonly leads = signal<LeadResponseDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.leadsService.findAll().subscribe({
      next: (res) => this.leads.set(res.data),
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to load leads'
        );
      },
      complete: () => this.loading.set(false),
    });
  }

  goToDetail(lead: LeadResponseDto): void {
    this.router.navigate(['/app/leads', lead.id]);
  }
}
