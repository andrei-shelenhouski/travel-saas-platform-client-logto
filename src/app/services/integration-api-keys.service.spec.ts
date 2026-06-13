import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { ApiErrorHandlerService } from '@app/shared/services/api-error-handler.service';

import { IntegrationApiKeysService } from './integration-api-keys.service';

const API_URL = 'http://localhost:8080/api/settings/integrations/api-keys';

describe('IntegrationApiKeysService', () => {
  let service: IntegrationApiKeysService;
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClient = {
      get: vi.fn(() => of([])),
      post: vi.fn(() => of({ id: 'key-1', rawKey: 'raw-abc123' })),
      put: vi.fn(() => of({ id: 'key-1', name: 'Updated' })),
      delete: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        IntegrationApiKeysService,
        { provide: HttpClient, useValue: httpClient },
        { provide: ApiErrorHandlerService, useValue: { catch: () => (source: unknown) => source } },
      ],
    });

    service = TestBed.inject(IntegrationApiKeysService);
  });

  it('list() calls GET /api/settings/integrations/api-keys', () => {
    service.list().subscribe();
    expect(httpClient.get).toHaveBeenCalledWith(API_URL);
  });

  it('create() calls POST with dto', () => {
    service.create({ name: 'My Key' }).subscribe();
    expect(httpClient.post).toHaveBeenCalledWith(API_URL, { name: 'My Key' });
  });

  it('update() calls PUT with id and dto', () => {
    service.update('key-1', { name: 'Renamed' }).subscribe();
    expect(httpClient.put).toHaveBeenCalledWith(`${API_URL}/key-1`, { name: 'Renamed' });
  });

  it('revoke() calls DELETE with id', () => {
    service.revoke('key-1').subscribe();
    expect(httpClient.delete).toHaveBeenCalledWith(`${API_URL}/key-1`);
  });
});
