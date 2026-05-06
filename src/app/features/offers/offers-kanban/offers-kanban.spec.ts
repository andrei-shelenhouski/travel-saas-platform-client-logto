import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OffersService } from '@app/services/offers.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { RoleService } from '@app/services/role.service';
import { ToastService } from '@app/shared/services/toast.service';

import { OffersKanbanComponent } from './offers-kanban';

import type { OfferResponseDto } from '@app/shared/models';

describe('OffersKanbanComponent', () => {
  let component: OffersKanbanComponent;
  let fixture: ComponentFixture<OffersKanbanComponent>;

  const offersServiceMock = {
    getList: () => of({ items: [], total: 0, page: 1, limit: 200 }),
    setStatus: () => of(createOffer({ status: 'SENT' })),
  };

  const toastServiceMock = {
    show: () => undefined,
    showError: () => undefined,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [OffersKanbanComponent],
      providers: [
        provideRouter([]),
        { provide: OffersService, useValue: offersServiceMock },
        { provide: OrganizationMembersService, useValue: { findAll: () => of([]) } },
        { provide: PermissionService, useValue: { currentUserId: () => null } },
        { provide: RoleService, useValue: { isAgent: () => false } },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OffersKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('stores preferred view in offers_view key', () => {
    component.setPreferredView('kanban');

    expect(localStorage.getItem('offers_view')).toBe('kanban');
  });

  it('disables drops and drags for terminal statuses', () => {
    expect(component.isDropDisabled('ACCEPTED')).toBe(true);
    expect(component.isDropDisabled('EXPIRED')).toBe(true);
    expect(component.isDropDisabled('SENT')).toBe(false);

    expect(component.isDragDisabled('REJECTED')).toBe(true);
    expect(component.isDragDisabled('DRAFT')).toBe(false);
  });

  it('reverts optimistic move and shows 400 transition error', () => {
    const showErrorSpy = vi.spyOn(toastServiceMock, 'showError');
    const setStatusSpy = vi
      .spyOn(offersServiceMock, 'setStatus')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    const offer = createOffer({ status: 'DRAFT' });
    const previousColumn = [offer];
    const targetColumn: OfferResponseDto[] = [];

    const event = {
      previousContainer: { data: previousColumn },
      container: { data: targetColumn },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: offer },
    } as CdkDragDrop<OfferResponseDto[]>;

    component.onDrop(event, 'SENT');

    expect(setStatusSpy).toHaveBeenCalled();
    expect(previousColumn).toHaveLength(1);
    expect(targetColumn).toHaveLength(0);
    expect(offer.status).toBe('DRAFT');
    expect(showErrorSpy).toHaveBeenCalledWith('Invalid status transition');
  });
});

function createOffer(overrides: Partial<OfferResponseDto> = {}): OfferResponseDto {
  return {
    id: 'offer-1',
    number: 'O-001',
    destination: 'Paris',
    departDate: '2026-07-01',
    returnDate: '2026-07-08',
    adults: 2,
    children: 0,
    total: 5000,
    currency: 'USD',
    status: 'DRAFT',
    createdById: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
