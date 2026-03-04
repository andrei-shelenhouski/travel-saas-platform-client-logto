import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { MeService } from '../../../services/me.service';
import { OrganizationStateService } from '../../../services/organization-state.service';
import { OrganizationsService } from '../../../services/organizations.service';
import { RoleService } from '../../../services/role.service';
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
          useValue: { create: () => of({ id: 'org-1' }) },
        },
        {
          provide: OrganizationStateService,
          useValue: {
            setActiveOrganization: vi.fn(),
          },
        },
        { provide: MeService, useValue: { clearMeData: vi.fn(), getMe: () => of({}) } },
        { provide: RoleService, useValue: {} },
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
