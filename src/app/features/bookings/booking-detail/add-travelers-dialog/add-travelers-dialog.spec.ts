import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';

import { AddTravelersDialogComponent } from './add-travelers-dialog';

const personsServiceMock = {
  searchFull: () => of([]),
};

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
            activeRelationshipPersonIds: [],
            mode: 'family',
          },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => undefined,
          },
        },
        {
          provide: PersonsService,
          useValue: personsServiceMock,
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
