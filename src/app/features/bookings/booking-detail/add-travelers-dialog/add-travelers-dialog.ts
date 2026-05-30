import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MAT_BUTTONS } from '@app/shared/material-imports';

import type { PersonDocumentResponseDto, PersonResponseDto } from '@app/shared/models';

type AddTravelersDialogData = {
  familyMembers: PersonResponseDto[];
  returnDate?: string;
};

type AddTravelersDialogResult = {
  items: { personId: string; documentId?: string }[];
};

@Component({
  selector: 'app-add-travelers-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, ...MAT_BUTTONS],
  templateUrl: './add-travelers-dialog.html',
  styleUrl: './add-travelers-dialog.scss',
})
export class AddTravelersDialogComponent {
  protected readonly data = inject<AddTravelersDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(
    MatDialogRef<AddTravelersDialogComponent, AddTravelersDialogResult>,
  );

  protected readonly selected = signal<Record<string, boolean>>({});
  protected readonly selectedDocByPerson = signal<Record<string, string>>({});

  protected readonly familyMembers = computed(() => this.data.familyMembers ?? []);

  protected toggleMember(personId: string, checked: boolean): void {
    this.selected.update((current) => ({ ...current, [personId]: checked }));
  }

  protected setDocument(personId: string, documentId: string): void {
    this.selectedDocByPerson.update((current) => ({ ...current, [personId]: documentId }));
  }

  protected addWholeFamily(): void {
    const nextSelected: Record<string, boolean> = {};

    for (const member of this.familyMembers()) {
      nextSelected[member.id] = member.active !== false;
    }

    this.selected.set(nextSelected);
  }

  protected isSelected(personId: string): boolean {
    return Boolean(this.selected()[personId]);
  }

  protected fullName(member: PersonResponseDto): string {
    return [member.lastName, member.firstName, member.patronymic].filter(Boolean).join(' ');
  }

  protected docs(member: PersonResponseDto): PersonDocumentResponseDto[] {
    return (member.documents as PersonDocumentResponseDto[] | null) ?? [];
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

    for (const member of this.familyMembers()) {
      if (!this.isSelected(member.id)) {
        continue;
      }

      const documentId = this.selectedDocumentId(member);
      items.push({ personId: member.id, documentId: documentId || undefined });
    }

    this.dialogRef.close({ items });
  }

  protected close(): void {
    this.dialogRef.close({ items: [] });
  }
}
