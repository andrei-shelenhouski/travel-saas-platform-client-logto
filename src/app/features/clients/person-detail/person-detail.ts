import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EMPTY, forkJoin } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import {
  DetailSectionComponent,
  LoadingStateComponent,
  PageContentComponent,
} from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { ClientType } from '@app/shared/models';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import { PersonAddressesTableComponent } from './person-addresses-table/person-addresses-table';
import { PersonBookingsTableComponent } from './person-bookings-table/person-bookings-table';
import { PersonContactsTableComponent } from './person-contacts-table/person-contacts-table';
import { PersonDocumentsTableComponent } from './person-documents-table/person-documents-table';
import { PersonRelationshipsTableComponent } from './person-relationships-table/person-relationships-table';

import {
  PersonAddressDialogComponent,
  PersonAddressDialogData,
  PersonAddressDialogResult,
} from './person-address-dialog/person-address-dialog';
import {
  PersonConsentDialogComponent,
  PersonConsentDialogData,
  PersonConsentDialogResult,
} from './person-consent-dialog/person-consent-dialog';
import {
  PersonContactDialogComponent,
  PersonContactDialogData,
  PersonContactDialogResult,
} from './person-contact-dialog/person-contact-dialog';
import {
  PersonDocumentDialogComponent,
  PersonDocumentDialogData,
  PersonDocumentDialogResult,
} from './person-document-dialog/person-document-dialog';

import type {
  FamilyContextResponseDto,
  PersonAddressResponseDto,
  PersonBookingItemDto,
  PersonContactResponseDto,
  PersonDocumentResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
} from '@app/shared/models';

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  OTHER: 'Другой',
};

@Component({
  selector: 'app-person-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeading,
    PageHeadingAction,
    LoadingStateComponent,
    PageContentComponent,
    DetailSectionComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    PersonDocumentsTableComponent,
    PersonAddressesTableComponent,
    PersonContactsTableComponent,
    PersonRelationshipsTableComponent,
    PersonBookingsTableComponent,
  ],
  templateUrl: './person-detail.html',
  styleUrl: './person-detail.scss',
})
export class PersonDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly personsService = inject(PersonsService);
  private readonly clientsService = inject(ClientsService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));

  private readonly personVersion = signal(0);

  private readonly personData = rxResource<
    {
      person: PersonResponseDto;
      familyContext: FamilyContextResponseDto;
      bookings: PersonBookingItemDto[];
    },
    readonly [string | null, number]
  >({
    params: () => [this.routeId() ?? null, this.personVersion()] as const,
    stream: ({ params }) => {
      const [id] = params;

      if (!id) {
        return EMPTY;
      }

      return forkJoin({
        person: this.personsService.getById(id),
        familyContext: this.personsService.getFamilyContext(id),
        bookings: this.personsService
          .getBookings(id, { page: 1, limit: 25 })
          .pipe(map((response) => response.items)),
      });
    },
  });

  protected readonly person = computed(() => this.personData.value()?.person ?? null);
  protected readonly relationships = computed(
    () => this.personData.value()?.familyContext.relationships ?? [],
  );
  protected readonly relatedClientByPersonId = computed(() => {
    const clientsMap = new Map<string, string>();

    for (const person of this.personData.value()?.familyContext.familyMembers ?? []) {
      if (person.linked_client) {
        clientsMap.set(person.id, person.linked_client.id);
      }
    }

    return clientsMap;
  });

  protected readonly relatedPersonNameById = computed(() => {
    const nameMap = new Map<string, string>();

    for (const person of this.personData.value()?.familyContext.familyMembers ?? []) {
      const name = [person.lastName, person.firstName, person.patronymic].filter(Boolean).join(' ');

      nameMap.set(person.id, name);
    }

    return nameMap;
  });
  protected readonly bookings = computed(() => this.personData.value()?.bookings ?? []);
  protected readonly loading = computed(() => this.personData.isLoading());
  protected readonly promoting = signal(false);

  protected readonly age = computed(() => {
    const dob = this.person()?.dateOfBirth;

    if (!dob) {
      return null;
    }

    const birthDate = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  });

  protected readonly consentGiven = computed(() => this.person()?.dataConsentGiven === true);

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }

  protected openClient(clientId: string): void {
    void this.router.navigate(['/app/clients', clientId]);
  }

  protected openCreateDocumentDialog(): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonDocumentDialogComponent,
      PersonDocumentDialogData,
      PersonDocumentDialogResult
    >(PersonDocumentDialogComponent, {
      width: '560px',
      data: { personId, mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected openEditDocumentDialog(document: PersonDocumentResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonDocumentDialogComponent,
      PersonDocumentDialogData,
      PersonDocumentDialogResult
    >(PersonDocumentDialogComponent, {
      width: '560px',
      data: { personId, mode: 'edit', document },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected deleteDocument(document: PersonDocumentResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить документ',
        message: 'Удалить документ?',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.personsService.deleteDocument(personId, document.id).subscribe({
          next: () => this.reloadPerson(),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить документ', 'Close', {
              duration: 5000,
            }),
        });
      });
  }

  protected openCreateAddressDialog(): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonAddressDialogComponent,
      PersonAddressDialogData,
      PersonAddressDialogResult
    >(PersonAddressDialogComponent, {
      width: '560px',
      data: { personId, mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected openEditAddressDialog(address: PersonAddressResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonAddressDialogComponent,
      PersonAddressDialogData,
      PersonAddressDialogResult
    >(PersonAddressDialogComponent, {
      width: '560px',
      data: { personId, mode: 'edit', address },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected deleteAddress(address: PersonAddressResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить адрес',
        message: 'Удалить адрес?',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.personsService.deleteAddress(personId, address.id).subscribe({
          next: () => this.reloadPerson(),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить адрес', 'Close', {
              duration: 5000,
            }),
        });
      });
  }

  protected openCreateContactDialog(): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonContactDialogComponent,
      PersonContactDialogData,
      PersonContactDialogResult
    >(PersonContactDialogComponent, {
      width: '560px',
      data: { personId, mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected openEditContactDialog(contact: PersonContactResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonContactDialogComponent,
      PersonContactDialogData,
      PersonContactDialogResult
    >(PersonContactDialogComponent, {
      width: '560px',
      data: { personId, mode: 'edit', contact },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected deleteContact(contact: PersonContactResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить контакт',
        message: 'Удалить контакт?',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.personsService.deleteContact(personId, contact.id).subscribe({
          next: () => this.reloadPerson(),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить контакт', 'Close', {
              duration: 5000,
            }),
        });
      });
  }

  protected deleteRelationship(rel: PersonRelationshipResponseDto): void {
    const personId = this.person()?.id;

    if (!personId) {
      return;
    }

    this.confirmDialog
      .open({
        title: 'Удалить связь',
        message: 'Удалить связанное лицо?',
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.personsService.deleteRelationship(personId, rel.id).subscribe({
          next: () => this.reloadPerson(),
          error: (err) =>
            this.snackBar.open(err?.error?.message ?? 'Не удалось удалить связь', 'Close', {
              duration: 5000,
            }),
        });
      });
  }

  protected openBooking(bookingId: string): void {
    void this.router.navigate(['/app/bookings', bookingId]);
  }

  protected genderLabel(g: string | null | undefined): string {
    if (!g) {
      return '—';
    }

    return GENDER_LABEL[g] ?? g;
  }

  protected openConsentDialog(): void {
    const person = this.person();

    if (!person) {
      return;
    }

    const dialogRef = this.dialog.open<
      PersonConsentDialogComponent,
      PersonConsentDialogData,
      PersonConsentDialogResult
    >(PersonConsentDialogComponent, {
      width: '480px',
      data: { personId: person.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.saved) {
        this.reloadPerson();
      }
    });
  }

  protected promoteToClient(): void {
    const person = this.person();

    if (!person || this.promoting()) {
      return;
    }

    const primaryPhone = person.contacts.find(
      (item) => item.medium === 'PHONE' && item.primary,
    )?.value;
    const primaryEmail = person.contacts.find(
      (item) => item.medium === 'EMAIL' && item.primary,
    )?.value;
    const fullNameParts = [person.lastName, person.firstName, person.patronymic].filter(Boolean);

    this.promoting.set(true);
    this.clientsService
      .create({
        type: ClientType.INDIVIDUAL,
        fullName: fullNameParts.join(' '),
        phone: primaryPhone,
        email: primaryEmail,
        dataConsentGiven: Boolean(person.dataConsentGiven),
      })
      .pipe(
        switchMap((client) =>
          this.personsService
            .linkToClient(client.id, { personId: person.id })
            .pipe(map(() => client)),
        ),
        finalize(() => this.promoting.set(false)),
      )
      .subscribe({
        next: (client) => {
          this.snackBar.open('Профиль клиента создан', 'Close', { duration: 4000 });
          void this.router.navigate(['/app/clients', client.id]);
        },
        error: () =>
          this.snackBar.open('Не удалось создать профиль клиента', 'Close', { duration: 5000 }),
      });
  }

  private reloadPerson(): void {
    this.personVersion.update((value) => value + 1);
  }
}
