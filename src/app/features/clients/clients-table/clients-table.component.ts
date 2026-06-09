import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import { ClientType } from '@app/shared/models';

import type { ClientResponseDto } from '@app/shared/models';

const ALL_COLUMNS = ['name', 'type', 'phone', 'email', 'createdAt', 'updatedAt'] as const;

@Component({
  selector: 'app-clients-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIcon,
    MatProgressSpinnerModule,
    MatTableModule,
    ClientTypeBadgeComponent,
  ],
  templateUrl: './clients-table.component.html',
  styleUrl: './clients-table.component.scss',
  host: { class: 'table-wrap' },
})
export class ClientsTableComponent {
  readonly clients = input<ClientResponseDto[]>([]);
  readonly omitColumns = input<string[]>([]);
  readonly loading = input<boolean>(false);

  private readonly router = inject(Router);

  readonly displayedColumns = computed(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => !omit.has(col));
  });

  displayName(client: ClientResponseDto): string {
    if (client.type === ClientType.INDIVIDUAL) {
      return client.fullName ?? '—';
    }

    return client.companyName ?? client.fullName ?? '—';
  }

  displaySubtitle(client: ClientResponseDto): string | null {
    if (client.type === ClientType.COMPANY || client.type === ClientType.B2B_AGENT) {
      return client.fullName ?? null;
    }

    return null;
  }

  navigateToClient(id: string): void {
    void this.router.navigate(['/app/clients', id]);
  }

  navigateToCreateClient(): void {
    void this.router.navigate(['/app/clients/new']);
  }
}
