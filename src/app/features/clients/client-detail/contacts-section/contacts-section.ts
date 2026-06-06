import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { ClientsService } from '@app/services/clients.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';
import { MAT_BUTTONS, MAT_ICONS, MAT_MENU } from '@app/shared/material-imports';

import {
  ContactFormDialogComponent,
  ContactFormDialogData,
  ContactFormDialogResult,
} from '../contact-form-dialog/contact-form-dialog';

import type { ContactResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-contacts-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MatTableModule, ...MAT_BUTTONS, ...MAT_ICONS, ...MAT_MENU],
  templateUrl: './contacts-section.html',
  styleUrl: './contacts-section.scss',
})
export class ContactsSectionComponent {
  readonly clientId = input.required<string>();

  private readonly clientsService = inject(ClientsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly contactsData = rxResource<ContactResponseDto[], string>({
    params: () => this.clientId(),
    stream: ({ params }) => this.clientsService.listContacts(params),
    defaultValue: [],
  });

  protected readonly loading = computed(() => this.contactsData.isLoading());
  protected readonly contacts = computed(() => {
    const items = this.contactsData.value() ?? [];

    return [...items].sort((a, b) => {
      if (a.primary && !b.primary) {
        return -1;
      }

      if (!a.primary && b.primary) {
        return 1;
      }

      return 0;
    });
  });

  protected readonly columns = [
    'name',
    'role',
    'phone',
    'email',
    'telegram',
    'primary',
    'actions',
  ] as const;

  protected openAddDialog(): void {
    const dialogRef = this.dialog.open<
      ContactFormDialogComponent,
      ContactFormDialogData,
      ContactFormDialogResult
    >(ContactFormDialogComponent, {
      width: '560px',
      data: { clientId: this.clientId(), mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.contactsData.reload();
      }
    });
  }

  protected openEditDialog(contact: ContactResponseDto): void {
    const dialogRef = this.dialog.open<
      ContactFormDialogComponent,
      ContactFormDialogData,
      ContactFormDialogResult
    >(ContactFormDialogComponent, {
      width: '560px',
      data: { clientId: this.clientId(), mode: 'edit', contact },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.contactsData.reload();
      }
    });
  }

  protected makePrimary(contact: ContactResponseDto): void {
    this.clientsService.updateContact(this.clientId(), contact.id, { isPrimary: true }).subscribe({
      next: () => this.contactsData.reload(),
      error: (err) =>
        this.snackBar.open(err?.error?.message ?? 'Не удалось изменить основной контакт', 'Close', {
          duration: 5000,
        }),
    });
  }

  protected deleteContact(contact: ContactResponseDto): void {
    this.confirmDialog
      .open({
        title: 'Удалить контакт',
        message: `Удалить контакт ${contact.fullName ?? 'без имени'}?`,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.clientsService.deleteContact(this.clientId(), contact.id).subscribe({
          next: () => this.contactsData.reload(),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить контакт', 'Close', {
              duration: 5000,
            }),
        });
      });
  }
}
