import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';

import { AddFamilyMemberDialogComponent } from './add-family-member-dialog';

describe('AddFamilyMemberDialogComponent', () => {
  let component: AddFamilyMemberDialogComponent;
  let fixture: ComponentFixture<AddFamilyMemberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFamilyMemberDialogComponent],
      providers: [
        {
          provide: PersonsService,
          useValue: {
            search: () => of([]),
            create: () => of({ id: 'p-2' }),
            addRelationship: () => of({ id: 'r-1' }),
          },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => undefined,
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            personId: 'p-1',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddFamilyMemberDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
