import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClientType } from '@app/shared/models';

import { ClientFormComponent } from './client-form';

import type { ClientResponseDto, CreateClientDto, UpdateClientDto } from '@app/shared/models';

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
    dataConsentDate: '2026-04-01',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    contacts: [],
    ...overrides,
  };
}

describe('ClientFormComponent', () => {
  let component: ClientFormComponent;
  let fixture: ComponentFixture<ClientFormComponent>;

  async function createComponent(): Promise<void> {
    TestBed.configureTestingModule({
      imports: [ClientFormComponent],
      providers: [provideNoopAnimations()],
    });

    fixture = TestBed.createComponent(ClientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();

    expect(component).toBeTruthy();
  });

  it('emits createSubmitted in create mode', async () => {
    await createComponent();
    let emitted: CreateClientDto | null = null;

    component.createSubmitted.subscribe((dto) => {
      emitted = dto;
    });

    component.selectType(ClientType.INDIVIDUAL);
    component.form.patchValue({
      fullName: 'Jane Doe',
      dataConsentGiven: true,
      dataConsentDate: '2026-04-27',
    });

    component.submit();

    expect(emitted).toEqual({
      type: ClientType.INDIVIDUAL,
      fullName: 'Jane Doe',
      dataConsentGiven: true,
    });
  });

  it('patches form and emits updateSubmitted in edit mode', async () => {
    await createComponent();
    const initial = createClient({
      type: ClientType.COMPANY,
      fullName: 'Contact Person',
      companyName: 'Acme Inc',
      legalAddress: 'Minsk',
    });
    let emitted: UpdateClientDto | null = null;

    component.updateSubmitted.subscribe((dto) => {
      emitted = dto;
    });

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('initialClient', initial);
    fixture.detectChanges();

    component.form.patchValue({
      fullName: 'Updated Person',
      companyName: 'Acme Inc',
      legalAddress: 'Minsk',
    });

    component.submit();

    expect(component.selectedType()).toBe(ClientType.COMPANY);
    expect(component.form.controls.dataConsentGiven.disabled).toBe(true);
    expect(emitted).toEqual({
      fullName: 'Updated Person',
      companyName: 'Acme Inc',
      legalAddress: 'Minsk',
    });
  });

  it('does not change type in edit mode', async () => {
    await createComponent();
    const initial = createClient({ type: ClientType.B2B_AGENT });

    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('initialClient', initial);
    fixture.detectChanges();

    component.selectType(ClientType.INDIVIDUAL);

    expect(component.selectedType()).toBe(ClientType.B2B_AGENT);
  });
});
