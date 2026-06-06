import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MAT_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

@Component({
  selector: 'app-client-snapshot-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ...MAT_ICONS, ...MAT_BUTTONS],
  templateUrl: './client-snapshot-card.html',
  styleUrl: './client-snapshot-card.scss',
})
export class ClientSnapshotCardComponent {
  readonly snapshot = input<Record<string, unknown> | null | undefined>(null);
  readonly clientId = input<string | null | undefined>(null);
  readonly canUpdate = input<boolean>(false);
  readonly changeRequested = output<void>();

  readonly name = computed(() => {
    const s = this.snapshot();

    if (!s) {
      return '—';
    }

    for (const key of ['fullName', 'companyName', 'name', 'clientName']) {
      if (typeof s[key] === 'string' && (s[key] as string).trim()) {
        return s[key] as string;
      }
    }

    return '—';
  });

  readonly clientType = computed(() => {
    const s = this.snapshot();

    return s ? ((s['type'] as string | null) ?? null) : null;
  });

  readonly phone = computed(() => {
    const s = this.snapshot();

    return s ? ((s['phone'] as string | null) ?? null) : null;
  });

  readonly email = computed(() => {
    const s = this.snapshot();

    return s ? ((s['email'] as string | null) ?? null) : null;
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

  readonly isB2bClient = computed(() => {
    const t = this.clientType();

    return t === 'COMPANY' || t === 'B2B_AGENT';
  });
}
