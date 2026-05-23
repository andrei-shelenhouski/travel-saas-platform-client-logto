import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { of, throwError } from 'rxjs';

import { ContractsService } from '@app/services/contracts.service';
import { SignatureMethod } from '@app/shared/models';

import { ContractFormDialogComponent } from './contract-form-dialog';

import type { ContractResponseDto } from '@app/shared/models';

describe('ContractFormDialogComponent', () => {
  let component: ContractFormDialogComponent;
  let fixture: ComponentFixture<ContractFormDialogComponent>;
  let mockContractsService: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let dialogRef: {
    close: ReturnType<typeof vi.fn>;
  };

  const contract: ContractResponseDto = {
    id: 'contract-1',
    organizationId: 'org-1',
    clientId: 'client-1',
    client: null,
    contractNumber: 'C-100',
    signedAt: '2026-05-20',
    expiresAt: null,
    signatureMethod: SignatureMethod.OTHER,
    status: 'ACTIVE',
    notes: null,
    createdById: 'user-1',
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: '2026-05-20T00:00:00Z',
  };

  async function createComponent(mode: 'create' | 'edit' = 'create'): Promise<void> {
    mockContractsService = {
      create: vi.fn(() => of(contract)),
      update: vi.fn(() => of(contract)),
    };

    dialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContractFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ContractsService, useValue: mockContractsService },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            clientId: 'client-1',
            mode,
            contract: mode === 'edit' ? contract : undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('submits create payload and closes with created contract', async () => {
    await createComponent('create');

    component.onCreateSubmitted({
      clientId: 'client-1',
      contractNumber: 'C-101',
      signedAt: '2026-05-21',
    });

    expect(mockContractsService.create).toHaveBeenCalledWith({
      clientId: 'client-1',
      contractNumber: 'C-101',
      signedAt: '2026-05-21',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(contract);
  });

  it('submits update payload in edit mode', async () => {
    await createComponent('edit');

    component.onUpdateSubmitted({
      contractNumber: 'C-102',
      signedAt: '2026-05-22',
      signatureMethod: SignatureMethod.ORIGINAL_COURIER,
    });

    expect(mockContractsService.update).toHaveBeenCalledWith('contract-1', {
      contractNumber: 'C-102',
      signedAt: '2026-05-22',
      signatureMethod: SignatureMethod.ORIGINAL_COURIER,
    });
  });

  it('shows duplicate error on 409', async () => {
    await createComponent('create');

    mockContractsService.create.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    component.onCreateSubmitted({
      clientId: 'client-1',
      contractNumber: 'C-101',
      signedAt: '2026-05-21',
    });

    expect(component.submitError()).toContain('already exists');
  });
});
