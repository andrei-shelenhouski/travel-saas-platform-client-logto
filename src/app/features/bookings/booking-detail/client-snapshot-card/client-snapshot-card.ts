import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';

@Component({
  selector: 'app-client-snapshot-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ClientTypeBadgeComponent, MatIconModule, MatButtonModule],
  templateUrl: './client-snapshot-card.html',
  styleUrl: './client-snapshot-card.scss',
})
export class ClientSnapshotCardComponent {
  readonly snapshot = input<Record<string, unknown> | null | undefined>(null);
  readonly clientId = input<string | null | undefined>(null);
  readonly canUpdate = input<boolean>(false);
  readonly changeRequested = output<void>();

  readonly clientType = computed(() => {
    const s = this.snapshot();

    return s ? ((s['type'] as string | null) ?? null) : null;
  });

  readonly isB2bClient = computed(() => {
    const t = this.clientType();

    return t === 'COMPANY' || t === 'B2B_AGENT';
  });

  readonly companyName = computed(() => {
    const s = this.snapshot();

    return s ? ((s['companyName'] as string | null) ?? null) : null;
  });

  readonly representativeName = computed(() => {
    const s = this.snapshot();

    if (!s) {
      return null;
    }

    for (const key of ['fullName', 'name', 'clientName']) {
      if (typeof s[key] === 'string' && (s[key] as string).trim()) {
        return s[key] as string;
      }
    }

    return null;
  });

  readonly displayName = computed(() => {
    if (this.isB2bClient()) {
      return this.companyName() ?? this.representativeName() ?? '—';
    }

    return this.representativeName() ?? this.companyName() ?? '—';
  });

  readonly phone = computed(() => {
    const s = this.snapshot();

    return s ? ((s['phone'] as string | null) ?? null) : null;
  });

  readonly email = computed(() => {
    const s = this.snapshot();

    return s ? ((s['email'] as string | null) ?? null) : null;
  });

  readonly telegram = computed(() => {
    const s = this.snapshot();

    return s
      ? ((s['telegramHandle'] as string | null) ?? (s['contactTelegram'] as string | null) ?? null)
      : null;
  });

  readonly contactPerson = computed(() => {
    const s = this.snapshot();

    if (!s) {
      return null;
    }

    const cp = s['contactPerson'];

    if (!cp || typeof cp !== 'object') {
      return null;
    }

    return cp as {
      fullName?: string;
      role?: string;
      phone?: string;
      email?: string;
      telegramHandle?: string;
    };
  });

  getInitials(name: string | null): string {
    if (!name) {
      return '?';
    }

    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
}
