import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LeadsService } from '../../services/leads.service';
import type { LeadResponseDto } from '../../shared/models';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './leads-list.component.html',
  styleUrl: './leads-list.component.css',
})
export class LeadsListComponent implements OnInit {
  private readonly leadsService = inject(LeadsService);

  readonly leads = signal<LeadResponseDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.leadsService.findAll().subscribe({
      next: (list) => {
        this.leads.set(list);
      },
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to load leads'
        );
      },
      complete: () => this.loading.set(false),
    });
  }
}
