import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractStatus } from '@app/shared/models';

import { ContractFormComponent } from './contract-form';

describe('ContractFormComponent', () => {
  let component: ContractFormComponent;
  let fixture: ComponentFixture<ContractFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('emits create payload with client id from input when not editable', () => {
    fixture.componentRef.setInput('clientId', 'client-1');
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.createSubmitted, 'emit');

    component.form.patchValue({
      contractNumber: 'CNT-100',
      signedAt: '2026-05-23',
      notes: 'Some notes',
    });

    component.submit();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        contractNumber: 'CNT-100',
        signedAt: '2026-05-23',
      }),
    );
  });

  it('emits update payload in edit mode', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('initialContract', {
      id: 'contract-1',
      organizationId: 'org-1',
      clientId: 'client-1',
      client: null,
      contractNumber: 'CNT-42',
      signedAt: '2026-04-01',
      expiresAt: null,
      signatureMethod: null,
      status: ContractStatus.ACTIVE,
      notes: null,
      createdById: 'user-1',
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    });
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.updateSubmitted, 'emit');

    component.submit();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        contractNumber: 'CNT-42',
        signedAt: '2026-04-01',
      }),
    );
  });
});
