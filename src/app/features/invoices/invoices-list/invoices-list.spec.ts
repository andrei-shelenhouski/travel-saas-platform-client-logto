import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesListComponent } from './invoices-list';

describe('InvoicesListComponent', () => {
  let component: InvoicesListComponent;
  let fixture: ComponentFixture<InvoicesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
