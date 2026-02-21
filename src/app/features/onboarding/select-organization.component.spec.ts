import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SelectOrganizationComponent } from './select-organization.component';
import { MeService } from '../../services/me.service';
import { OrganizationStateService } from '../../services/organization-state.service';

describe('SelectOrganizationComponent', () => {
  let component: SelectOrganizationComponent;
  let fixture: ComponentFixture<SelectOrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectOrganizationComponent],
      providers: [
        {
          provide: MeService,
          useValue: { getMeData: () => ({ organizations: [] }), clearMeData: vi.fn() },
        },
        {
          provide: OrganizationStateService,
          useValue: { setActiveOrganization: vi.fn() },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
