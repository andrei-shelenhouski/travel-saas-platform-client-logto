import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { vi } from 'vitest';

import { ClientType } from '@app/shared/models';

import { ClientsTableComponent } from './clients-table.component';

import type { ClientResponseDto } from '@app/shared/models';

function createClient(overrides: Partial<ClientResponseDto> = {}): ClientResponseDto {
  return {
    id: '1',
    organizationId: 'org1',
    type: ClientType.INDIVIDUAL,
    fullName: 'Test Client',
    email: null,
    phone: null,
    telegramHandle: null,
    notes: null,
    companyName: null,
    legalAddress: null,
    unp: null,
    okpo: null,
    commissionPct: null,
    iban: null,
    bankName: null,
    bik: null,
    dataConsentGiven: true,
    dataConsentDate: null,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    contacts: [],
    ...overrides,
  };
}

describe('ClientsTableComponent', () => {
  let component: ClientsTableComponent;
  let fixture: ComponentFixture<ClientsTableComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ClientsTableComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    });

    fixture = TestBed.createComponent(ClientsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows empty state when no clients are provided', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('Упс, клиенты не найдены.');
  });

  it('renders a row for each client', async () => {
    fixture.componentRef.setInput('clients', [
      createClient({ fullName: 'Иванов Сергей' }),
      createClient({ id: '2', fullName: 'Петрова Анна' }),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Иванов Сергей');
    expect(el.textContent).toContain('Петрова Анна');
  });

  describe('displayName', () => {
    it('returns fullName for INDIVIDUAL', () => {
      expect(
        component.displayName(createClient({ fullName: 'Test Name', type: ClientType.INDIVIDUAL })),
      ).toBe('Test Name');
    });

    it('returns companyName for COMPANY', () => {
      expect(
        component.displayName(
          createClient({ type: ClientType.COMPANY, fullName: 'Contact', companyName: 'Acme Corp' }),
        ),
      ).toBe('Acme Corp');
    });

    it('falls back to fullName for COMPANY when companyName is null', () => {
      expect(
        component.displayName(
          createClient({ type: ClientType.COMPANY, fullName: 'Fallback', companyName: null }),
        ),
      ).toBe('Fallback');
    });
  });

  describe('displaySubtitle', () => {
    it('returns null for INDIVIDUAL', () => {
      expect(component.displaySubtitle(createClient({ type: ClientType.INDIVIDUAL }))).toBeNull();
    });

    it('returns fullName for COMPANY', () => {
      expect(
        component.displaySubtitle(
          createClient({ type: ClientType.COMPANY, fullName: 'Contact Person' }),
        ),
      ).toBe('Contact Person');
    });
  });

  describe('displayedColumns', () => {
    it('includes all columns by default', () => {
      expect(component.displayedColumns()).toEqual([
        'name',
        'type',
        'phone',
        'email',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('omits specified columns', () => {
      fixture.componentRef.setInput('omitColumns', ['phone', 'email']);
      expect(component.displayedColumns()).not.toContain('phone');
      expect(component.displayedColumns()).not.toContain('email');
    });
  });

  it('navigates to client detail on row click', async () => {
    fixture.componentRef.setInput('clients', [createClient({ id: 'abc123' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const row = fixture.nativeElement.querySelector('tr.table-row') as HTMLElement;
    row.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/clients', 'abc123']);
  });
});
