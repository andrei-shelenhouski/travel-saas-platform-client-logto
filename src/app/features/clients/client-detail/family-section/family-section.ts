import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PersonsService } from '@app/services/persons.service';
import {
  type PersonRow,
  PersonsTableComponent,
} from '@app/features/persons/persons-table/persons-table.component';

import { AddFamilyMemberDialogComponent } from '../add-family-member-dialog/add-family-member-dialog';

import type {
  FamilyContextResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
} from '@app/shared/models';

const RELATION_LABEL: Record<string, string> = {
  SPOUSE_OF: 'Супруг(а)',
  PARENT_OF: 'Родитель',
  SIBLING_OF: 'Брат/сестра',
  GRANDPARENT_OF: 'Бабушка/дедушка',
  OTHER: 'Другое',
};

@Component({
  selector: 'app-family-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, PersonsTableComponent],
  templateUrl: './family-section.html',
  styleUrl: './family-section.scss',
})
export class FamilySectionComponent {
  readonly personId = input.required<string>();

  private readonly personsService = inject(PersonsService);
  private readonly dialog = inject(MatDialog);
  private readonly familyData = rxResource<FamilyContextResponseDto, string>({
    params: () => this.personId(),
    stream: ({ params }) => this.personsService.getFamilyContext(params),
    defaultValue: { familyMembers: [], relationships: [] },
  });

  protected readonly loading = computed(() => this.familyData.isLoading());

  private readonly relationshipsByPersonId = computed(() => {
    const map = new Map<string, PersonRelationshipResponseDto>();

    for (const relationship of this.familyData.value()?.relationships ?? []) {
      map.set(relationship.relatedPersonId, relationship);
    }

    return map;
  });

  protected readonly personRows = computed<PersonRow[]>(() =>
    (this.familyData.value()?.familyMembers ?? []).map((member) => {
      const relationship = this.relationshipsByPersonId().get(member.id);
      const relationLabel = this.buildRelationLabel(member, relationship);
      const relationInactive = relationship?.status === 'INACTIVE';

      return {
        id: member.id,
        fullName: [member.lastName, member.firstName, member.patronymic].filter(Boolean).join(' '),
        type: member.type,
        relation: relationLabel,
        relationInactive,
        dateOfBirth: member.dateOfBirth,
        linkedClientId: member.linked_client?.id ?? undefined,
        linkedClientName: member.linked_client?.display_name,
      };
    }),
  );

  private buildRelationLabel(
    member: PersonResponseDto,
    relationship: PersonRelationshipResponseDto | undefined,
  ): string {
    if (!relationship) {
      return '—';
    }

    const base = RELATION_LABEL[relationship.type] ?? relationship.type;

    if (relationship.status === 'INACTIVE') {
      return `Бывш. ${base.toLowerCase()}`;
    }

    return base;
  }

  protected openAddDialog(): void {
    const dialogRef = this.dialog.open(AddFamilyMemberDialogComponent, {
      width: '720px',
      data: { personId: this.personId() },
    });

    dialogRef.afterClosed().subscribe((result: { saved?: boolean } | undefined) => {
      if (result?.saved) {
        this.familyData.reload();
      }
    });
  }
}
