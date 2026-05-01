import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancellationDialogComponent } from './cancellation-dialog';

describe('CancellationDialogComponent', () => {
  let component: CancellationDialogComponent;
  let fixture: ComponentFixture<CancellationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancellationDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CancellationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
