import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { BookingStatus, OrgRole } from '@app/shared/models';

import { OperationsSectionComponent } from './operations-section';

describe('OperationsSectionComponent', () => {
  let component: OperationsSectionComponent;
  let fixture: ComponentFixture<OperationsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationsSectionComponent],
      providers: [
        {
          provide: OrganizationMembersService,
          useValue: {
            findAll: () => of([]),
          },
        },
        {
          provide: RoleService,
          useValue: {
            roleOrDefault: () => 'Manager',
            rawRole: () => OrgRole.MANAGER,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('booking', {
      id: 'booking-1',
      status: BookingStatus.CONFIRMED,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
