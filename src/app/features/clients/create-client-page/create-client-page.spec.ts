import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ClientsService } from '@app/services/clients.service';
import { ClientType } from '@app/shared/models';

import { CreateClientPageComponent } from './create-client-page';

import type { ClientResponseDto, CreateClientDto } from '@app/shared/models';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class DummyRouteComponent {}

function createClient(overrides: Partial<ClientResponseDto> = {}): ClientResponseDto {
  return {
    id: 'client-1',
    organizationId: 'org-1',
    type: ClientType.INDIVIDUAL,
    fullName: 'Test Client',
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
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    contacts: [],
    ...overrides,
  };
}

describe('CreateClientPageComponent', () => {
  let component: CreateClientPageComponent;
  let fixture: ComponentFixture<CreateClientPageComponent>;
  let clientsService: { create: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  async function createComponent(): Promise<void> {
    clientsService = {
      create: vi.fn(),
    };
    snackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CreateClientPageComponent],
      providers: [
        provideRouter([
          {
            path: 'app/clients',
            children: [
              { path: '', component: DummyRouteComponent },
              { path: 'new', component: DummyRouteComponent },
              { path: ':id', component: DummyRouteComponent },
            ],
          },
        ]),
        provideNoopAnimations(),
        { provide: ClientsService, useValue: clientsService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    fixture = TestBed.createComponent(CreateClientPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();

    expect(component).toBeTruthy();
  });

  it('navigates to clients list on cancel', async () => {
    await createComponent();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.cancel();

    expect(navigateSpy).toHaveBeenCalledWith(['..'], { relativeTo: expect.any(Object) });
  });

  it('creates client and navigates to detail page', async () => {
    await createComponent();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const dto: CreateClientDto = {
      type: ClientType.INDIVIDUAL,
      fullName: 'John Doe',
      dataConsentGiven: true,
    };

    clientsService.create.mockReturnValue(of(createClient({ id: 'client-99' })));

    component.onCreateSubmitted(dto);

    expect(clientsService.create).toHaveBeenCalledWith(dto);
    expect(snackBar.open).toHaveBeenCalledWith('Client created', 'Close', { duration: 3000 });
    expect(navigateSpy).toHaveBeenCalledWith(['client-99'], { relativeTo: expect.any(Object) });
    expect(component.saving()).toBe(false);
  });

  it('shows submit error when create fails', async () => {
    await createComponent();
    const dto: CreateClientDto = {
      type: ClientType.INDIVIDUAL,
      fullName: 'John Doe',
      dataConsentGiven: true,
    };

    clientsService.create.mockReturnValue(throwError(() => new Error('Create failed')));

    component.onCreateSubmitted(dto);

    expect(component.submitError()).toBe('Create failed');
    expect(component.saving()).toBe(false);
  });
});
