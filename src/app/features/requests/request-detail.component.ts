import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RequestsService } from '../../services/requests.service';
import type { RequestResponseDto } from '../../shared/models';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css',
})
export class RequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);
  private readonly toast = inject(ToastService);

  readonly request = signal<RequestResponseDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/app/requests']);
      return;
    }
    this.requestsService.getById(id).subscribe({
      next: (data) => this.request.set(data),
      error: (err) => {
        this.toast.showError(
          err.error?.message ?? err.message ?? 'Failed to load request'
        );
        this.router.navigate(['/app/requests']);
      },
      complete: () => this.loading.set(false),
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
