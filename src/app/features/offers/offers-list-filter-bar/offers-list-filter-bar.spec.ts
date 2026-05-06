import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { OffersListFilterBarComponent } from './offers-list-filter-bar';

describe('OffersListFilterBarComponent', () => {
  let component: OffersListFilterBarComponent;
  let fixture: ComponentFixture<OffersListFilterBarComponent>;

  function setRequiredInputs(showAgentFilter = true): void {
    fixture.componentRef.setInput('statusFilter', ['DRAFT']);
    fixture.componentRef.setInput('statusOptions', [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'SENT', label: 'Sent' },
    ]);
    fixture.componentRef.setInput('showAgentFilter', showAgentFilter);
    fixture.componentRef.setInput('selectedAgentId', 'agent-1');
    fixture.componentRef.setInput('agentOptions', [
      { id: 'agent-1', name: 'Agent One' },
      { id: 'agent-2', name: 'Agent Two' },
    ]);
    fixture.componentRef.setInput('dateFromFilter', '2026-01-01');
    fixture.componentRef.setInput('dateToFilter', '2026-01-31');
    fixture.componentRef.setInput('searchControl', new FormControl('test', { nonNullable: true }));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersListFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OffersListFilterBarComponent);
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
    const dateFromEmit = vi.spyOn(component.dateFromChange, 'emit');
    const dateToEmit = vi.spyOn(component.dateToChange, 'emit');

    component.onStatusSelectionChange(['SENT']);
    component.onAgentSelectionChange('agent-2');
    component.onDateFromInputChange('2026-02-01');
    component.onDateToInputChange('2026-02-28');

    expect(statusFilterEmit).toHaveBeenCalledWith(['SENT']);
    expect(agentFilterEmit).toHaveBeenCalledWith('agent-2');
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
