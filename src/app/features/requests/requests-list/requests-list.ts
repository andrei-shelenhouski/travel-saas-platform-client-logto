import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RequestsService } from '../../../services/requests.service';
import type { RequestResponseDto } from '../../../shared/models';

@Component({
  selector: 'app-requests-list',
  imports: [RouterLink],
  templateUrl: './requests-list.html',
  styleUrl: './requests-list.css',
})
export class RequestsListComponent implements OnInit {
  private readonly requestsService = inject(RequestsService);
  private readonly router = inject(Router);

  readonly requests = signal<RequestResponseDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.loading.set(true);
    this.error.set('');
    this.requestsService.getList().subscribe({
      next: (list) => this.requests.set(list),
      error: (err) => {
        this.error.set(
          err.error?.message ?? err.message ?? 'Failed to load requests'
        );
      },
      complete: () => this.loading.set(false),
    });
  }

  goToDetail(request: RequestResponseDto): void {
    this.router.navigate(['/app/requests', request.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }
}
