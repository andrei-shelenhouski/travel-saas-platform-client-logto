import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { PermissionService } from '@app/services/permission.service';
import { TimelineService } from '@app/services/timeline.service';

import {
  avatarColor,
  formatAbsoluteTime,
  formatRelativeTime,
  getInitials,
  getSystemEventIcon,
  getSystemEventLabel,
  HistoryPanelComponent,
} from './history-panel';

import type { TimelineItemResponse } from '@app/shared/models';

const MOCK_COMMENT: TimelineItemResponse = {
  id: 'c-1',
  type: 'comment',
  body: 'Test comment',
  author: { id: 'u-1', fullName: 'Иван Петров' },
  createdAt: new Date().toISOString(),
};

const MOCK_EVENT: TimelineItemResponse = {
  id: 'e-1',
  type: 'system_event',
  action: 'lead_created',
  actor: { id: 'u-2', fullName: 'Мария Сидорова' },
  createdAt: new Date().toISOString(),
};

describe('getSystemEventLabel', () => {
  it('returns Russian label for lead_created', () => {
    expect(getSystemEventLabel('lead_created', {})).toBe('Заявка создана');
  });

  it('interpolates status_changed details', () => {
    expect(getSystemEventLabel('status_changed', { from: 'NEW', to: 'IN_PROGRESS' })).toBe(
      'Статус: Новый → В работе',
    );
  });

  it('interpolates agent_assigned details', () => {
    expect(getSystemEventLabel('agent_assigned', { agentName: 'Иван Петров' })).toBe(
      'Менеджер назначен: Иван Петров',
    );
  });

  it('interpolates offer_created details', () => {
    expect(getSystemEventLabel('offer_created', { offerNumber: 'OF-42' })).toBe(
      'Предложение OF-42 создано',
    );
  });

  it('interpolates payment_recorded details', () => {
    expect(
      getSystemEventLabel('payment_recorded', {
        amount: 1000,
        currency: 'USD',
        paymentMethod: 'CASH',
      }),
    ).toBe('Оплата записана: 1000 USD (Наличные)');
  });

  it('returns action key as-is for unknown action', () => {
    expect(getSystemEventLabel('some_unknown_action', {})).toBe('some_unknown_action');
  });

  it('returns empty string when action is undefined', () => {
    expect(getSystemEventLabel(undefined, {})).toBe('');
  });

  it('returns generic label for lead_ingested without source', () => {
    expect(getSystemEventLabel('lead_ingested', {})).toBe('Заявка получена');
  });

  it('interpolates lead_ingested with source', () => {
    expect(getSystemEventLabel('lead_ingested', { source: 'website' })).toBe(
      'Заявка получена из website',
    );
  });

  it('interpolates contact_person_selected with name', () => {
    expect(getSystemEventLabel('contact_person_selected', { contactName: 'Анна' })).toBe(
      'Контактное лицо: Анна',
    );
  });

  it('returns generic label for contact_person_selected without name', () => {
    expect(getSystemEventLabel('contact_person_selected', {})).toBe('Контактное лицо выбрано');
  });

  it('interpolates offer_revised details', () => {
    expect(
      getSystemEventLabel('offer_revised', {
        offerNumber: 'OF-1',
        previousVersion: '1',
        newVersion: '2',
      }),
    ).toBe('Предложение OF-1: версия 1 → 2');
  });

  it('interpolates booking_created details', () => {
    expect(getSystemEventLabel('booking_created', { bookingNumber: 'BK-7' })).toBe(
      'Бронирование BK-7 создано',
    );
  });

  it('interpolates invoice_created details', () => {
    expect(getSystemEventLabel('invoice_created', { invoiceNumber: 'INV-3' })).toBe(
      'Счёт INV-3 создан',
    );
  });

  it('interpolates document_uploaded details', () => {
    expect(getSystemEventLabel('document_uploaded', { filename: 'passport.pdf' })).toBe(
      'Документ загружен: passport.pdf',
    );
  });

  it('interpolates backoffice_assigned with backofficeName', () => {
    expect(getSystemEventLabel('backoffice_assigned', { backofficeName: 'Оля' })).toBe(
      'Менеджер бэк-офиса: Оля',
    );
  });

  it('returns generic label for backoffice_assigned without name', () => {
    expect(getSystemEventLabel('backoffice_assigned', {})).toBe('Менеджер бэк-офиса назначен');
  });

  it('interpolates confirmation_number_set with number', () => {
    expect(getSystemEventLabel('confirmation_number_set', { confirmationNumber: 'ABC123' })).toBe(
      'Номер подтверждения: ABC123',
    );
  });

  it('returns generic label for confirmation_number_set without number', () => {
    expect(getSystemEventLabel('confirmation_number_set', {})).toBe(
      'Номер подтверждения установлен',
    );
  });

  it('returns request_created label', () => {
    expect(getSystemEventLabel('request_created', {})).toBe('Запрос на тур добавлен');
  });
});

describe('getSystemEventIcon', () => {
  it('returns add_circle for creational actions', () => {
    expect(getSystemEventIcon('lead_created')).toBe('add_circle');
    expect(getSystemEventIcon('offer_created')).toBe('add_circle');
    expect(getSystemEventIcon('booking_created')).toBe('add_circle');
    expect(getSystemEventIcon('invoice_created')).toBe('add_circle');
    expect(getSystemEventIcon('document_uploaded')).toBe('add_circle');
    expect(getSystemEventIcon('request_created')).toBe('add_circle');
  });

  it('returns flag for status_changed', () => {
    expect(getSystemEventIcon('status_changed')).toBe('flag');
  });

  it('returns person_add for agent_assigned', () => {
    expect(getSystemEventIcon('agent_assigned')).toBe('person_add');
  });

  it('returns person for client_linked', () => {
    expect(getSystemEventIcon('client_linked')).toBe('person');
  });

  it('returns edit_note for offer_revised', () => {
    expect(getSystemEventIcon('offer_revised')).toBe('edit_note');
  });

  it('returns payments for payment_recorded', () => {
    expect(getSystemEventIcon('payment_recorded')).toBe('payments');
  });

  it('returns history for unknown and undefined actions', () => {
    expect(getSystemEventIcon('whatever')).toBe('history');
    expect(getSystemEventIcon(undefined)).toBe('history');
  });

  it('returns add_circle for lead_ingested', () => {
    expect(getSystemEventIcon('lead_ingested')).toBe('add_circle');
  });

  it('returns person_add for backoffice_assigned', () => {
    expect(getSystemEventIcon('backoffice_assigned')).toBe('person_add');
  });

  it('returns tag for confirmation_number_set', () => {
    expect(getSystemEventIcon('confirmation_number_set')).toBe('tag');
  });

  it('returns person for contact_person_selected', () => {
    expect(getSystemEventIcon('contact_person_selected')).toBe('person');
  });
});

describe('getInitials', () => {
  it('returns two capital letters for two-word name', () => {
    expect(getInitials('Иван Петров')).toBe('ИП');
  });

  it('returns single letter for single-word name', () => {
    expect(getInitials('Иван')).toBe('И');
  });

  it('returns ? for empty name', () => {
    expect(getInitials('')).toBe('?');
  });

  it('uses only first two words for multi-word names', () => {
    expect(getInitials('Иван Иванович Петров')).toBe('ИИ');
  });
});

describe('avatarColor', () => {
  it('returns a hex color string', () => {
    expect(avatarColor('some-id')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('is deterministic for the same id', () => {
    expect(avatarColor('abc')).toBe(avatarColor('abc'));
  });

  it('produces variety across different ids', () => {
    const colors = new Set(['id-1', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6'].map(avatarColor));

    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('formatRelativeTime', () => {
  it('returns "только что" for timestamps within 1 minute', () => {
    const now = new Date().toISOString();

    expect(formatRelativeTime(now)).toBe('только что');
  });

  it('returns minutes label for ~5 minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    expect(formatRelativeTime(fiveMinutesAgo)).toContain('мин.');
  });

  it('includes "вчера" for yesterday', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    expect(formatRelativeTime(yesterday)).toContain('вчера');
  });
});

describe('formatAbsoluteTime', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    expect(formatAbsoluteTime('2025-01-15T10:30:00.000Z').length).toBeGreaterThan(0);
  });
});

type HistoryPanelInternals = {
  allItems: () => TimelineItemResponse[];
  filteredItems: () => TimelineItemResponse[];
  activeFilter: () => string;
  submitting: () => boolean;
  editingCommentId: () => string | null;
  editBody: () => string;
  editSaving: () => boolean;
  deletingCommentId: () => string | null;
  deletingInProgress: () => boolean;
  composeSubmitDisabled: () => boolean;
  composeControl: { value: string; setValue: (v: string) => void };
  setFilter: (filter: 'all' | 'comments' | 'events') => void;
  submitComment: (event?: KeyboardEvent) => void;
  startEdit: (item: TimelineItemResponse) => void;
  cancelEdit: () => void;
  saveEdit: (commentId: string) => void;
  startDelete: (commentId: string) => void;
  cancelDelete: () => void;
  confirmDelete: (commentId: string) => void;
  canEditOrDelete: (item: TimelineItemResponse) => boolean;
};

function makeSetup(opts: {
  canModerateComments?: boolean;
  currentUserId?: string | null;
  timelineServiceOverrides?: Partial<{
    getTimeline: ReturnType<typeof vi.fn>;
    addComment: ReturnType<typeof vi.fn>;
    editComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  }>;
}) {
  const svc = {
    getTimeline: vi.fn(() => of([MOCK_COMMENT, MOCK_EVENT])),
    addComment: vi.fn(() => of({ ...MOCK_COMMENT, id: 'c-new' })),
    editComment: vi.fn(() => of({ ...MOCK_COMMENT, body: 'Edited' })),
    deleteComment: vi.fn(() => of(undefined)),
    ...opts.timelineServiceOverrides,
  };
  const snackBar = { open: vi.fn() };

  return {
    svc,
    snackBar,
    canModerateComments: opts.canModerateComments ?? false,
    currentUserId: opts.currentUserId ?? 'u-1',
  };
}

describe('HistoryPanelComponent', () => {
  let fixture: ComponentFixture<HistoryPanelComponent>;
  let component: HistoryPanelComponent;
  let internals: HistoryPanelInternals;
  let timelineService: { getTimeline: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    timelineService = {
      getTimeline: vi.fn(() => of([MOCK_COMMENT, MOCK_EVENT])),
    };

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: timelineService },
        { provide: PermissionService, useValue: { canModerateComments: signal(true) } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPanelComponent);
    component = fixture.componentInstance;
    internals = component as unknown as HistoryPanelInternals;
    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', 'u-1');
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getTimeline with correct entity and id', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(timelineService.getTimeline).toHaveBeenCalledWith('leads', 'lead-1', { size: 50 });
  });

  it('loads items into allItems after stable', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(internals.allItems().length).toBe(2);
  });

  it('shows all items with "all" filter by default', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(internals.filteredItems().length).toBe(2);
  });

  it('filters to comments only when filter set to "comments"', async () => {
    await fixture.whenStable();
    internals.setFilter('comments');
    fixture.detectChanges();

    const comments = internals.filteredItems();

    expect(comments.every((i) => i.type === 'comment')).toBe(true);
    expect(comments.length).toBe(1);
  });

  it('filters to system events only when filter set to "events"', async () => {
    await fixture.whenStable();
    internals.setFilter('events');
    fixture.detectChanges();

    const events = internals.filteredItems();

    expect(events.every((i) => i.type === 'system_event')).toBe(true);
    expect(events.length).toBe(1);
  });
});

describe('HistoryPanelComponent — composeSubmitDisabled', () => {
  async function build(
    svcOverrides: Parameters<typeof makeSetup>[0]['timelineServiceOverrides'] = {},
  ) {
    const { svc, snackBar } = makeSetup({ timelineServiceOverrides: svcOverrides });

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: svc },
        { provide: PermissionService, useValue: { canModerateComments: signal(false) } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPanelComponent);
    const internals = fixture.componentInstance as unknown as HistoryPanelInternals;

    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', 'u-1');
    fixture.detectChanges();
    await fixture.whenStable();

    return { fixture, internals, svc, snackBar };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('is disabled when compose is empty', async () => {
    const { internals } = await build();

    internals.composeControl.setValue('');

    expect(internals.composeSubmitDisabled()).toBe(true);
  });

  it('is disabled when compose is only whitespace', async () => {
    const { internals } = await build();

    internals.composeControl.setValue('   ');

    expect(internals.composeSubmitDisabled()).toBe(true);
  });

  it('is enabled when compose has valid text', async () => {
    const { internals } = await build();

    internals.composeControl.setValue('Hello');

    expect(internals.composeSubmitDisabled()).toBe(false);
  });

  it('is disabled when text exceeds 2000 chars', async () => {
    const { internals } = await build();

    internals.composeControl.setValue('x'.repeat(2001));

    expect(internals.composeSubmitDisabled()).toBe(true);
  });
});

describe('HistoryPanelComponent — submitComment', () => {
  let fixture: ComponentFixture<HistoryPanelComponent>;
  let internals: HistoryPanelInternals;
  let svc: ReturnType<typeof makeSetup>['svc'];
  let snackBar: ReturnType<typeof makeSetup>['snackBar'];

  beforeEach(async () => {
    ({ svc, snackBar } = makeSetup({}));

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: svc },
        { provide: PermissionService, useValue: { canModerateComments: signal(false) } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPanelComponent);
    internals = fixture.componentInstance as unknown as HistoryPanelInternals;
    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', 'u-1');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('calls addComment and reloads timeline on success', () => {
    internals.composeControl.setValue('My note');
    internals.submitComment();

    expect(svc.addComment).toHaveBeenCalledWith('leads', 'lead-1', 'My note');
    // After success the control should be reset
    expect(internals.composeControl.value).toBe('');
  });

  it('does nothing when compose is empty', () => {
    internals.composeControl.setValue('');
    internals.submitComment();

    expect(svc.addComment).not.toHaveBeenCalled();
  });

  it('shows snackbar on addComment error', () => {
    svc.addComment = vi.fn(() => throwError(() => new Error('Network error')));
    internals.composeControl.setValue('My note');
    internals.submitComment();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Не удалось добавить заметку',
      'Закрыть',
      expect.objectContaining({ duration: 4000 }),
    );
  });

  it('ignores keyboard event unless Ctrl+Enter', () => {
    internals.composeControl.setValue('Hello');
    const enterOnly = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: false });

    internals.submitComment(enterOnly);

    expect(svc.addComment).not.toHaveBeenCalled();
  });

  it('submits on Ctrl+Enter keyboard event', () => {
    internals.composeControl.setValue('Hello');
    const ctrlEnter = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });

    internals.submitComment(ctrlEnter);

    expect(svc.addComment).toHaveBeenCalled();
  });
});

describe('HistoryPanelComponent — edit comment', () => {
  let fixture: ComponentFixture<HistoryPanelComponent>;
  let internals: HistoryPanelInternals;
  let svc: ReturnType<typeof makeSetup>['svc'];
  let snackBar: ReturnType<typeof makeSetup>['snackBar'];

  beforeEach(async () => {
    ({ svc, snackBar } = makeSetup({}));

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: svc },
        { provide: PermissionService, useValue: { canModerateComments: signal(false) } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPanelComponent);
    internals = fixture.componentInstance as unknown as HistoryPanelInternals;
    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', 'u-1');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('startEdit sets editingCommentId and editBody', () => {
    internals.startEdit(MOCK_COMMENT);

    expect(internals.editingCommentId()).toBe('c-1');
    expect(internals.editBody()).toBe('Test comment');
  });

  it('cancelEdit clears edit state', () => {
    internals.startEdit(MOCK_COMMENT);
    internals.cancelEdit();

    expect(internals.editingCommentId()).toBeNull();
    expect(internals.editBody()).toBe('');
  });

  it('saveEdit calls editComment and updates item in allItems', () => {
    const updated: TimelineItemResponse = { ...MOCK_COMMENT, body: 'Edited' };

    svc.editComment = vi.fn(() => of(updated));
    internals.startEdit(MOCK_COMMENT);
    internals.saveEdit('c-1');

    expect(svc.editComment).toHaveBeenCalledWith('leads', 'lead-1', 'c-1', 'Test comment');
    const found = internals.allItems().find((i) => i.id === 'c-1');

    expect(found?.body).toBe('Edited');
    expect(internals.editingCommentId()).toBeNull();
  });

  it('saveEdit shows snackbar on error', () => {
    svc.editComment = vi.fn(() => throwError(() => new Error()));
    internals.startEdit(MOCK_COMMENT);
    internals.saveEdit('c-1');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Не удалось сохранить заметку',
      'Закрыть',
      expect.objectContaining({ duration: 4000 }),
    );
  });

  it('saveEdit does nothing when editBody is empty', () => {
    internals.startEdit({ ...MOCK_COMMENT, body: '' });
    internals.saveEdit('c-1');

    expect(svc.editComment).not.toHaveBeenCalled();
  });
});

describe('HistoryPanelComponent — delete comment', () => {
  let fixture: ComponentFixture<HistoryPanelComponent>;
  let internals: HistoryPanelInternals;
  let svc: ReturnType<typeof makeSetup>['svc'];
  let snackBar: ReturnType<typeof makeSetup>['snackBar'];

  beforeEach(async () => {
    ({ svc, snackBar } = makeSetup({}));

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: svc },
        { provide: PermissionService, useValue: { canModerateComments: signal(false) } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPanelComponent);
    internals = fixture.componentInstance as unknown as HistoryPanelInternals;
    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', 'u-1');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('startDelete sets deletingCommentId', () => {
    internals.startDelete('c-1');

    expect(internals.deletingCommentId()).toBe('c-1');
  });

  it('cancelDelete clears deletingCommentId', () => {
    internals.startDelete('c-1');
    internals.cancelDelete();

    expect(internals.deletingCommentId()).toBeNull();
  });

  it('confirmDelete removes item from allItems on success', () => {
    internals.confirmDelete('c-1');

    expect(svc.deleteComment).toHaveBeenCalledWith('leads', 'lead-1', 'c-1');
    expect(internals.allItems().find((i) => i.id === 'c-1')).toBeUndefined();
    expect(internals.deletingCommentId()).toBeNull();
  });

  it('confirmDelete shows snackbar on error', () => {
    svc.deleteComment = vi.fn(() => throwError(() => new Error()));
    internals.confirmDelete('c-1');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Не удалось удалить заметку',
      'Закрыть',
      expect.objectContaining({ duration: 4000 }),
    );
  });
});

describe('HistoryPanelComponent — canEditOrDelete', () => {
  async function buildWithPermission(canModerate: boolean, currentUserId: string | null) {
    const svc = {
      getTimeline: vi.fn(() => of([MOCK_COMMENT, MOCK_EVENT])),
      addComment: vi.fn(() => of(MOCK_COMMENT)),
      editComment: vi.fn(() => of(MOCK_COMMENT)),
      deleteComment: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: TimelineService, useValue: svc },
        {
          provide: PermissionService,
          useValue: { canModerateComments: signal(canModerate) },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoryPanelComponent);
    const internals = fixture.componentInstance as unknown as HistoryPanelInternals;

    fixture.componentRef.setInput('entity', 'leads');
    fixture.componentRef.setInput('entityId', 'lead-1');
    fixture.componentRef.setInput('currentUserId', currentUserId);
    fixture.detectChanges();
    await fixture.whenStable();

    return internals;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('returns false for system_event items', async () => {
    const internals = await buildWithPermission(true, 'u-1');

    expect(internals.canEditOrDelete(MOCK_EVENT)).toBe(false);
  });

  it('returns true when currentUserId matches comment author', async () => {
    const internals = await buildWithPermission(false, 'u-1');

    expect(internals.canEditOrDelete(MOCK_COMMENT)).toBe(true);
  });

  it('returns false when currentUserId does not match and user cannot moderate', async () => {
    const internals = await buildWithPermission(false, 'u-99');

    expect(internals.canEditOrDelete(MOCK_COMMENT)).toBe(false);
  });

  it('returns true when user can moderate even if not the author', async () => {
    const internals = await buildWithPermission(true, 'u-99');

    expect(internals.canEditOrDelete(MOCK_COMMENT)).toBe(true);
  });

  it('returns false when currentUserId is null and user cannot moderate', async () => {
    const internals = await buildWithPermission(false, null);

    expect(internals.canEditOrDelete(MOCK_COMMENT)).toBe(false);
  });
});
