import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { of } from 'rxjs';

import { PersonsService } from '@app/services/persons.service';

import { FamilySectionComponent } from './family-section';

describe('FamilySectionComponent', () => {
  let component: FamilySectionComponent;
  let fixture: ComponentFixture<FamilySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilySectionComponent],
      providers: [
        {
          provide: PersonsService,
          useValue: {
            getFamilyContext: () =>
              of({
                familyMembers: [
                  {
                    id: 'p-2',
                    organizationId: 'org-1',
                    firstName: 'Иван',
                    lastName: 'Иванов',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    documents: [],
                    addresses: [],
                    contacts: [],
                    active: true,
                  },
                ],
                relationships: [
                  {
                    id: 'rel-1',
                    personId: 'p-1',
                    relatedPersonId: 'p-2',
                    type: 'SPOUSE_OF',
                    status: 'ACTIVE',
                  },
                ],
              }),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({ afterClosed: () => of({ saved: false }) }),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilySectionComponent);
    fixture.componentRef.setInput('personId', 'p-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
