import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { BookingsService } from '@app/services/bookings.service';
import { ClientsService } from '@app/services/clients.service';
import { InvoicesService } from '@app/services/invoices.service';
import { OrganizationSettingsService } from '@app/services/organization-settings.service';
import { ClientType } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

import { CreateInvoiceComponent } from './create-invoice';

import type { BookingResponseDto, ClientResponseDto, InvoiceResponseDto } from '@app/shared/models';

function createClient(overrides: Partial<ClientResponseDto> = {}): ClientResponseDto {
  return {
    id: 'client-1',
    organizationId: 'org-1',
    type: ClientType.INDIVIDUAL,
    fullName: 'John Doe',
    email: null,
    phone: null,
    telegramHandle: null,
    notes: null,
    companyName: null,
    legalAddress: null,
    unp: null,
    okpo: null,
    commissionPct: null,
    iban: null,
    bankName: null,
    bik: null,
    dataConsentGiven: true,
    dataConsentDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    contacts: [],
    ...overrides,
  };
}

function createBooking(overrides: Partial<BookingResponseDto> = {}): BookingResponseDto {
  return {
    id: 'booking-1',
    organizationId: 'org-1',
    offerId: 'offer-1',
    clientId: 'client-1',
    status: 'CONFIRMED',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    destination: 'Rome',
    departDate: '2026-06-10',
    returnDate: '2026-06-15',
    adults: 2,
    children: 1,
    ...overrides,
  };
}

describe('CreateInvoiceComponent', () => {
  let fixture: ComponentFixture<CreateInvoiceComponent>;
  let component: CreateInvoiceComponent;

  let bookingsService: {
    getById: ReturnType<typeof vi.fn>;
  };
  let clientsService: {
    getList: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let invoicesService: {
    create: ReturnType<typeof vi.fn>;
  };

  async function createComponent(queryParams: Record<string, string> = {}): Promise<void> {
    bookingsService = {
      getById: vi.fn(() => of(createBooking())),
    };

    clientsService = {
      getList: vi.fn(() => of({ items: [], total: 0, page: 1, limit: 10 })),
      getById: vi.fn(() => of(createClient())),
    };

    invoicesService = {
      create: vi.fn(() => of({ id: 'invoice-1' } as unknown as InvoiceResponseDto)),
    };

    await TestBed.configureTestingModule({
      imports: [CreateInvoiceComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
        {
          provide: ClientsService,
          useValue: clientsService,
        },
        {
          provide: InvoicesService,
          useValue: invoicesService,
        },
        {
          provide: OrganizationSettingsService,
          useValue: {
            get: vi.fn(() =>
              of({
                defaultCurrency: 'USD',
                defaultLanguage: 'EN',
                defaultPaymentTerms: 'Pay in 5 days',
              }),
            ),
          },
        },
        {
          provide: ToastService,
          useValue: {
            showSuccess: vi.fn(),
            showError: vi.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('creates and prefills booking data from query param', async () => {
    await createComponent({ bookingId: 'booking-1' });
    const lineItems = (
      component as unknown as {
        lineItemsArray: { at: (i: number) => { controls: { description: { value: string } } } };
      }
    ).lineItemsArray;

    expect(component).toBeTruthy();
    expect(
      (
        component as unknown as {
          form: { controls: { bookingId: { value: string } } };
        }
      ).form.controls.bookingId.value,
    ).toBe('booking-1');
    expect(bookingsService.getById).toHaveBeenCalledWith('booking-1');
    expect(lineItems.at(0).controls.description.value).toContain('Travel services');
  });

  it('calculates standard mode totals, validates due date, and sends total amount', async () => {
    await createComponent();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cmp = component as unknown as {
      form: CreateInvoiceComponent['form'];
      lineItemsArray: CreateInvoiceComponent['lineItemsArray'];
      onStandardItemInput: (index: number) => void;
      pricingSummary: () => { subtotal: number };
      onSubmit: () => void;
    };

    cmp.form.controls.clientId.setValue('client-1');
    cmp.form.controls.clientType.setValue(ClientType.INDIVIDUAL);
    cmp.lineItemsArray.at(0).controls.unitPrice.setValue(150);
    cmp.lineItemsArray.at(0).controls.quantity.setValue(2);
    cmp.onStandardItemInput(0);

    expect(cmp.lineItemsArray.at(0).controls.total.value).toBe(300);
    expect(cmp.pricingSummary().subtotal).toBe(300);

    cmp.form.controls.dueDate.setValue('2026-05-10');
    cmp.lineItemsArray.at(0).controls.description.setValue('Transfer service');
    cmp.onSubmit();

    expect(invoicesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          expect.objectContaining({
            unitPrice: 150,
            quantity: 2,
            tourCost: 300,
          }),
        ],
      }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices', 'invoice-1']);

    cmp.form.controls.invoiceDate.setValue('2026-05-10');
    cmp.form.controls.dueDate.setValue('2026-05-09');

    expect(cmp.form.hasError('dueDateBeforeInvoiceDate')).toBe(true);
  });

  it('calculates B2B values and submits draft invoice', async () => {
    await createComponent();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const cmp = component as unknown as {
      form: CreateInvoiceComponent['form'];
      lineItemsArray: CreateInvoiceComponent['lineItemsArray'];
      onClientSelected: (client: ClientResponseDto) => void;
      onB2bTourCostInput: (index: number) => void;
      onB2bCommissionPctInput: (index: number) => void;
      onSubmit: () => void;
    };

    clientsService.getById.mockReturnValue(
      of(
        createClient({
          id: 'client-2',
          type: ClientType.B2B_AGENT,
          commissionPct: 10,
        }),
      ),
    );

    cmp.onClientSelected(
      createClient({
        id: 'client-2',
        type: ClientType.B2B_AGENT,
        commissionPct: 10,
      }),
    );

    cmp.form.controls.clientId.setValue('client-2');
    cmp.form.controls.clientType.setValue(ClientType.B2B_AGENT);
    cmp.lineItemsArray.at(0).controls.description.setValue('Tour package');
    cmp.lineItemsArray.at(0).controls.tourCost.setValue(1000);
    cmp.lineItemsArray.at(0).controls.commissionPct.setValue(10);
    cmp.onB2bTourCostInput(0);
    cmp.onB2bCommissionPctInput(0);

    expect(cmp.lineItemsArray.at(0).controls.commissionAmount.value).toBe(100);
    expect(cmp.lineItemsArray.at(0).controls.netToPay.value).toBe(900);

    cmp.onSubmit();

    expect(invoicesService.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/app/invoices', 'invoice-1']);
  });

  it('resolves typed client name on blur and sets client id', async () => {
    await createComponent();

    clientsService.getList.mockReturnValue(
      of({
        items: [createClient({ id: 'client-typed', fullName: 'Typed Client' })],
        total: 1,
        page: 1,
        limit: 10,
      }),
    );

    const cmp = component as unknown as {
      clientSearchControl: CreateInvoiceComponent['clientSearchControl'];
      form: CreateInvoiceComponent['form'];
      onClientSearchBlur: () => void;
    };

    cmp.clientSearchControl.setValue('Typed Client');
    fixture.detectChanges();
    await fixture.whenStable();

    cmp.onClientSearchBlur();

    expect(cmp.form.controls.clientId.value).toBe('client-typed');
  });

  it('reactively updates isB2bMode signal when clientType toggles between INDIVIDUAL and B2B_AGENT', async () => {
    await createComponent();

    const cmp = component as unknown as {
      form: CreateInvoiceComponent['form'];
      isB2bMode: () => boolean;
    };

    expect(cmp.isB2bMode()).toBe(false);

    cmp.form.controls.clientType.setValue(ClientType.B2B_AGENT);
    fixture.detectChanges();

    expect(cmp.isB2bMode()).toBe(true);

    cmp.form.controls.clientType.setValue(ClientType.INDIVIDUAL);
    fixture.detectChanges();

    expect(cmp.isB2bMode()).toBe(false);

    cmp.form.controls.clientType.setValue(ClientType.COMPANY);
    fixture.detectChanges();

    expect(cmp.isB2bMode()).toBe(false);
  });

  it('initializes derived B2B fields when adding a new line item in B2B mode', async () => {
    await createComponent();

    const cmp = component as unknown as {
      form: CreateInvoiceComponent['form'];
      lineItemsArray: CreateInvoiceComponent['lineItemsArray'];
      addLineItem: () => void;
      onB2bTourCostInput: (index: number) => void;
      onB2bCommissionPctInput: (index: number) => void;
    };

    cmp.form.controls.clientType.setValue(ClientType.B2B_AGENT);
    cmp.lineItemsArray.at(0).controls.tourCost.setValue(1000);
    cmp.lineItemsArray.at(0).controls.commissionPct.setValue(10);
    cmp.onB2bTourCostInput(0);
    fixture.detectChanges();

    cmp.addLineItem();
    fixture.detectChanges();

    const newRow = cmp.lineItemsArray.at(1);

    newRow.controls.tourCost.setValue(500);
    newRow.controls.commissionPct.setValue(15);
    cmp.onB2bCommissionPctInput(1);
    fixture.detectChanges();

    expect(newRow.controls.commissionAmount.value).toBe(75);
    expect(newRow.controls.netToPay.value).toBe(425);
    expect(newRow.controls.commissionVat.value).toBe(15);
  });

  it('updates netToPay and commissionVat when default commission is applied programmatically for B2B_AGENT', async () => {
    await createComponent();

    const cmp = component as unknown as {
      form: CreateInvoiceComponent['form'];
      lineItemsArray: CreateInvoiceComponent['lineItemsArray'];
      onClientSelected: (client: ClientResponseDto) => void;
      onB2bTourCostInput: (index: number) => void;
    };

    const b2bClient = createClient({
      id: 'b2b-client',
      type: ClientType.B2B_AGENT,
      commissionPct: 12,
    });

    clientsService.getById.mockReturnValue(of(b2bClient));

    const initialCommissionPct = cmp.lineItemsArray.at(0).controls.commissionPct.value;

    expect(initialCommissionPct).toBe(null);

    cmp.onClientSelected(b2bClient);
    fixture.detectChanges();

    const row = cmp.lineItemsArray.at(0);

    expect(row.controls.commissionPct.value).toBe(12);

    row.controls.tourCost.setValue(2000);
    cmp.onB2bTourCostInput(0);
    fixture.detectChanges();

    expect(row.controls.commissionAmount.value).toBe(240);
    expect(row.controls.netToPay.value).toBe(1760);
    expect(row.controls.commissionVat.value).toBe(48);
  });
});
