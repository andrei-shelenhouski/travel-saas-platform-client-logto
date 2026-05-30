import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AddTravelersDialogComponent } from './add-travelers-dialog';

describe('AddTravelersDialogComponent', () => {
  let component: AddTravelersDialogComponent;
  let fixture: ComponentFixture<AddTravelersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTravelersDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            familyMembers: [],
          },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTravelersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
