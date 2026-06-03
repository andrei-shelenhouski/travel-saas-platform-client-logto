import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { EMPTY, forkJoin } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { MAT_BUTTONS } from '@app/shared/material-imports';
import { ClientType } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import type {
  BookingResponseDto,
  PersonRelationshipResponseDto,
  PersonResponseDto,
} from '@app/shared/models';

@Component({
  selector: 'app-person-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeading, ...MAT_BUTTONS],
  templateUrl: './person-detail.html',
  styleUrl: './person-detail.scss',
})
export class PersonDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly personsService = inject(PersonsService);
  private readonly clientsService = inject(ClientsService);
  private readonly bookingsService = inject(BookingsService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));

  private readonly personData = rxResource<
    {
      person: PersonResponseDto;
      relationships: PersonRelationshipResponseDto[];
      family: PersonResponseDto[];
      bookings: BookingResponseDto[];
    },
    string | null
  >({
    params: () => this.routeId() ?? null,
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }

      return forkJoin({
        person: this.personsService.getById(params),
        relationships: this.personsService.getRelationships(params),
        family: this.personsService.getFamily(params),
        bookings: this.bookingsService
          .getList({ page: 1, limit: 20, travelerPersonId: params })
          .pipe(map((response) => response.items)),
      });
    },
  });

  protected readonly person = computed(() => this.personData.value()?.person ?? null);
  protected readonly relationships = computed(() => this.personData.value()?.relationships ?? []);
  protected readonly relatedClientByPersonId = computed(() => {
    const clientsMap = new Map<string, string>();

    for (const person of this.personData.value()?.family ?? []) {
      if (person.clientId) {
        clientsMap.set(person.id, person.clientId);
      }
    }

    return clientsMap;
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

  protected readonly canPromote = computed(() => !this.person()?.clientId);

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) {
      return '—';
    }

    return new Date(iso).toLocaleDateString('ru-RU');
  }

  protected openClient(clientId: string): void {
    void this.router.navigate(['/app/clients', clientId]);
  }

  protected relationshipStatusLabel(status: string): string {
    return status === 'INACTIVE' ? 'Неактивная' : 'Активная';
  }

  protected openBooking(bookingId: string): void {
    void this.router.navigate(['/app/bookings', bookingId]);
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
}
