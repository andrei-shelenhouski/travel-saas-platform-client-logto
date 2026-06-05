import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';

import { PersonsService } from '@app/services/persons.service';
import { MAT_BUTTONS, MAT_FORM_BUTTONS } from '@app/shared/material-imports';

import type { PersonDocumentResponseDto, PersonResponseDto } from '@app/shared/models';

export type AddTravelersDialogData = {
  familyMembers: PersonResponseDto[];
  returnDate?: string;
  activeRelationshipPersonIds: string[];
  mode: 'family' | 'search';
};

export type AddTravelersDialogResult = {
  items: { personId: string; documentId?: string }[];
  persons: PersonResponseDto[];
};

@Component({
  selector: 'app-add-travelers-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
  ],
  templateUrl: './add-travelers-dialog.html',
  styleUrl: './add-travelers-dialog.scss',
})
export class AddTravelersDialogComponent {
  protected readonly data = inject<AddTravelersDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<AddTravelersDialogComponent, AddTravelersDialogResult>,
  );
  private readonly personsService = inject(PersonsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly selected = signal<Record<string, boolean>>({});
  protected readonly selectedDocByPerson = signal<Record<string, string>>({});

  protected readonly familyMembers = computed(() => this.data.familyMembers ?? []);
  protected readonly isSearchMode = computed(() => this.data.mode === 'search');

  protected readonly searchResults = signal<PersonResponseDto[]>([]);
  protected readonly searching = signal(false);
  protected readonly searchQuery = signal('');

  protected readonly leadPersonId = signal<string | null>(null);
  protected readonly loadedFamily = signal<PersonResponseDto[]>([]);
  protected readonly loadingForPersonId = signal<string | null>(null);

  private readonly allKnownPersons = signal<Record<string, PersonResponseDto>>({});
  private readonly searchSubject = new Subject<string>();

  constructor() {
    const initial: Record<string, PersonResponseDto> = {};

    for (const m of this.data.familyMembers ?? []) {
      initial[m.id] = m;
    }

    this.allKnownPersons.set(initial);

    if (this.data.mode === 'search') {
      this.searchSubject
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((query) => {
            if (query.trim().length < 2) {
              this.searching.set(false);

              return of<PersonResponseDto[]>([]);
            }

            this.searching.set(true);

            return this.personsService
              .searchFull(query)
              .pipe(finalize(() => this.searching.set(false)));
          }),
          takeUntilDestroyed(),
        )
        .subscribe((results) => {
          this.searchResults.set(results);
          this.allKnownPersons.update((current) => {
            const next = { ...current };

            for (const p of results) {
              next[p.id] = p;
            }

            return next;
          });
        });
    }
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  protected loadFamilyForLead(person: PersonResponseDto): void {
    this.loadingForPersonId.set(person.id);
    this.loadedFamily.set([]);

    forkJoin({
      family: this.personsService.getFamily(person.id),
      relationships: this.personsService.getRelationships(person.id),
    })
      .pipe(finalize(() => this.loadingForPersonId.set(null)))
      .subscribe({
        next: ({ family, relationships }) => {
          const activeIds = new Set(
            relationships.filter((r) => r.status === 'ACTIVE').map((r) => r.relatedPersonId),
          );
          activeIds.add(person.id);

          const members = family.filter((m) => m.id !== person.id);

          this.leadPersonId.set(person.id);
          this.loadedFamily.set(members);
          this.allKnownPersons.update((current) => {
            const next = { ...current };

            for (const m of members) {
              next[m.id] = m;
            }

            return next;
          });

          // Pre-select lead + active family members
          this.selected.update((current) => {
            const next = { ...current, [person.id]: true };

            for (const m of members) {
              next[m.id] = activeIds.has(m.id);
            }

            return next;
          });
        },
        error: () => {
          this.snackBar.open('Не удалось загрузить семью', 'Close', { duration: 5000 });
        },
      });
  }

  protected addWholeFamily(): void {
    if (this.isSearchMode()) {
      const leadId = this.leadPersonId();

      this.selected.update((current) => {
        const next = { ...current };

        if (leadId) {
          next[leadId] = true;
        }

        for (const member of this.loadedFamily()) {
          next[member.id] = member.active !== false;
        }

        return next;
      });
    } else {
      const nextSelected: Record<string, boolean> = {};
      const activeIds = new Set(this.data.activeRelationshipPersonIds ?? []);

      for (const member of this.familyMembers()) {
        nextSelected[member.id] =
          activeIds.size > 0 ? activeIds.has(member.id) : member.active !== false;
      }

      this.selected.set(nextSelected);
    }
  }

  protected toggleMember(personId: string, checked: boolean): void {
    this.selected.update((current) => ({ ...current, [personId]: checked }));
  }

  protected setDocument(personId: string, documentId: string): void {
    this.selectedDocByPerson.update((current) => ({ ...current, [personId]: documentId }));
  }

  protected isSelected(personId: string): boolean {
    return Boolean(this.selected()[personId]);
  }

  protected isLead(personId: string): boolean {
    return this.isSearchMode() && this.leadPersonId() === personId;
  }

  protected fullName(member: PersonResponseDto): string {
    return [member.lastName, member.firstName, member.patronymic].filter(Boolean).join(' ');
  }

  protected docs(member: PersonResponseDto): PersonDocumentResponseDto[] {
    return member.documents ?? [];
  }

  protected primaryDocument(member: PersonResponseDto): PersonDocumentResponseDto | undefined {
    const docs = this.docs(member);

    return docs.find((item) => item.primary) ?? docs[0];
  }

  protected selectedDocumentId(member: PersonResponseDto): string {
    return this.selectedDocByPerson()[member.id] ?? this.primaryDocument(member)?.id ?? '';
  }

  protected selectedDocument(member: PersonResponseDto): PersonDocumentResponseDto | undefined {
    const selectedDocumentId = this.selectedDocumentId(member);

    return this.docs(member).find((item) => item.id === selectedDocumentId);
  }

  protected shouldShowExpiryWarning(member: PersonResponseDto): boolean {
    const document = this.selectedDocument(member);

    if (!document?.expiryDate) {
      return false;
    }

    if (document.type !== 'INTL_PASSPORT' && document.type !== 'NATIONAL_ID') {
      return false;
    }

    if (!this.data.returnDate) {
      return false;
    }

    const returnDate = new Date(this.data.returnDate);
    const expiryDate = new Date(document.expiryDate);
    const sixMonthsAfterReturn = new Date(returnDate);

    sixMonthsAfterReturn.setMonth(sixMonthsAfterReturn.getMonth() + 6);

    return expiryDate <= sixMonthsAfterReturn;
  }

  protected documentLabel(document: PersonDocumentResponseDto): string {
    return `${document.type} ${document.series ?? ''} ****${document.numberLast4}`.trim();
  }

  protected save(): void {
    const items: { personId: string; documentId?: string }[] = [];
    const persons: PersonResponseDto[] = [];
    const known = this.allKnownPersons();
    const selectedMap = this.selected();

    // In search mode, LEAD person goes first
    const leadId = this.isSearchMode() ? this.leadPersonId() : null;

    const sortedIds = Object.keys(selectedMap).sort((a, b) => {
      if (a === leadId) {
        return -1;
      }

      if (b === leadId) {
        return 1;
      }

      return 0;
    });

    for (const personId of sortedIds) {
      if (!selectedMap[personId]) {
        continue;
      }

      const member = known[personId];

      if (!member) {
        continue;
      }

      const documentId = this.selectedDocumentId(member);

      items.push({ personId, documentId: documentId || undefined });
      persons.push(member);
    }

    this.dialogRef.close({ items, persons });
  }

  protected close(): void {
    this.dialogRef.close({ items: [], persons: [] });
  }
}
