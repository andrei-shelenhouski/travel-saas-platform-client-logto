import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { PersonsService } from '@app/services/persons.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import { PersonDetailComponent } from './person-detail';

describe('PersonDetailComponent', () => {
  let component: PersonDetailComponent;
  let fixture: ComponentFixture<PersonDetailComponent>;
  let personsService: {
    getById: ReturnType<typeof vi.fn>;
    getFamilyContext: ReturnType<typeof vi.fn>;
    getBookings: ReturnType<typeof vi.fn>;
    linkToClient: ReturnType<typeof vi.fn>;
    deleteContact: ReturnType<typeof vi.fn>;
  };
  let confirmDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    personsService = {
      getById: vi.fn(() =>
        of({
          id: 'p-1',
          firstName: 'Иван',
          lastName: 'Иванов',
          contacts: [
            {
              id: 'ctc-1',
              medium: 'PHONE',
              value: '+375291111111',
              primary: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          documents: [
            {
              id: 'doc-1',
              type: 'INTL_PASSPORT',
              series: 'AB',
              numberLast4: '1234',
              primary: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          addresses: [
            {
              id: 'addr-1',
              type: 'REGISTRATION',
              city: 'Minsk',
              primary: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          createdAt: '',
          updatedAt: '',
          organizationId: 'o-1',
        }),
      ),
      getFamilyContext: vi.fn(() => of({ familyMembers: [], relationships: [] })),
      getBookings: vi.fn(() => of({ items: [] })),
      linkToClient: vi.fn(() => of({ id: 'p-1' })),
      deleteContact: vi.fn(() => of(void 0)),
    };

    confirmDialog = {
      open: vi.fn(() => of(true)),
    };

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
          useValue: personsService,
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
          provide: MatSnackBar,
          useValue: { open: vi.fn() },
        },
        {
          provide: ConfirmDialogService,
          useValue: confirmDialog,
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

  it('opens document create dialog and reloads person when saved', async () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of({ saved: true }) } as never);

    const initialCalls = personsService.getById.mock.calls.length;

    (component as unknown as { openCreateDocumentDialog: () => void }).openCreateDocumentDialog();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalled();
    expect(personsService.getById.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('opens address create dialog and reloads person when saved', async () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of({ saved: true }) } as never);

    const initialCalls = personsService.getById.mock.calls.length;

    (component as unknown as { openCreateAddressDialog: () => void }).openCreateAddressDialog();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalled();
    expect(personsService.getById.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('opens contact create dialog and reloads person when saved', async () => {
    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of({ saved: true }) } as never);

    const initialCalls = personsService.getById.mock.calls.length;

    (component as unknown as { openCreateContactDialog: () => void }).openCreateContactDialog();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(openSpy).toHaveBeenCalled();
    expect(personsService.getById.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('deletes contact after confirmation and reloads person', async () => {
    const initialCalls = personsService.getById.mock.calls.length;

    (component as unknown as { deleteContact: (contact: { id: string }) => void }).deleteContact({
      id: 'ctc-1',
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(confirmDialog.open).toHaveBeenCalled();
    expect(personsService.deleteContact).toHaveBeenCalledWith('p-1', 'ctc-1');
    expect(personsService.getById.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
