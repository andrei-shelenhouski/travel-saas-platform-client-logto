import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LeadsService } from '@app/services/leads.service';
import { OffersService } from '@app/services/offers.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CreateOfferComponent } from './create-offer';

import type { LeadResponseDto } from '@app/shared/models';

describe('CreateOfferComponent', () => {
  let fixture: ComponentFixture<CreateOfferComponent>;

  const leadsServiceMock = {
    getById: vi.fn(() => of(createLead())),
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

  const snackBarMock = {
    open: vi.fn(),
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('pre-fills travel details and renders lead banner when leadId exists', async () => {
    await setup('lead-1');

    expect(leadsServiceMock.getById).toHaveBeenCalledWith('lead-1');
    expect(fixture.componentInstance.form.controls.destination.value).toBe('Turkey');
    expect(fixture.componentInstance.form.controls.departDate.value).toBe('2026-08-10');
    expect(fixture.componentInstance.form.controls.returnDate.value).toBe('2026-08-17');
    expect(fixture.componentInstance.form.controls.adults.value).toBe(2);
    expect(fixture.componentInstance.form.controls.children.value).toBe(1);
    expect(fixture.componentInstance.form.controls.departureCity.value).toBe('');
  });

  it('shows empty travel details and does not fetch lead when leadId is absent', async () => {
    await setup(null);

    expect(leadsServiceMock.getById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.leadLoading()).toBe(false);

    expect(fixture.componentInstance.form.controls.destination.value).toBe('');
    expect(fixture.componentInstance.form.controls.departDate.value).toBe('');
    expect(fixture.componentInstance.form.controls.returnDate.value).toBe('');
  });

  it('shows inline warning and allows manual entry when lead does not exist', async () => {
    leadsServiceMock.getById.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    await setup('lead-missing');

    expect(fixture.componentInstance.leadLoading()).toBe(false);
    expect(fixture.componentInstance.leadPrefillWarning()).toContain('Лид не найден');
    expect(fixture.componentInstance.error()).toBe('');

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Лид не найден');
    expect(fixture.componentInstance.form.controls.destination.value).toBe('');
    expect(fixture.componentInstance.form.controls.departureCity.value).toBe('');
  });

  it('keeps Save as Draft enabled and shows required date errors after submit', async () => {
    await setup('lead-1');

    const firstAccommodation = fixture.componentInstance.accommodationsArray.at(0);

    firstAccommodation.patchValue({
      hotelName: 'Sunrise Hotel',
      checkinDate: '',
      checkoutDate: '',
      unitPrice: 150,
    });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(submitButton).not.toBeNull();

    if (!submitButton) {
      return;
    }

    expect(submitButton.disabled).toBe(false);

    submitButton.click();
    fixture.detectChanges();

    expect(firstAccommodation.controls.checkinDate.touched).toBe(true);
    expect(firstAccommodation.controls.checkoutDate.touched).toBe(true);
    expect(firstAccommodation.controls.checkinDate.hasError('required')).toBe(true);
    expect(firstAccommodation.controls.checkoutDate.hasError('required')).toBe(true);
    expect(offersServiceMock.create).not.toHaveBeenCalled();

    const checkinInput = fixture.nativeElement.querySelector(
      'input[formControlName="checkinDate"]',
    ) as HTMLElement | null;
    const checkoutInput = fixture.nativeElement.querySelector(
      'input[formControlName="checkoutDate"]',
    ) as HTMLElement | null;

    const checkinField = checkinInput?.closest('mat-form-field') as HTMLElement | null;
    const checkoutField = checkoutInput?.closest('mat-form-field') as HTMLElement | null;

    expect(checkinField).not.toBeNull();
    expect(checkoutField).not.toBeNull();
    expect(checkinField?.querySelector('mat-error')?.textContent).toContain(
      'Требуется дата заезда',
    );
    expect(checkoutField?.querySelector('mat-error')?.textContent).toContain(
      'Требуется дата выезда',
    );
  });

  async function setup(leadId: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CreateOfferComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(leadId ? { leadId } : {}),
            },
          },
        },
        { provide: LeadsService, useValue: leadsServiceMock },
        { provide: OrganizationSettingsService, useValue: organizationSettingsServiceMock },
        { provide: OffersService, useValue: offersServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: matDialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOfferComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function createLead(overrides: Partial<LeadResponseDto> = {}): LeadResponseDto {
  return {
    id: 'lead-1',
    number: 'L-1',
    source: 'MANUAL',
    clientId: 'client-1',
    clientName: 'Alex Doe',
    clientType: 'INDIVIDUAL',
    contactPhone: null,
    contactEmail: null,
    contactTelegram: null,
    companyName: null,
    destination: 'Turkey',
    departDateFrom: '2026-08-10',
    departDateTo: '2026-08-12',
    returnDateFrom: '2026-08-17',
    returnDateTo: '2026-08-20',
    adults: 2,
    children: 1,
    notes: null,
    assignedAgentId: null,
    assignedAgentName: null,
    status: 'NEW',
    expiresAt: null,
    createdById: 'user-1',
    convertedToClientId: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}
