import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

import { PermissionService } from '@app/services/permission.service';
import { RequestsService } from '@app/services/requests.service';
import type { RequestResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-requests-list',
  imports: [RouterLink],
  templateUrl: './requests-list.html',
  styleUrl: './requests-list.css',
})
export class RequestsListComponent {
  private readonly requestsService = inject(RequestsService);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly data = rxResource({
    stream: () => this.requestsService.getList(),
  });

  readonly requests = computed(() => {
    const list = this.data.value()?.data ?? [];

    if (!this.permissions.filterToOwnRecords()) {
      return list;
    }
    const uid = this.permissions.currentUserId();

    if (!uid) {
      return list;
    }

    return list.filter((r) => r.managerId === uid);
  });
  readonly loading = computed(() => this.data.isLoading());
  readonly error = computed(() => {
    const err = this.data.error();

    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.message ?? 'Failed to load requests';
    }

    return undefined;
  });

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
