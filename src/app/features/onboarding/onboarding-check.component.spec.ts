import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { OnboardingCheckComponent } from './onboarding-check.component';
import { MeService } from '../../services/me.service';
import { OrganizationStateService } from '../../services/organization-state.service';

describe('OnboardingCheckComponent', () => {
  let component: OnboardingCheckComponent;
  let fixture: ComponentFixture<OnboardingCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingCheckComponent],
      providers: [
        {
          provide: MeService,
          useValue: {
            getMeData: () => null,
            getMe: () => of({ organizations: [] }),
            clearMeData: vi.fn(),
          },
        },
        {
          provide: OrganizationStateService,
          useValue: {
            setActiveOrganization: vi.fn(),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
