import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CreateOfferComponent } from './create-offer';

import { OffersService } from '@app/services/offers.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { RequestsService } from '@app/services/requests.service';
import { ToastService } from '@app/shared/services/toast.service';

import type { RequestResponseDto } from '@app/shared/models';

describe('CreateOfferComponent', () => {
  let fixture: ComponentFixture<CreateOfferComponent>;

  const requestsServiceMock = {
    getById: vi.fn(() => of(createRequest())),
    update: vi.fn(),
  };

  const organizationSettingsServiceMock = {
    get: vi.fn(() =>
      of({
        defaultCurrency: 'EUR',
        offerValidityDays: 14,
      }),
    ),
  };

  const offersServiceMock = {
    create: vi.fn(() => of({ id: 'offer-1', number: 'OF-1' })),
    update: vi.fn(() => of({ id: 'offer-1', number: 'OF-1' })),
  };

  const matDialogMock = {
    open: vi.fn(),
  };

  const toastServiceMock = {
    showError: vi.fn(),
    showSuccess: vi.fn(),
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('pre-fills travel details and renders request banner when requestId exists', async () => {
    await setup('request-1');

    expect(requestsServiceMock.getById).toHaveBeenCalledWith('request-1');
    expect(fixture.componentInstance.form.controls.destination.value).toBe('Turkey');
    expect(fixture.componentInstance.form.controls.departDate.value).toBe('2026-08-10');
    expect(fixture.componentInstance.form.controls.returnDate.value).toBe('2026-08-17');
    expect(fixture.componentInstance.form.controls.adults.value).toBe(2);
    expect(fixture.componentInstance.form.controls.children.value).toBe(1);
    expect(fixture.componentInstance.form.controls.departureCity.value).toBe('');

    const text = fixture.nativeElement.textContent as string;
    const requestLink = fixture.nativeElement.querySelector('a[href="/app/requests/request-1"]');

    expect(text).toContain('Pre-filled from trip request TR-1');
    expect(requestLink?.textContent).toContain('View request');
  });

  it('shows empty travel details and does not fetch request when requestId is absent', async () => {
    await setup(null);

    expect(requestsServiceMock.getById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.requestLoading()).toBe(false);

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Pre-filled from trip request');
    expect(fixture.componentInstance.form.controls.destination.value).toBe('');
    expect(fixture.componentInstance.form.controls.departDate.value).toBe('');
    expect(fixture.componentInstance.form.controls.returnDate.value).toBe('');
  });

  it('shows inline warning and allows manual entry when request does not exist', async () => {
    requestsServiceMock.getById.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    await setup('request-missing');

    expect(fixture.componentInstance.requestLoading()).toBe(false);
    expect(fixture.componentInstance.requestPrefillWarning()).toContain('Trip request was not found');
    expect(fixture.componentInstance.error()).toBe('');

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Trip request was not found');
    expect(fixture.componentInstance.form.controls.destination.value).toBe('');
    expect(fixture.componentInstance.form.controls.departureCity.value).toBe('');
  });

  async function setup(requestId: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CreateOfferComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(requestId ? { requestId } : {}),
            },
          },
        },
        { provide: RequestsService, useValue: requestsServiceMock },
        { provide: OrganizationSettingsService, useValue: organizationSettingsServiceMock },
        { provide: OffersService, useValue: offersServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: MatDialog, useValue: matDialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOfferComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function createRequest(overrides: Partial<RequestResponseDto> = {}): RequestResponseDto {
  return {
    id: 'request-1',
    leadId: 'lead-1',
    managerId: null,
    managerName: null,
    destination: 'Turkey',
    departDate: '2026-08-10',
    returnDate: '2026-08-17',
    adults: 2,
    children: 1,
    notes: null,
    status: 'OPEN',
    offersCount: 0,
    createdById: 'user-1',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}
