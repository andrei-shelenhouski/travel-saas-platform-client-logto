import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ClientsListComponent } from './clients-list';
import { ClientsService } from '@app/services/clients.service';
import type { ClientPageDto } from '@app/shared/models';
import { ClientType } from '@app/shared/models';

const EMPTY_PAGE: ClientPageDto = { content: [], totalElements: 0, totalPages: 0 };

const ONE_CLIENT_PAGE: ClientPageDto = {
  content: [
    {
      id: '1',
      organizationId: 'org1',
      type: ClientType.INDIVIDUAL,
      fullName: 'Иванов Сергей',
      companyName: null,
      phone: '+375291234567',
      email: 'ivan@mail.ru',
      comment: null,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    },
  ],
  totalElements: 1,
  totalPages: 1,
};

describe('ClientsListComponent', () => {
  let component: ClientsListComponent;
  let fixture: ComponentFixture<ClientsListComponent>;

  async function createComponent(page: ClientPageDto = EMPTY_PAGE): Promise<void> {
    TestBed.configureTestingModule({
      imports: [ClientsListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ClientsService,
          useValue: { getPage: () => of(page) },
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

    expect(el.textContent).toContain('Нет клиентов');
  });

  it('renders client rows when data is present', async () => {
    await createComponent(ONE_CLIENT_PAGE);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('Иванов Сергей');
  });

  it('displayName returns fullName for INDIVIDUAL', async () => {
    await createComponent();
    const name = component.displayName({
      id: '1',
      organizationId: 'org',
      type: ClientType.INDIVIDUAL,
      fullName: 'Test Name',
      companyName: null,
      phone: null,
      email: null,
      comment: null,
      createdAt: '',
      updatedAt: '',
    });

    expect(name).toBe('Test Name');
  });

  it('displayName returns companyName for COMPANY', async () => {
    await createComponent();
    const name = component.displayName({
      id: '1',
      organizationId: 'org',
      type: ClientType.COMPANY,
      fullName: 'Contact Person',
      companyName: 'Acme Corp',
      phone: null,
      email: null,
      comment: null,
      createdAt: '',
      updatedAt: '',
    });

    expect(name).toBe('Acme Corp');
  });

  it('resets page to 0 on filter change', async () => {
    await createComponent();
    component.currentPage.set(2);
    component.onFilterChange({ type: ClientType.INDIVIDUAL, search: '' });

    expect(component.currentPage()).toBe(0);
  });
});
