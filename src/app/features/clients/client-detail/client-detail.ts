import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { ActivitiesService } from '../../../services/activities.service';
import { ClientsService } from '../../../services/clients.service';
import { CommentsService } from '../../../services/comments.service';
import { RequestsService } from '../../../services/requests.service';
import { TagsService } from '../../../services/tags.service';
import type { ClientResponseDto, RequestResponseDto } from '../../../shared/models';
import { ClientType, EntityType } from '../../../shared/models';
import type { ActivityTimelineItem } from '../../../shared/models';
import type { CommentItem } from '../../../shared/models';
import {
  ActivityTimelineComponent,
  CommentComponent,
  TagSelectorComponent,
} from '../../../shared/components';
import { ToastService } from '../../../shared/services/toast.service';

const TYPE_LABEL: Record<string, string> = {
  [ClientType.INDIVIDUAL]: 'Individual',
  [ClientType.AGENT]: 'Agent',
};

type ClientTab = 'overview' | 'requests' | 'activity' | 'comments';

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink, ActivityTimelineComponent, TagSelectorComponent, CommentComponent],
  templateUrl: './client-detail.html',
  styleUrl: './client-detail.css',
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly requestsService = inject(RequestsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly commentsService = inject(CommentsService);
  private readonly tagsService = inject(TagsService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id')))
  );

  private readonly data = rxResource<ClientResponseDto, string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      const id = params;
      if (id == null) return EMPTY;
      return this.clientsService.getById(id);
    },
  });

  private readonly requestsData = rxResource<RequestResponseDto[], string | null>({
    params: (): string | null => this.routeId() ?? null,
    stream: () => {
      return this.requestsService.getList({ limit: 100 }).pipe(
        map((res) => res.data)
      );
    },
  });

  private readonly commentsVersion = signal(0);
  private readonly tagsVersion = signal(0);

  private readonly activitiesData = rxResource({
    params: (): string | null => this.routeId() ?? null,
    stream: ({ params }) => {
      if (params == null) return EMPTY;
      return this.activitiesService
        .findByEntity({
          entityType: EntityType.Client,
          entityId: params,
          limit: 50,
        })
        .pipe(map((r) => r.items));
    },
  });

  private readonly commentsData = rxResource({
    params: (): [string | null, number] => [
      this.routeId() ?? null,
      this.commentsVersion(),
    ],
    stream: ({ params }) => {
      const [clientId] = params;
      if (clientId == null) return EMPTY;
      return this.commentsService
        .findByEntity({
          commentableType: EntityType.Client,
          commentableId: clientId,
          limit: 100,
        })
        .pipe(map((r) => r.items));
    },
  });

  private readonly entityTagsData = rxResource({
    params: (): [string | null, number] => [
      this.routeId() ?? null,
      this.tagsVersion(),
    ],
    stream: ({ params }) => {
      const [clientId] = params;
      if (clientId == null) return EMPTY;
      return this.tagsService.findAll({
        entityType: EntityType.Client,
        entityId: clientId,
      });
    },
  });

  readonly typeLabel = TYPE_LABEL;
  readonly client = computed(() => this.data.value() ?? null);
  readonly loading = computed(() => this.data.isLoading());
  readonly requests = computed(() => {
    const list = this.requestsData.value() ?? [];
    const clientId = this.client()?.id;
    if (!clientId) return list;
    return list.filter((r) => r.clientId === clientId);
  });
  readonly requestsLoading = computed(() => this.requestsData.isLoading());
  readonly activitiesLoading = computed(() => this.activitiesData.isLoading());
  readonly commentsLoading = computed(() => this.commentsData.isLoading());
  readonly tagsLoading = computed(() => this.entityTagsData.isLoading());

  readonly activeTab = signal<ClientTab>('overview');
  readonly tagsSaveLoading = signal(false);

  readonly activityItems = computed<ActivityTimelineItem[]>(() => {
    const items = this.activitiesData.value() ?? [];
    const c = this.client();
    const list: ActivityTimelineItem[] = items.map((a) => ({
      id: a.id,
      label: a.type.replace(/_/g, ' '),
      date: a.createdAt,
      type: a.type === 'note' ? 'updated' : 'default',
    }));
    if (c?.createdAt) {
      list.push({
        label: 'Client created',
        date: c.createdAt,
        type: 'created',
      });
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  readonly clientComments = computed<CommentItem[]>(() => {
    const items = this.commentsData.value() ?? [];
    return items.map((c) => ({
      id: c.id,
      author: '—',
      text: c.body,
      createdAt: c.createdAt,
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

  setTab(tab: ClientTab): void {
    this.activeTab.set(tab);
  }

  createRequest(): void {
    const c = this.client();
    if (!c) return;
    this.router.navigate(['/app/requests/new'], {
      queryParams: { clientId: c.id },
    });
  }

  onTagsChange(tags: string[]): void {
    const c = this.client();
    if (!c || this.tagsSaveLoading()) return;
    const current = this.clientTags();
    const added = tags.filter((n) => !current.includes(n));
    const removed = current.filter((n) => !tags.includes(n));
    const entityTags = this.entityTags();
    if (added.length === 0 && removed.length === 0) return;

    this.tagsSaveLoading.set(true);
    const done = (): void => {
      this.tagsVersion.update((v) => v + 1);
      this.tagsSaveLoading.set(false);
    };

    let pending = added.length + removed.length;
    const checkDone = (): void => {
      pending -= 1;
      if (pending === 0) done();
    };

    for (const name of added) {
      this.tagsService
        .create({ name })
        .pipe(
          switchMap((tag) =>
            this.tagsService.attach(tag.id, {
              entityType: EntityType.Client,
              entityId: c.id,
            })
          )
        )
        .subscribe({
          next: checkDone,
          error: () => {
            this.toast.showError('Failed to add tag');
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
          this.toast.showError('Failed to remove tag');
          checkDone();
        },
      });
    }
    if (pending === 0) this.tagsSaveLoading.set(false);
  }

  onAddComment(event: { text: string }): void {
    const c = this.client();
    if (!c || !event.text.trim()) return;
    this.commentsService
      .create({
        commentableType: EntityType.Client,
        commentableId: c.id,
        body: event.text.trim(),
      })
      .subscribe({
        next: () => {
          this.commentsVersion.update((v) => v + 1);
        },
        error: (err) => {
          this.toast.showError(err.error?.message ?? err.message ?? 'Failed to add comment');
        },
      });
  }

  goToRequest(req: RequestResponseDto): void {
    this.router.navigate(['/app/requests', req.id]);
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  formatDateShort(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }
}
