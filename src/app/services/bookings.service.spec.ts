import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { environment } from '@environments/environment';

import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClient = {
      get: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 20 })),
      post: vi.fn(() => of({ id: 'doc-1' })),
      put: vi.fn(() => of({ id: 'booking-1' })),
      delete: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        BookingsService,
        {
          provide: HttpClient,
          useValue: httpClient,
        },
      ],
    });

    service = TestBed.inject(BookingsService);
  });

  it('serializes status filter as repeated query params', () => {
    service.getList({ status: ['CONFIRMED', 'CANCELLED'] }).subscribe();

    const [, options] = httpClient.get.mock.calls[0] as [string, { params: HttpParams }];

    expect(options.params.getAll('status')).toEqual(['CONFIRMED', 'CANCELLED']);
  });

  it('uploads booking document using multipart form data', () => {
    const file = new File(['test'], 'voucher.pdf', { type: 'application/pdf' });

    service.uploadDocument('booking-1', file).subscribe();

    const [url, body] = httpClient.post.mock.calls[0] as [string, FormData];

    expect(url).toBe(`${environment.baseUrl}/api/bookings/booking-1/documents`);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
  });

  it('calls booking documents endpoints with expected URLs', () => {
    service.listDocuments('booking-1').subscribe();
    service.deleteDocument('booking-1', 'doc-1').subscribe();

    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.baseUrl}/api/bookings/booking-1/documents`,
    );
    expect(httpClient.delete).toHaveBeenCalledWith(
      `${environment.baseUrl}/api/bookings/booking-1/documents/doc-1`,
    );
  });

  it('calls booking invoices endpoint with expected URL', () => {
    service.listInvoices('booking-1').subscribe();

    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.baseUrl}/api/bookings/booking-1/invoices`,
    );
  });
});
