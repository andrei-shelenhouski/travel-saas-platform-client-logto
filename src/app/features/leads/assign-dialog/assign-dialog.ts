import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { OrganizationMemberResponseDto } from '@app/shared/models';

export type AssignDialogData = {
  agents: OrganizationMemberResponseDto[];
  initialSelectedAgentId: string | null;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-assign-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
  ],
  templateUrl: './assign-dialog.html',
  styleUrl: './assign-dialog.scss',
})
export class AssignDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AssignDialogComponent>);
  protected readonly data = inject<AssignDialogData>(MAT_DIALOG_DATA);

  protected readonly selectedAgentId = signal<string>('');
  protected readonly assignSearch = signal<string>('');

  protected readonly filteredAgents = computed(() => {
    const query = this.assignSearch().trim().toLowerCase();
    const items = this.data.agents;

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const inName = item.name.toLowerCase().includes(query);
      const inEmail = item.email.toLowerCase().includes(query);

      return inName || inEmail;
    });
  });

  constructor() {
    effect(() => {
      const initialId = this.data.initialSelectedAgentId;

      if (initialId) {
        this.selectedAgentId.set(initialId);
      }
    });
  }

  protected updateAssignSearch(value: string): void {
    this.assignSearch.set(value);
  }

  protected isSelectedAgent(agentId: string): boolean {
    return this.selectedAgentId() === agentId;
  }

  protected selectAgent(agentId: string): void {
    this.selectedAgentId.set(agentId);
  }

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected onConfirm(): void {
    const agentId = this.selectedAgentId();

    if (agentId) {
      this.dialogRef.close(agentId);
    }
  }

  protected getAgentInitials(name: string | null): string {
    if (!name) {
      return 'NA';
    }

    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2);

    if (parts.length === 0) {
      return 'NA';
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  }
}
