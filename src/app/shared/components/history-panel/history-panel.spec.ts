import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { TimelineService } from '@app/services/timeline.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
      'Статус: NEW → IN_PROGRESS',
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
      getSystemEventLabel('payment_recorded', { amount: 1000, currency: 'USD', method: 'cash' }),
    ).toBe('Оплата записана: 1000 USD (cash)');
  });

  it('returns action key as-is for unknown action', () => {
    expect(getSystemEventLabel('some_unknown_action', {})).toBe('some_unknown_action');
  });

  it('returns empty string when action is undefined', () => {
    expect(getSystemEventLabel(undefined, {})).toBe('');
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

describe('HistoryPanelComponent', () => {
  let fixture: ComponentFixture<HistoryPanelComponent>;
  let component: HistoryPanelComponent;
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
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryPanelComponent);
    component = fixture.componentInstance;
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

    expect(component.allItems().length).toBe(2);
  });

  it('shows all items with "all" filter by default', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredItems().length).toBe(2);
  });

  it('filters to comments only when filter set to "comments"', async () => {
    await fixture.whenStable();
    component.setFilter('comments');
    fixture.detectChanges();

    const comments = component.filteredItems();

    expect(comments.every((i) => i.type === 'comment')).toBe(true);
    expect(comments.length).toBe(1);
  });

  it('filters to system events only when filter set to "events"', async () => {
    await fixture.whenStable();
    component.setFilter('events');
    fixture.detectChanges();

    const events = component.filteredItems();

    expect(events.every((i) => i.type === 'system_event')).toBe(true);
    expect(events.length).toBe(1);
  });
});
