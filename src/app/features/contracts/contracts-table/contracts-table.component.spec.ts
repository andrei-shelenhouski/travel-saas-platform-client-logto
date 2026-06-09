import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContractStatus } from '@app/shared/models';

import { ContractsTableComponent } from './contracts-table.component';

import type { ContractResponseDto } from '@app/shared/models';

const makeContract = (overrides: Partial<ContractResponseDto> = {}): ContractResponseDto => ({
  id: 'contract-1',
  organizationId: 'org-1',
  clientId: 'client-1',
  client: null,
  contractNumber: 'CNT-001',
  signedAt: '2026-01-15',
  expiresAt: null,
  signatureMethod: null,
  status: ContractStatus.ACTIVE,
  notes: null,
  createdById: 'user-1',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  ...overrides,
});

describe('ContractsTableComponent', () => {
  let component: ContractsTableComponent;
  let fixture: ComponentFixture<ContractsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractsTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('contracts', []);
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('shows all columns by default', () => {
    const columns = component.displayedColumns();

    expect(columns).toContain('number');
    expect(columns).toContain('client');
    expect(columns).toContain('actions');
  });

  it('omits specified columns', () => {
    fixture.componentRef.setInput('omitColumns', ['client', 'clientType', 'createdBy']);
    fixture.detectChanges();

    const columns = component.displayedColumns();

    expect(columns).not.toContain('client');
    expect(columns).not.toContain('clientType');
    expect(columns).not.toContain('createdBy');
    expect(columns).toContain('number');
    expect(columns).toContain('actions');
  });

  it('formats signature method labels', () => {
    expect(component.signatureMethodLabel('DIGITAL_PODPIS')).toBe('Podpis.by');
    expect(component.signatureMethodLabel('ORIGINAL_MAIL')).toBe('Почта');
    expect(component.signatureMethodLabel('ORIGINAL_COURIER')).toBe('Курьер');
    expect(component.signatureMethodLabel('OTHER')).toBe('Другое');
    expect(component.signatureMethodLabel(null)).toBe('—');
    expect(component.signatureMethodLabel(undefined)).toBe('—');
  });

  it('returns correct status CSS class', () => {
    expect(component.statusClass(ContractStatus.ACTIVE)).toBe(
      'contract-status contract-status-active',
    );
    expect(component.statusClass(ContractStatus.TERMINATED)).toBe(
      'contract-status contract-status-terminated',
    );
    expect(component.statusClass(ContractStatus.EXPIRED)).toBe(
      'contract-status contract-status-expired',
    );
  });

  it('resolves client label from companyName first', () => {
    const contract = makeContract({
      client: {
        id: 'client-1',
        companyName: 'Acme Corp',
        trademark: 'Acme',
        fullName: 'John Doe',
      },
    });

    expect(component.clientLabel(contract)).toBe('Acme Corp');
  });

  it('falls back to clientId when no client data', () => {
    const contract = makeContract({ client: null });

    expect(component.clientLabel(contract)).toBe('client-1');
  });

  it('emits editContract output when menu item is clicked', () => {
    const contract = makeContract();
    fixture.componentRef.setInput('contracts', [contract]);
    fixture.componentRef.setInput('canManageRow', () => true);
    fixture.detectChanges();

    const emitted: ContractResponseDto[] = [];
    component.editContract.subscribe((c) => emitted.push(c));

    component.editContract.emit(contract);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('contract-1');
  });

  it('emits terminateContract output', () => {
    const contract = makeContract();
    const emitted: ContractResponseDto[] = [];
    component.terminateContract.subscribe((c) => emitted.push(c));

    component.terminateContract.emit(contract);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('contract-1');
  });
});
