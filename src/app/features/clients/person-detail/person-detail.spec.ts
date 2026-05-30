import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { ToastService } from '@app/shared/services/toast.service';

import { PersonDetailComponent } from './person-detail';

describe('PersonDetailComponent', () => {
  let component: PersonDetailComponent;
  let fixture: ComponentFixture<PersonDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'p-1']])),
          },
        },
        {
          provide: PersonsService,
          useValue: {
            getById: () =>
              of({
                id: 'p-1',
                firstName: 'Иван',
                lastName: 'Иванов',
                contacts: [],
                documents: [],
                addresses: [],
                createdAt: '',
                updatedAt: '',
                organizationId: 'o-1',
              }),
            getRelationships: () => of([]),
            getFamily: () => of([]),
            linkToClient: () => of({ id: 'p-1' }),
          },
        },
        {
          provide: ClientsService,
          useValue: {
            create: () => of({ id: 'c-1' }),
          },
        },
        {
          provide: BookingsService,
          useValue: {
            getList: () => of({ items: [] }),
          },
        },
        {
          provide: ToastService,
          useValue: {
            showSuccess: () => undefined,
            showError: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
