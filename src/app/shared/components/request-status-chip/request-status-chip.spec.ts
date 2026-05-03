import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestStatusChipComponent } from './request-status-chip';

describe('RequestStatusChipComponent', () => {
  let component: RequestStatusChipComponent;
  let fixture: ComponentFixture<RequestStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestStatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestStatusChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display fallback when status is null', () => {
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();

    expect(component.label()).toBe('—');
  });

  it('should display correct label for known status', () => {
    fixture.componentRef.setInput('status', 'QUOTED');
    fixture.detectChanges();

    expect(component.label()).toBe('Quoted');
  });

  it('should display status as-is for unknown status', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN_STATUS');
    fixture.detectChanges();

    expect(component.label()).toBe('UNKNOWN_STATUS');
  });
});
