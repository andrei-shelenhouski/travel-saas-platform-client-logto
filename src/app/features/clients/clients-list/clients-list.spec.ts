import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { ClientType } from '@app/shared/models';

import { ClientsListComponent } from './clients-list';

import type { ClientResponseDto, PaginatedClientResponseDto } from '@app/shared/models';
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

const EMPTY_PAGE: PaginatedClientResponseDto = { items: [], total: 0, page: 1, limit: 20 };

const ONE_CLIENT_PAGE: PaginatedClientResponseDto = {
  items: [
    createClient({
      fullName: 'Иванов Сергей',
      phone: '+375291234567',
      email: 'ivan@mail.ru',
    }),
  ],
  total: 1,
  page: 1,
  limit: 20,
};

describe('ClientsListComponent', () => {
  let component: ClientsListComponent;
  let fixture: ComponentFixture<ClientsListComponent>;

  async function createComponent(page: PaginatedClientResponseDto = EMPTY_PAGE): Promise<void> {
    TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ClientsService,
          useValue: { getList: () => of(page) },
        },
      ],
    });

    fixture = TestBed.createComponent(ClientsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('shows empty state when no clients returned', async () => {
    await createComponent(EMPTY_PAGE);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('Ooooops, no clients found.');
  });

  it('renders client rows when data is present', async () => {
    await createComponent(ONE_CLIENT_PAGE);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('Иванов Сергей');
  });

  it('displayName returns fullName for INDIVIDUAL', async () => {
    await createComponent();
    const name = component.displayName(
      createClient({ fullName: 'Test Name', type: ClientType.INDIVIDUAL }),
    );

    expect(name).toBe('Test Name');
  });

  it('displayName returns companyName for COMPANY', async () => {
    await createComponent();
    const name = component.displayName(
      createClient({
        type: ClientType.COMPANY,
        fullName: 'Contact Person',
        companyName: 'Acme Corp',
      }),
    );

    expect(name).toBe('Acme Corp');
  });

  it('resets page to 0 on filter change', async () => {
    await createComponent();
    component.currentPage.set(2);
    component.onFilterChange({ type: ClientType.INDIVIDUAL, search: '' });

    expect(component.currentPage()).toBe(0);
  });
});
