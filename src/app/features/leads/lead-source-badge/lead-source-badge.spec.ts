import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadSourceBadgeComponent } from './lead-source-badge';

describe('LeadSourceBadgeComponent', () => {
  let component: LeadSourceBadgeComponent;
  let fixture: ComponentFixture<LeadSourceBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadSourceBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadSourceBadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders TourVisor badge with localized label', () => {
    fixture.componentRef.setInput('source', 'TOURVISOR');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('TourVisor');
  });

  it('renders fallback label for unknown source values', () => {
    fixture.componentRef.setInput('source', 'CUSTOM_IMPORT');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Custom Import');
  });

  it('renders em dash for missing source', () => {
    fixture.componentRef.setInput('source', null);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('—');
  });
});
