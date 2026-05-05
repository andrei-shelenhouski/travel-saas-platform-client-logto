import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClient = {
      get: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 20 })),
      post: vi.fn(() => of({ id: 'lead-1' })),
      put: vi.fn(() => of({ id: 'lead-1' })),
      patch: vi.fn(() => of({ id: 'lead-1' })),
      delete: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        LeadsService,
        {
          provide: HttpClient,
          useValue: httpClient,
        },
      ],
    });

    service = TestBed.inject(LeadsService);
  });

  it('serializes status filter as repeated query params', () => {
    service.findAll({ status: ['NEW', 'ASSIGNED'] }).subscribe();

    const [, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

    expect(options.params.getAll('status')).toEqual(['NEW', 'ASSIGNED']);
  });

  it('calls GET /api/leads/{id}/activity with page param', () => {
    const leadId = 'lead-123';
    const page = 2;

    service.getActivity(leadId, { page }).subscribe();

    const [url, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

    expect(url).toContain(`/api/leads/${leadId}/activity`);
    expect(options.params.get('page')).toBe(String(page));
  });
});
