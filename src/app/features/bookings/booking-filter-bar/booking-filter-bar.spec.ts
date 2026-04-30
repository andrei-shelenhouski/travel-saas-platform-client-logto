import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingFilterBarComponent } from './booking-filter-bar';

describe('BookingFilterBarComponent', () => {
  let component: BookingFilterBarComponent;
  let fixture: ComponentFixture<BookingFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingFilterBarComponent);
    fixture.componentRef.setInput('staffOptions', []);
    fixture.componentRef.setInput('value', {
      status: [],
      assignedBackofficeId: '',
      departDateFrom: '',
      departDateTo: '',
    });

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit normalized values on filter changes', () => {
    const emitSpy = vi.spyOn(component.filterChange, 'emit');

    component.form.controls.status.setValue(['CONFIRMED']);
    component.form.controls.assignedBackofficeId.setValue('staff-1');
    component.form.controls.departDateFrom.setValue(new Date('2026-06-01'));
    component.form.controls.departDateTo.setValue(new Date('2026-06-15'));

    expect(emitSpy).toHaveBeenLastCalledWith({
      status: ['CONFIRMED'],
      assignedBackofficeId: 'staff-1',
      departDateFrom: '2026-06-01',
      departDateTo: '2026-06-15',
    });
  });
});
