import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AuthService } from '@app/auth/auth.service';
import { ActivitiesService } from '@app/services/activities.service';
import { ClientsService } from '@app/services/clients.service';
import { CommentsService } from '@app/services/comments.service';
import { CustomFieldsService } from '@app/services/custom-fields.service';
import { TagsService } from '@app/services/tags.service';
import {
  CustomFieldsSectionComponent,
  LoadingStateComponent,
  PageContentComponent,
} from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { ClientType, EntityType, PermissionKey } from '@app/shared/models';

import { BookingsHistorySectionComponent } from './bookings-history-section/bookings-history-section';
import { ClientProfileCardComponent } from './client-profile-card/client-profile-card';
import { ContactsSectionComponent } from './contacts-section/contacts-section';
import { ContractsHistorySectionComponent } from './contracts-history-section/contracts-history-section';
import { FamilySectionComponent } from './family-section/family-section';
import { InvoicesHistorySectionComponent } from './invoices-history-section/invoices-history-section';
import { LeadsHistorySectionComponent } from './leads-history-section/leads-history-section';
import { OffersHistorySectionComponent } from './offers-history-section/offers-history-section';
import { TravelerProfileSectionComponent } from './traveler-profile-section/traveler-profile-section';

import type { ClientResponseDto, CustomFieldValueDto } from '@app/shared/models';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Физ. лицо',
  [ClientType.COMPANY]: 'Компания',
  [ClientType.B2B_AGENT]: 'B2B агент',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-detail',
  imports: [
    RouterLink,
    CustomFieldsSectionComponent,
    MatButtonModule,
    PageHeading,
    PageHeadingAction,
    LoadingStateComponent,
    PageContentComponent,
    ClientProfileCardComponent,
    ContactsSectionComponent,
    FamilySectionComponent,
    TravelerProfileSectionComponent,
    LeadsHistorySectionComponent,
    OffersHistorySectionComponent,
    BookingsHistorySectionComponent,
    InvoicesHistorySectionComponent,
    ContractsHistorySectionComponent,
  ],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.scss',
})
export class ClientDetailComponent {
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly clientsService = inject(ClientsService);
  private readonly customFieldsService = inject(CustomFieldsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly commentsService = inject(CommentsService);
  private readonly tagsService = inject(TagsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly titleService = inject(Title);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));

  private readonly data = rxResource<ClientResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.clientsService.getById(id);
    },
  });

  private readonly tagsVersion = signal(0);

  private readonly entityTagsData = rxResource({
    params: (): [string | null, number] => [this.routeId() ?? null, this.tagsVersion()],
    stream: ({ params }) => {
      const [clientId] = params;

      if (clientId === null) {
        return EMPTY;
      }

      return this.tagsService.findAll({
        entityType: EntityType.Client,
        entityId: clientId,
      });
    },
  });

  private readonly customFieldsData = rxResource<CustomFieldValueDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;

      if (id === null) {
        return EMPTY;
      }

      return this.customFieldsService.getClientValues(id);
    },
  });

  readonly typeLabel = TYPE_LABEL;
  readonly client = computed(() => this.data.value() ?? null);

  private readonly _titleEffect = effect(() => {
    const c = this.client();

    if (c?.fullName) {
      this.titleService.setTitle(`${c.fullName} — Navio`);
    }
  });

  readonly loading = computed(() => this.data.isLoading());
  readonly tagsLoading = computed(() => this.entityTagsData.isLoading());
  readonly tagsSaveLoading = signal(false);

  readonly isB2BAgent = computed(() => this.client()?.type === ClientType.B2B_AGENT);
  readonly canViewContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_VIEW),
  );
  readonly canCreateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_CREATE),
  );
  readonly canUpdateContracts = computed(() =>
    this.authService.hasPermission(PermissionKey.CONTRACTS_UPDATE),
  );

  readonly customFieldsSaving = signal(false);
  readonly customFields = computed(() => {
    return (this.customFieldsData.value() ?? []).map((field, index) => ({
      definitionId: field.definitionId,
      name: field.name,
      fieldType: field.fieldType,
      options: field.options ?? [],
      value: field.value ?? '',
      required: false,
      sortOrder: index + 1,
    }));
  });

  readonly clientTags = computed<string[]>(() => {
    const tags = this.entityTagsData.value() ?? [];

    return tags.map((t) => t.name);
  });

  readonly entityTags = computed(() => this.entityTagsData.value() ?? []);

  constructor() {
    effect(() => {
      if (this.routeId() === null) {
        this.router.navigate(['/app/clients']);
      }
    });
  }

  onTagsChange(tags: string[]): void {
    const c = this.client();

    if (!c || this.tagsSaveLoading()) {
      return;
    }
    const current = this.clientTags();
    const added = tags.filter((n) => !current.includes(n));
    const removed = current.filter((n) => !tags.includes(n));
    const entityTags = this.entityTags();

    if (added.length === 0 && removed.length === 0) {
      return;
    }

    this.tagsSaveLoading.set(true);
    const done = (): void => {
      this.tagsVersion.update((v) => v + 1);
      this.tagsSaveLoading.set(false);
    };

    let pending = added.length + removed.length;
    const checkDone = (): void => {
      pending -= 1;

      if (pending === 0) {
        done();
      }
    };

    for (const name of added) {
      this.tagsService
        .create({ name })
        .pipe(
          switchMap((tag) =>
            this.tagsService.attach(tag.id, {
              entityType: EntityType.Client,
              entityId: c.id,
            }),
          ),
        )
        .subscribe({
          next: checkDone,
          error: () => {
            this.snackBar.open('Не удалось добавить тег', 'Close', { duration: 5000 });
            checkDone();
          },
        });
    }
    for (const name of removed) {
      const tag = entityTags.find((t) => t.name === name);

      if (!tag) {
        checkDone();
        continue;
      }
      this.tagsService.detach(tag.id, EntityType.Client, c.id).subscribe({
        next: checkDone,
        error: () => {
          this.snackBar.open('Не удалось удалить тег', 'Close', { duration: 5000 });
          checkDone();
        },
      });
    }
    if (pending === 0) {
      this.tagsSaveLoading.set(false);
    }
  }

  onSaveCustomFields(values: Record<string, string>): void {
    const c = this.client();

    if (!c) {
      return;
    }

    this.customFieldsSaving.set(true);
    this.customFieldsService.upsertClientValues(c.id, { values }).subscribe({
      next: (updatedValues) => {
        this.customFieldsData.set(updatedValues);
        this.customFieldsSaving.set(false);
        this.snackBar.open('Дополнительные поля сохранены', 'Close', { duration: 4000 });
      },
      error: (err) => {
        this.customFieldsSaving.set(false);
        this.snackBar.open(
          err.error?.message ?? 'Не удалось сохранить дополнительные поля',
          'Close',
          { duration: 5000 },
        );
      },
    });
  }

  readonly resolvedPersonId = signal<string | null>(null);

  protected onTravelerPersonIdResolved(personId: string): void {
    this.resolvedPersonId.set(personId);
  }

  protected onTravelerPrimaryContactChanged(): void {
    this.data.reload();
  }
}
