import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';

import { forkJoin } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';
import { MAT_BUTTONS } from '@app/shared/material-imports';

import { AddFamilyMemberDialogComponent } from '../add-family-member-dialog/add-family-member-dialog';

import type { PersonRelationshipResponseDto, PersonResponseDto } from '@app/shared/models';

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
  imports: [RouterLink, ...MAT_BUTTONS],
  templateUrl: './family-section.html',
  styleUrl: './family-section.scss',
})
export class FamilySectionComponent {
  readonly personId = input.required<string>();

  private readonly personsService = inject(PersonsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly familyData = rxResource<
    { members: PersonResponseDto[]; relationships: PersonRelationshipResponseDto[] },
    string
  >({
    params: () => this.personId(),
    stream: ({ params }) =>
      forkJoin({
        members: this.personsService.getFamily(params),
        relationships: this.personsService.getRelationships(params),
      }),
    defaultValue: { members: [], relationships: [] },
  });

  protected readonly loading = computed(() => this.familyData.isLoading());
  protected readonly family = computed(() => this.familyData.value()?.members ?? []);
  protected readonly relationshipsByPersonId = computed(() => {
    const map = new Map<string, PersonRelationshipResponseDto>();

    for (const relationship of this.familyData.value()?.relationships ?? []) {
      map.set(relationship.toPersonId, relationship);
    }

    return map;
  });

  protected relationLabel(member: PersonResponseDto): string {
    const relationship = this.relationshipsByPersonId().get(member.id);

    if (!relationship) {
      return '—';
    }

    const base = RELATION_LABEL[relationship.type] ?? relationship.type;

    if (relationship.status === 'INACTIVE') {
      return `Бывш. ${base.toLowerCase()}`;
    }

    return base;
  }

  protected relationshipInactive(member: PersonResponseDto): boolean {
    return this.relationshipsByPersonId().get(member.id)?.status === 'INACTIVE';
  }

  protected fullName(member: PersonResponseDto): string {
    return [member.lastName, member.firstName, member.patronymic].filter(Boolean).join(' ');
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

  protected openPersonCard(member: PersonResponseDto): void {
    void this.router.navigate(['/app/persons', member.id]);
  }

  protected trackMember(_: number, member: PersonResponseDto): string {
    return member.id;
  }
}
