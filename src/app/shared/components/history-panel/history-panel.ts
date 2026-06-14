import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { of } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';
import { TimelineService } from '@app/services/timeline.service';

import type { TimelineEntity } from '@app/services/timeline.service';
import type { TimelineItemResponse } from '@app/shared/models';
export type HistoryFilter = 'all' | 'comments' | 'events';

const PAGE_SIZE = 50;
const MAX_COMMENT_LENGTH = 2000;

const AVATAR_COLORS = [
  '#0d9488', // teal-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#d97706', // amber-600
  '#16a34a', // green-600
  '#e11d48', // rose-600
  '#475569', // slate-600
  '#4f46e5', // indigo-600
];

function stableHash(str: string): number {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1_000_003;
  }

  return Math.abs(hash);
}

export function avatarColor(id: string): string {
  return AVATAR_COLORS[stableHash(id) % AVATAR_COLORS.length];
}

export function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

type LabelBuilder = (d: Record<string, unknown>) => string;

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  ASSIGNED: 'Назначен',
  IN_PROGRESS: 'В работе',
  OFFER_SENT: 'КП отправлено',
  WON: 'Выигран',
  LOST: 'Проигран',
  EXPIRED: 'Истёк',
  PENDING_CONFIRMATION: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  CANCELLED: 'Отменено',
  COMPLETED: 'Завершено',
};

function translateStatus(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '?';
  }

  return LEAD_STATUS_LABELS[raw] ?? raw;
}

function strVal(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Банковский перевод',
  CASH: 'Наличные',
  CARD: 'Карта',
  OTHER: 'Другое',
};

const SYSTEM_EVENT_LABEL_MAP: Record<string, LabelBuilder> = {
  lead_created: () => 'Заявка создана',

  lead_ingested: (d) => {
    const src = strVal(d['source']);

    return src ? `Заявка получена из ${src}` : 'Заявка получена';
  },

  status_changed: (d) => {
    const to = translateStatus(d['to']);
    const from = d['from'] ? translateStatus(d['from']) : null;

    return from ? `Статус: ${from} → ${to}` : `Статус установлен: ${to}`;
  },

  agent_assigned: (d) => `Менеджер назначен: ${strVal(d['agentName']) || '?'}`,

  client_linked: (d) => `Клиент привязан: ${strVal(d['clientName']) || '?'}`,

  contact_person_selected: (d) => {
    const name = strVal(d['contactName']);

    return name ? `Контактное лицо: ${name}` : 'Контактное лицо выбрано';
  },

  request_created: () => 'Запрос на тур добавлен',

  offer_created: (d) => `Предложение ${strVal(d['offerNumber'])} создано`,

  offer_revised: (d) =>
    `Предложение ${strVal(d['offerNumber'])}: версия ${strVal(d['previousVersion']) || '?'} → ${strVal(d['newVersion']) || '?'}`,

  booking_created: (d) => `Бронирование ${strVal(d['bookingNumber'])} создано`,

  backoffice_assigned: (d) => {
    const name = strVal(d['backofficeName']) || strVal(d['agentName']) || strVal(d['name']);

    return name ? `Менеджер бэк-офиса: ${name}` : 'Менеджер бэк-офиса назначен';
  },

  confirmation_number_set: (d) => {
    const num = strVal(d['confirmationNumber']) || strVal(d['number']) || strVal(d['value']);

    return num ? `Номер подтверждения: ${num}` : 'Номер подтверждения установлен';
  },

  document_uploaded: (d) => `Документ загружен: ${strVal(d['filename']) || '?'}`,

  invoice_created: (d) => `Счёт ${strVal(d['invoiceNumber'])} создан`,

  payment_recorded: (d) => {
    const amount = d['amount'] !== null && d['amount'] !== undefined ? String(d['amount']) : '?';
    const currency = strVal(d['currency']);
    const rawMethod = strVal(d['paymentMethod']);
    const method = (PAYMENT_METHOD_LABELS[rawMethod] ?? rawMethod) || '?';

    return `Оплата записана: ${amount} ${currency} (${method})`;
  },
};

export function getSystemEventLabel(
  action: string | undefined,
  details: Record<string, unknown> | undefined,
): string {
  if (!action) {
    return '';
  }

  const builder = SYSTEM_EVENT_LABEL_MAP[action];

  return builder ? builder(details ?? {}) : action;
}

export function getSystemEventIcon(action: string | undefined): string {
  switch (action) {
    case 'lead_created':
    case 'lead_ingested':
    case 'offer_created':
    case 'booking_created':
    case 'invoice_created':
    case 'request_created':
    case 'document_uploaded':
      return 'add_circle';
    case 'status_changed':
      return 'flag';
    case 'agent_assigned':
    case 'backoffice_assigned':
      return 'person_add';
    case 'confirmation_number_set':
      return 'tag';
    case 'client_linked':
    case 'contact_person_selected':
      return 'person';
    case 'offer_revised':
      return 'edit_note';
    case 'payment_recorded':
      return 'payments';
    default:
      return 'history';
  }
}

export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'только что';
  }

  if (diffMin < 60) {
    return `${diffMin} мин. назад`;
  }

  const timeStr = new Date(isoDate).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffHour < 24) {
    return `сегодня ${timeStr}`;
  }

  if (diffDay === 1) {
    return `вчера ${timeStr}`;
  }

  if (diffDay < 7) {
    return `${diffDay} дня назад`;
  }

  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatAbsoluteTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-history-panel',
  imports: [
    CdkTextareaAutosize,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
  templateUrl: './history-panel.html',
  styleUrl: './history-panel.scss',
})
export class HistoryPanelComponent {
  readonly entity = input.required<TimelineEntity>();
  readonly entityId = input.required<string>();
  readonly currentUserId = input.required<string | null>();

  private readonly timelineService = inject(TimelineService);
  private readonly permissionService = inject(PermissionService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  private readonly feedRef = viewChild<ElementRef<HTMLElement>>('historyFeed');

  protected readonly activeFilter = signal<HistoryFilter>('all');

  /** Cursor for "load more older entries" — oldest createdAt of loaded batch */
  private readonly beforeCursor = signal<string | undefined>(undefined);

  /** Accumulated items across pagination loads */
  protected readonly allItems = signal<TimelineItemResponse[]>([]);

  // Compose state
  protected readonly submitting = signal(false);
  protected readonly composeControl = this.fb.nonNullable.control('');
  private readonly composeValue = toSignal(this.composeControl.valueChanges, { initialValue: '' });

  // Edit state
  protected readonly editingCommentId = signal<string | null>(null);
  protected readonly editBody = signal('');
  protected readonly editSaving = signal(false);

  // Delete state
  protected readonly deletingCommentId = signal<string | null>(null);
  protected readonly deletingInProgress = signal(false);

  protected readonly canModerateComments = this.permissionService.canModerateComments;

  private readonly timelineData = rxResource<
    TimelineItemResponse[],
    { entity: TimelineEntity; entityId: string }
  >({
    params: () => ({ entity: this.entity(), entityId: this.entityId() }),
    stream: ({ params }) => {
      const { entity, entityId } = params;

      if (!entityId) {
        return of([]);
      }

      return this.timelineService.getTimeline(entity, entityId, { size: PAGE_SIZE });
    },
  });

  constructor() {
    // When fresh data loads (entity/id change), reset accumulated items
    effect(() => {
      const value = this.timelineData.value();

      if (value !== undefined) {
        this.allItems.set(value);
        this.beforeCursor.set(undefined);
      }
    });
  }

  protected readonly loading = computed(() => this.timelineData.isLoading());

  protected readonly filteredItems = computed(() => {
    const items = this.allItems();
    const filter = this.activeFilter();

    if (filter === 'comments') {
      return items.filter((i) => i.type === 'comment');
    }

    if (filter === 'events') {
      return items.filter((i) => i.type === 'system_event');
    }

    return items;
  });

  protected readonly canLoadMore = computed(() => this.allItems().length >= PAGE_SIZE);

  protected readonly loadingMore = signal(false);

  protected readonly composeCharCount = computed(() => this.composeValue().length);

  protected readonly composeSubmitDisabled = computed(
    () =>
      this.composeValue().trim().length === 0 ||
      this.composeCharCount() > MAX_COMMENT_LENGTH ||
      this.submitting(),
  );

  protected readonly maxCommentLength = MAX_COMMENT_LENGTH;

  protected setFilter(filter: HistoryFilter): void {
    this.activeFilter.set(filter);
  }

  protected loadMore(): void {
    const items = this.allItems();

    if (items.length === 0 || this.loadingMore()) {
      return;
    }

    const oldest = items.reduce((min, item) =>
      new Date(item.createdAt) < new Date(min.createdAt) ? item : min,
    );

    this.loadingMore.set(true);
    this.timelineService
      .getTimeline(this.entity(), this.entityId(), {
        size: PAGE_SIZE,
        before: oldest.createdAt,
      })
      .subscribe({
        next: (older) => {
          const merged = [...older, ...items];
          // Deduplicate by id, sort oldest-first for display
          const seen = new Set<string>();
          const unique = merged.filter((item) => {
            if (seen.has(item.id)) {
              return false;
            }

            seen.add(item.id);

            return true;
          });

          this.allItems.set(unique);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loadingMore.set(false);
        },
      });
  }

  protected submitComment(event?: KeyboardEvent): void {
    if (event) {
      if (!event.ctrlKey || event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
    }

    const body = this.composeControl.value.trim();

    if (!body || body.length > MAX_COMMENT_LENGTH || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.timelineService.addComment(this.entity(), this.entityId(), body).subscribe({
      next: () => {
        this.composeControl.reset('');
        this.submitting.set(false);
        this.timelineData.reload();
        this.scrollFeedToBottom();
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Не удалось добавить заметку', 'Закрыть', { duration: 4000 });
      },
    });
  }

  protected startEdit(item: TimelineItemResponse): void {
    this.editingCommentId.set(item.id);
    this.editBody.set(item.body ?? '');
    this.deletingCommentId.set(null);

    queueMicrotask(() => {
      const el = document.querySelector<HTMLTextAreaElement>(
        `.history-edit-textarea[data-id="${item.id}"]`,
      );

      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  protected cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editBody.set('');
  }

  protected saveEdit(commentId: string): void {
    const body = this.editBody().trim();

    if (!body || this.editSaving()) {
      return;
    }

    this.editSaving.set(true);
    this.timelineService.editComment(this.entity(), this.entityId(), commentId, body).subscribe({
      next: (updated) => {
        this.allItems.update((items) => items.map((i) => (i.id === commentId ? updated : i)));
        this.editingCommentId.set(null);
        this.editBody.set('');
        this.editSaving.set(false);
      },
      error: () => {
        this.editSaving.set(false);
        this.snackBar.open('Не удалось сохранить заметку', 'Закрыть', { duration: 4000 });
      },
    });
  }

  protected startDelete(commentId: string): void {
    this.deletingCommentId.set(commentId);
    this.editingCommentId.set(null);
  }

  protected cancelDelete(): void {
    this.deletingCommentId.set(null);
  }

  protected confirmDelete(commentId: string): void {
    if (this.deletingInProgress()) {
      return;
    }

    this.deletingInProgress.set(true);
    this.timelineService.deleteComment(this.entity(), this.entityId(), commentId).subscribe({
      next: () => {
        this.allItems.update((items) => items.filter((i) => i.id !== commentId));
        this.deletingCommentId.set(null);
        this.deletingInProgress.set(false);
      },
      error: () => {
        this.deletingInProgress.set(false);
        this.snackBar.open('Не удалось удалить заметку', 'Закрыть', { duration: 4000 });
      },
    });
  }

  protected canEditOrDelete(item: TimelineItemResponse): boolean {
    if (item.type === 'system_event') {
      return false;
    }

    const userId = this.currentUserId();

    return (userId !== null && item.author?.id === userId) || this.canModerateComments();
  }

  private scrollFeedToBottom(): void {
    const feed = this.feedRef();

    if (feed) {
      feed.nativeElement.scrollTop = feed.nativeElement.scrollHeight;
    }
  }

  // Exposed pure helpers for the template
  protected readonly getSystemEventLabel = getSystemEventLabel;
  protected readonly getSystemEventIcon = getSystemEventIcon;
  protected readonly formatRelativeTime = formatRelativeTime;
  protected readonly formatAbsoluteTime = formatAbsoluteTime;
  protected readonly avatarColor = avatarColor;
  protected readonly getInitials = getInitials;

  protected readonly pageSize = PAGE_SIZE;
}
