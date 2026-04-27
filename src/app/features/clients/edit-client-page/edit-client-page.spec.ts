import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ClientsService } from '@app/services/clients.service';
import { ClientType } from '@app/shared/models';

import { EditClientPageComponent } from './edit-client-page';

import type { ClientResponseDto, UpdateClientDto } from '@app/shared/models';

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

describe('EditClientPageComponent', () => {
  let component: EditClientPageComponent;
  let fixture: ComponentFixture<EditClientPageComponent>;
  let clientsService: {
    getById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  async function createComponent(clientId: string | null = 'client-1'): Promise<void> {
    clientsService = {
      getById: vi.fn(),
      update: vi.fn(),
    };
    snackBar = {
      open: vi.fn(),
    };

    clientsService.getById.mockReturnValue(of(createClient({ id: clientId ?? 'client-1' })));

    TestBed.configureTestingModule({
      imports: [EditClientPageComponent],
      providers: [
        provideRouter([
          {
            path: 'app/clients',
            children: [
              { path: '', component: DummyRouteComponent },
              { path: ':id', component: DummyRouteComponent },
              { path: ':id/edit', component: DummyRouteComponent },
            ],
          },
        ]),
        provideNoopAnimations(),
        { provide: ClientsService, useValue: clientsService },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(clientId === null ? {} : { id: clientId }),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(EditClientPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent();

    expect(component).toBeTruthy();
  });

  it('navigates to clients list when route id is missing', async () => {
    await createComponent(null);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['..'], { relativeTo: expect.any(Object) });
    expect(clientsService.getById).not.toHaveBeenCalled();
  });

  it('loads client from API on init', async () => {
    await createComponent('client-1');

    expect(clientsService.getById).toHaveBeenCalledWith('client-1');
    expect(component.client()?.id).toBe('client-1');
    expect(component.loading()).toBe(false);
  });

  it('navigates back to detail page on cancel', async () => {
    await createComponent('client-1');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.cancel();

    expect(navigateSpy).toHaveBeenCalledWith(['..'], { relativeTo: expect.any(Object) });
  });

  it('updates client and navigates to detail page', async () => {
    await createComponent('client-1');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const dto: UpdateClientDto = { fullName: 'Updated Name' };

    clientsService.update.mockReturnValue(
      of(createClient({ id: 'client-1', fullName: 'Updated Name' })),
    );

    component.onUpdateSubmitted(dto);

    expect(clientsService.update).toHaveBeenCalledWith('client-1', dto);
    expect(snackBar.open).toHaveBeenCalledWith('Client updated', 'Close', { duration: 3000 });
    expect(navigateSpy).toHaveBeenCalledWith(['..'], { relativeTo: expect.any(Object) });
    expect(component.saving()).toBe(false);
  });

  it('shows submit error when update fails', async () => {
    await createComponent('client-1');
    const dto: UpdateClientDto = { fullName: 'Updated Name' };

    clientsService.update.mockReturnValue(throwError(() => new Error('Update failed')));

    component.onUpdateSubmitted(dto);

    expect(component.submitError()).toBe('Update failed');
    expect(component.saving()).toBe(false);
  });
});
