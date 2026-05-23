import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { AuthService } from '@app/auth/auth.service';
import { ContractsService } from '@app/services/contracts.service';
import { ContractStatus, PermissionKey } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { ContractViewPageComponent } from './contract-view-page';

describe('ContractViewPageComponent', () => {
  let component: ContractViewPageComponent;
  let fixture: ComponentFixture<ContractViewPageComponent>;
  let contractsService: { getById: ReturnType<typeof vi.fn>; terminate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    contractsService = {
      getById: vi.fn(() =>
        of({
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
      ),
      terminate: vi.fn(() => of({ status: ContractStatus.TERMINATED })),
    };

    await TestBed.configureTestingModule({
      imports: [ContractViewPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasPermission: (permission: string) => permission === PermissionKey.CONTRACTS_UPDATE,
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
          provide: ToastService,
          useValue: {
            showSuccess: vi.fn(),
            showError: vi.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'contract-1' : null),
              },
            },
          },
        },
        { provide: ContractsService, useValue: contractsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractViewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('returns active status class', () => {
    expect(component.statusClass(ContractStatus.ACTIVE)).toBe(
      'contract-status contract-status-active',
    );
  });
});
