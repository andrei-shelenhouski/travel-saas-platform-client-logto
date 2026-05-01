import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MAT_ICONS } from '@app/shared/material-imports';

@Component({
  selector: 'app-client-snapshot-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ...MAT_ICONS],
  templateUrl: './client-snapshot-card.html',
  styleUrl: './client-snapshot-card.scss',
})
export class ClientSnapshotCardComponent {
  readonly snapshot = input<Record<string, unknown> | null | undefined>(null);
  readonly clientId = input<string | null | undefined>(null);

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
}
