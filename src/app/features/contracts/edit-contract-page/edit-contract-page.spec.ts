import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { ContractsService } from '@app/services/contracts.service';
import { ContractStatus } from '@app/shared/models';

import { EditContractPageComponent } from './edit-contract-page';

describe('EditContractPageComponent', () => {
  let component: EditContractPageComponent;
  let fixture: ComponentFixture<EditContractPageComponent>;
  let contractsService: { getById: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let router: Router;

  const contract = {
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
  };

  beforeEach(async () => {
    contractsService = {
      getById: vi.fn(() => of(contract)),
      update: vi.fn(() => of(contract)),
    };

    await TestBed.configureTestingModule({
      imports: [EditContractPageComponent],
      providers: [
        provideRouter([]),
        { provide: ContractsService, useValue: contractsService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
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
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(EditContractPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(contractsService.getById).toHaveBeenCalledWith('contract-1');
  });

  it('updates contract and navigates to view page', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onUpdateSubmitted({
      contractNumber: 'CNT-2',
      signedAt: '2026-05-23',
    });

    expect(contractsService.update).toHaveBeenCalledWith('contract-1', {
      contractNumber: 'CNT-2',
      signedAt: '2026-05-23',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/app/contracts', 'contract-1']);
  });
});
