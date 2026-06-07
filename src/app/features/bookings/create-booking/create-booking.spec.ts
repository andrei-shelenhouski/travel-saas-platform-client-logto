import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CreateBookingComponent } from './create-booking';

describe('CreateBookingComponent', () => {
  let component: CreateBookingComponent;
  let fixture: ComponentFixture<CreateBookingComponent>;
  let bookingsService: { createDirect: ReturnType<typeof vi.fn> };
  let clientsService: { getList: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    bookingsService = {
      createDirect: vi.fn(() => of({ id: 'booking-1' })),
    };
    clientsService = {
      getList: vi.fn(() => of({ items: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [CreateBookingComponent],
      providers: [
        provideRouter([]),
        { provide: BookingsService, useValue: bookingsService },
        { provide: ClientsService, useValue: clientsService },
        {
          provide: PersonsService,
          useValue: {
            getByClientId: vi.fn(() =>
              of({ id: 'person-1', firstName: 'John', lastName: 'Doe', documents: [] }),
            ),
            getFamilyContext: vi.fn(() => of({ familyMembers: [], relationships: [] })),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CreateBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits direct booking payload and redirects to booking details', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const componentApi = component as unknown as {
      form: {
        patchValue: (value: {
          clientId: string;
          clientQuery: string;
          departDate: string;
          returnDate: string;
          adults: number;
          children: number;
        }) => void;
      };
      existingTravelers: {
        set: (value: { personId: string; role: 'LEAD' | 'COMPANION' }[]) => void;
      };
      onSubmit: () => void;
    };

    componentApi.form.patchValue({
      clientId: 'client-1',
      clientQuery: 'Client 1',
      departDate: '2026-07-01',
      returnDate: '2026-07-14',
      adults: 2,
      children: 1,
    });
    componentApi.existingTravelers.set([{ personId: 'person-1', role: 'LEAD' }]);

    componentApi.onSubmit();

    expect(bookingsService.createDirect).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
      }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/app/bookings', 'booking-1']);
  });

  it('does not crash when client query control receives a non-string value', () => {
    vi.useFakeTimers();

    const componentApi = component as unknown as {
      form: { controls: { clientQuery: { setValue: (value: unknown) => void } } };
    };

    componentApi.form.controls.clientQuery.setValue({ id: 'client-1' });
    vi.advanceTimersByTime(300);

    expect(clientsService.getList).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('handles persons without documents in expiry warnings', () => {
    const componentApi = component as unknown as {
      familyMembers: {
        set: (
          value: { id: string; firstName: string; lastName: string; documents: null }[],
        ) => void;
      };
      existingTravelers: {
        set: (value: { personId: string; role: 'LEAD' | 'COMPANION' }[]) => void;
      };
      form: { controls: { returnDate: { setValue: (value: string) => void } } };
      documentExpiryWarnings: () => string[];
    };

    componentApi.familyMembers.set([
      { id: 'person-1', firstName: 'John', lastName: 'Doe', documents: null },
    ]);
    componentApi.existingTravelers.set([{ personId: 'person-1', role: 'LEAD' }]);
    componentApi.form.controls.returnDate.setValue('2026-07-14');

    expect(componentApi.documentExpiryWarnings()).toEqual([]);
  });
});
