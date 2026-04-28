import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { LeadsListFilterBarComponent } from './leads-list-filter-bar';

describe('LeadsListFilterBarComponent', () => {
  let component: LeadsListFilterBarComponent;
  let fixture: ComponentFixture<LeadsListFilterBarComponent>;

  function setRequiredInputs(showAgentFilter = true): void {
    fixture.componentRef.setInput('statusFilter', ['NEW']);
    fixture.componentRef.setInput('statusOptions', [
      { value: 'NEW', label: 'New' },
      { value: 'ASSIGNED', label: 'Assigned' },
    ]);
    fixture.componentRef.setInput('showAgentFilter', showAgentFilter);
    fixture.componentRef.setInput('selectedAgentId', 'agent-1');
    fixture.componentRef.setInput('agentOptions', [
      { id: 'agent-1', name: 'Agent One' },
      { id: 'agent-2', name: 'Agent Two' },
    ]);
    fixture.componentRef.setInput('clientTypeFilter', 'COMPANY');
    fixture.componentRef.setInput('clientTypeOptions', [
      { value: 'COMPANY', label: 'Company' },
      { value: 'INDIVIDUAL', label: 'Individual' },
    ]);
    fixture.componentRef.setInput('dateFromFilter', '2026-01-01');
    fixture.componentRef.setInput('dateToFilter', '2026-01-31');
    fixture.componentRef.setInput('searchControl', new FormControl('john', { nonNullable: true }));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsListFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsListFilterBarComponent);
    component = fixture.componentInstance;
    setRequiredInputs();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit all filter changes via handlers', () => {
    const statusFilterEmit = vi.spyOn(component.statusFilterChange, 'emit');
    const agentFilterEmit = vi.spyOn(component.agentFilterChange, 'emit');
    const clientTypeFilterEmit = vi.spyOn(component.clientTypeFilterChange, 'emit');
    const dateFromEmit = vi.spyOn(component.dateFromChange, 'emit');
    const dateToEmit = vi.spyOn(component.dateToChange, 'emit');

    component.onStatusSelectionChange(['ASSIGNED']);
    component.onAgentSelectionChange('agent-2');
    component.onClientTypeSelectionChange('INDIVIDUAL');
    component.onDateFromInputChange('2026-02-01');
    component.onDateToInputChange('2026-02-28');

    expect(statusFilterEmit).toHaveBeenCalledWith(['ASSIGNED']);
    expect(agentFilterEmit).toHaveBeenCalledWith('agent-2');
    expect(clientTypeFilterEmit).toHaveBeenCalledWith('INDIVIDUAL');
    expect(dateFromEmit).toHaveBeenCalledWith('2026-02-01');
    expect(dateToEmit).toHaveBeenCalledWith('2026-02-28');
  });

  it('should hide agent field when showAgentFilter is false', () => {
    setRequiredInputs(false);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Agent');
  });
});
