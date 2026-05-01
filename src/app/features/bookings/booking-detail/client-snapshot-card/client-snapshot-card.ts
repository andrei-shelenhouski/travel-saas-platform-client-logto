import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MAT_ICONS } from '@app/shared/material-imports';

@Component({
  selector: 'app-client-snapshot-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ...MAT_ICONS],
  template: `
    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">Клиент</h2>
        @if (clientId()) {
          <a
            class="flex items-center gap-1 text-xs text-primary hover:underline"
            [routerLink]="['/app/clients', clientId()]"
          >
            <mat-icon class="text-sm!">open_in_new</mat-icon>
            Открыть профиль
          </a>
        }
      </div>

      <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-gray-500">Имя</dt>
          <dd class="font-medium text-gray-900">{{ name() }}</dd>
        </div>
        @if (clientType()) {
          <div>
            <dt class="text-gray-500">Тип клиента</dt>
            <dd class="font-medium text-gray-900">{{ clientType() }}</dd>
          </div>
        }
        @if (phone()) {
          <div>
            <dt class="text-gray-500">Телефон</dt>
            <dd class="font-medium text-gray-900">
              <a class="hover:underline" [href]="'tel:' + phone()">{{ phone() }}</a>
            </dd>
          </div>
        }
        @if (email()) {
          <div>
            <dt class="text-gray-500">Email</dt>
            <dd class="font-medium text-gray-900">
              <a class="hover:underline" [href]="'mailto:' + email()">{{ email() }}</a>
            </dd>
          </div>
        }
      </dl>
    </section>
  `,
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
