import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { MeService } from '@app/services/me.service';
import { OrganizationStateService } from '@app/services/organization-state.service';
import { OrganizationsService } from '@app/services/organizations.service';
import { CreateOrganizationComponent } from './create-organization';

describe('CreateOrganizationComponent', () => {
  let component: CreateOrganizationComponent;
  let fixture: ComponentFixture<CreateOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrganizationComponent],
      providers: [
        provideRouter([]),
        {
          provide: OrganizationsService,
          useValue: { create: () => of(undefined) },
        },
        {
          provide: OrganizationStateService,
          useValue: {
            setActiveOrganization: vi.fn(),
          },
        },
        {
          provide: MeService,
          useValue: {
            clearMeData: vi.fn(),
            getMe: () =>
              of({
                id: '',
                firebaseUid: '',
                email: 'test@example.com',
                createdAt: '',
                updatedAt: '',
                organizations: [
                  {
                    id: 'org-1',
                    name: 'Acme',
                    defaultCurrency: 'USD',
                    invoicePrefix: 'INV',
                    invoiceNextNumber: 1,
                    createdAt: '',
                    updatedAt: '',
                    role: 'ADMIN',
                  },
                ],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
