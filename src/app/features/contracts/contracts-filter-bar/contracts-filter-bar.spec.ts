import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractsFilterBarComponent } from './contracts-filter-bar';

describe('ContractsFilterBarComponent', () => {
  let component: ContractsFilterBarComponent;
  let fixture: ComponentFixture<ContractsFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractsFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsFilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', { status: '', clientId: '' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('patches value input into form', () => {
    fixture.componentRef.setInput('value', { status: 'ACTIVE', clientId: 'client-1' });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({ status: 'ACTIVE', clientId: 'client-1' });
  });
});
