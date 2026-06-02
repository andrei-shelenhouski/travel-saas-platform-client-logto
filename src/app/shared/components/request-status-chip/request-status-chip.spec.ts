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

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('—');
  });

  it('should display correct label for known status', () => {
    fixture.componentRef.setInput('status', 'QUOTED');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Предложение готово');
  });

  it('should display status as-is for unknown status', () => {
    fixture.componentRef.setInput('status', 'UNKNOWN_STATUS');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('UNKNOWN_STATUS');
  });
});
