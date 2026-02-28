import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';

import { MeService } from '../../../services/me.service';
import { RequestsService } from '../../../services/requests.service';
import { ToastService } from '../../../shared/services/toast.service';
import type { CreateRequestDto } from '../../../shared/models';

@Component({
  selector: 'app-create-request',
  imports: [RouterLink, FormsModule],
  templateUrl: './create-request.html',
  styleUrl: './create-request.css',
})
export class CreateRequestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meService = inject(MeService);
  private readonly requestsService = inject(RequestsService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly saving = signal(false);
  readonly error = signal('');

  clientId = '';
  managerId = '';
  destination = '';
  startDate = '';
  endDate = '';
  adults = 1;
  children = 0;
  comment = '';

  ngOnInit(): void {
    const clientIdParam = this.route.snapshot.queryParamMap.get('clientId');
    if (clientIdParam) this.clientId = clientIdParam;

    // Pre-fill from cache if available (e.g. user came from onboarding)
    const cached = this.meService.getMeData();
    if (cached?.user?.id) {
      this.managerId = cached.user.id;
    }

    // Always fetch current user so managerId is set (cache is cleared after org selection)
    this.meService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res?.user?.id) {
            this.managerId = res.user.id;
            this.cdr.markForCheck();
          }
        },
      });
  }

  onSubmit(): void {
    this.error.set('');
    if (!this.clientId.trim() || !this.managerId.trim() || !this.destination.trim()) {
      this.error.set('Client ID, Manager ID and Destination are required.');
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.error.set('Start date and End date are required.');
      return;
    }
    this.saving.set(true);
    const dto: CreateRequestDto = {
      clientId: this.clientId.trim(),
      managerId: this.managerId.trim(),
      destination: this.destination.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
      adults: Number(this.adults) || 1,
    };
    if (Number(this.children) > 0) dto.children = Number(this.children);
    if (this.comment.trim()) dto.comment = this.comment.trim();

    this.requestsService.create(dto).subscribe({
      next: (created) => {
        this.toast.showSuccess('Request created');
        this.router.navigate(['/app/requests', created.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to create request');
      },
      complete: () => this.saving.set(false),
    });
  }
}
