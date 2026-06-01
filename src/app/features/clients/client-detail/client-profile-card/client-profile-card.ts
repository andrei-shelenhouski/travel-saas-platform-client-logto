import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TagSelectorComponent } from '@app/shared/components';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';

import type { ClientResponseDto } from '@app/shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Физ. лицо',
  [ClientType.COMPANY]: 'Компания',
  [ClientType.B2B_AGENT]: 'B2B агент',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-profile-card',
  imports: [RouterLink, TagSelectorComponent, ...MAT_BUTTONS],
  templateUrl: './client-profile-card.html',
  styleUrl: './client-profile-card.scss',
})
export class ClientProfileCardComponent {
  readonly client = input.required<ClientResponseDto>();
  readonly clientTags = input<string[]>([]);
  readonly tagsLoading = input<boolean>(false);

  readonly editClicked = output<void>();
  readonly tagsChanged = output<string[]>();

  protected readonly typeLabel = TYPE_LABEL;

  protected readonly isB2BAgent = computed(() => this.client().type === ClientType.B2B_AGENT);

  formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

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
