import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
  let service: TimelineService;
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const noopErrorHandler = { catch: () => (source: unknown) => source };

  beforeEach(() => {
    httpClient = {
      get: vi.fn(() => of([])),
      post: vi.fn(() => of({ id: 'c-1', type: 'comment', body: 'hi' })),
      put: vi.fn(() => of({ id: 'c-1', type: 'comment', body: 'updated' })),
      delete: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        TimelineService,
        { provide: HttpClient, useValue: httpClient },
        { provide: ApiErrorHandlerService, useValue: noopErrorHandler },
      ],
    });

    service = TestBed.inject(TimelineService);
  });

  describe('getTimeline', () => {
    it('calls GET /api/{entity}/{id}/timeline', () => {
      service.getTimeline('leads', 'lead-1').subscribe();

      const [url] = httpClient.get.mock.calls[0] as [string, unknown];

      expect(url).toContain('/api/leads/lead-1/timeline');
    });

    it('sends size query param when provided', () => {
      service.getTimeline('leads', 'lead-1', { size: 20 }).subscribe();

      const [, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

      expect(options.params.get('size')).toBe('20');
    });

    it('sends before query param when provided', () => {
      service.getTimeline('leads', 'lead-1', { before: '2025-01-01T00:00:00Z' }).subscribe();

      const [, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

      expect(options.params.get('before')).toBe('2025-01-01T00:00:00Z');
    });

    it('omits size and before params when not provided', () => {
      service.getTimeline('bookings', 'b-1').subscribe();

      const [, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

      expect(options.params.get('size')).toBeNull();
      expect(options.params.get('before')).toBeNull();
    });

    it('works for offers entity', () => {
      service.getTimeline('offers', 'o-42').subscribe();

      const [url] = httpClient.get.mock.calls[0] as [string, unknown];

      expect(url).toContain('/api/offers/o-42/timeline');
    });
  });

  describe('addComment', () => {
    it('calls POST /api/{entity}/{id}/comments with body', () => {
      service.addComment('leads', 'lead-1', 'Hello').subscribe();

      const [url, body] = httpClient.post.mock.calls[0] as [string, { body: string }];

      expect(url).toContain('/api/leads/lead-1/comments');
      expect(body).toEqual({ body: 'Hello' });
    });
  });

  describe('editComment', () => {
    it('calls PUT /api/{entity}/{entityId}/comments/{commentId} with body', () => {
      service.editComment('leads', 'lead-1', 'c-99', 'Updated text').subscribe();

      const [url, body] = httpClient.put.mock.calls[0] as [string, { body: string }];

      expect(url).toContain('/api/leads/lead-1/comments/c-99');
      expect(body).toEqual({ body: 'Updated text' });
    });
  });

  describe('deleteComment', () => {
    it('calls DELETE /api/{entity}/{entityId}/comments/{commentId}', () => {
      service.deleteComment('bookings', 'b-7', 'c-3').subscribe();

      const [url] = httpClient.delete.mock.calls[0] as [string];

      expect(url).toContain('/api/bookings/b-7/comments/c-3');
    });
  });
});
