import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { ContractsService } from '@app/services/contracts.service';
import { ContractStatus, PermissionKey } from '@app/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ContractsListComponent } from './contracts-list';

describe('ContractsListComponent', () => {
  let component: ContractsListComponent;
  let fixture: ComponentFixture<ContractsListComponent>;
  let contractsService: { getList: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    contractsService = {
      getList: vi.fn(() =>
        of({
          items: [],
          total: 0,
          page: 1,
          limit: 20,
        }),
      ),
      terminate: vi.fn(() => of({})),
    };

    await TestBed.configureTestingModule({
      imports: [ContractsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ContractsService,
          useValue: contractsService,
        },
        {
          provide: AuthService,
          useValue: {
            hasPermission: (permission: string) =>
              permission === PermissionKey.CONTRACTS_CREATE ||
              permission === PermissionKey.CONTRACTS_UPDATE,
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn(() => ({
              afterClosed: () => of(false),
            })),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ContractsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('loads contracts with defaults', () => {
    expect(contractsService.getList).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      clientId: undefined,
    });
  });

  it('navigates to edit contract page', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.goToEditContract({
      id: 'contract-1',
      organizationId: 'org-1',
      clientId: 'client-1',
      client: null,
      contractNumber: 'CNT-1',
      signedAt: '2026-05-20',
      expiresAt: null,
      signatureMethod: null,
      status: ContractStatus.ACTIVE,
      notes: null,
      createdById: 'user-1',
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z',
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/app/contracts', 'contract-1', 'edit']);
  });

  it('navigates to create with selected client in query params', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onFilterChange({ status: '', clientId: 'client-42' });
    component.goToCreateContract();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/contracts/new'], {
      queryParams: { clientId: 'client-42' },
    });
  });

  it('can manage only active contract when update permission exists', () => {
    expect(
      component.canManageContract({
        id: 'contract-1',
        organizationId: 'org-1',
        clientId: 'client-1',
        client: null,
        contractNumber: 'CNT-1',
        signedAt: '2026-05-20',
        expiresAt: null,
        signatureMethod: null,
        status: ContractStatus.ACTIVE,
        notes: null,
        createdById: 'user-1',
        createdAt: '2026-05-20T10:00:00Z',
        updatedAt: '2026-05-20T10:00:00Z',
      }),
    ).toBe(true);

    expect(
      component.canManageContract({
        id: 'contract-2',
        organizationId: 'org-1',
        clientId: 'client-1',
        client: null,
        contractNumber: 'CNT-2',
        signedAt: '2026-05-20',
        expiresAt: null,
        signatureMethod: null,
        status: ContractStatus.TERMINATED,
        notes: null,
        createdById: 'user-1',
        createdAt: '2026-05-20T10:00:00Z',
        updatedAt: '2026-05-20T10:00:00Z',
      }),
    ).toBe(false);
  });
});
