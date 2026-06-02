import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadStatusChipComponent } from './lead-status-chip';

describe('LeadStatusChipComponent', () => {
  let component: LeadStatusChipComponent;
  let fixture: ComponentFixture<LeadStatusChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadStatusChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadStatusChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display fallback when status is null', () => {
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('—');
  });

  it('should display correct label for known status', () => {
    fixture.componentRef.setInput('status', 'WON');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Выигран');
  });

  it('should display status as-is for unknown status', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN_STATUS');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('UNKNOWN_STATUS');
  });
});
