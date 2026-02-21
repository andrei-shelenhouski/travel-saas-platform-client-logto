import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CreateOrganizationComponent } from './create-organization.component';
import { OrganizationsService } from '../../services/organizations.service';
import { OrganizationStateService } from '../../services/organization-state.service';
import { MeService } from '../../services/me.service';

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
        { provide: MeService, useValue: { clearMeData: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
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
