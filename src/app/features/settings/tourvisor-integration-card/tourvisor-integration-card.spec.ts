import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { TourvisorIntegrationService } from '@app/services/tourvisor-integration.service';
import { ToastService } from '@app/shared/services/toast.service';

import { TourvisorIntegrationCardComponent } from './tourvisor-integration-card';

import type { TourvisorIntegrationSettingsResponseDto } from '@app/shared/models';

describe('TourvisorIntegrationCardComponent', () => {
  let fixture: ComponentFixture<TourvisorIntegrationCardComponent>;
  let component: TourvisorIntegrationCardComponent;
  let adminAccess: boolean;

  let integrationService: {
    getSettings: ReturnType<typeof vi.fn>;
    upsertSettings: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    testConnection: ReturnType<typeof vi.fn>;
    syncNow: ReturnType<typeof vi.fn>;
  };

  let dialog: {
    open: ReturnType<typeof vi.fn>;
  };

  let membersService: {
    findAll: ReturnType<typeof vi.fn>;
  };

  let toast: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    adminAccess = true;

    integrationService = {
      getSettings: vi.fn(() => of({ connected: false })),
      upsertSettings: vi.fn(() => of(createConnectedSettings())),
      disconnect: vi.fn(() => of(undefined)),
      testConnection: vi.fn(() => of({ ok: true })),
      syncNow: vi.fn(() => of(undefined)),
    };

    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(true) })),
    };

    membersService = {
      findAll: vi.fn(() =>
        of([
          {
            id: 'member-1',
            userId: 'user-1',
            name: 'Alice Agent',
            email: 'alice@example.com',
            role: 'AGENT',
            active: true,
          },
        ]),
      ),
    };

    toast = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TourvisorIntegrationCardComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: PermissionService,
          useValue: {
            isAdmin: () => adminAccess,
          },
        },
        {
          provide: OrganizationMembersService,
          useValue: membersService,
        },
        { provide: TourvisorIntegrationService, useValue: integrationService },
        { provide: MatDialog, useValue: dialog },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TourvisorIntegrationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders disconnected state from API response', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect((component as unknown as { isConnected: () => boolean }).isConnected()).toBe(false);
    expect(host.querySelector('form')).toBeTruthy();
  });

  it('requires authkey before submitting connect form', () => {
    const api = component as unknown as {
      form: TourvisorIntegrationCardComponent['form'];
      saveIntegrationSettings: () => void;
    };

    api.form.controls.authkey.setValue('');

    api.saveIntegrationSettings();

    expect(integrationService.upsertSettings).not.toHaveBeenCalled();
    expect(api.form.controls.authkey.hasError('required')).toBe(true);
  });

  it('rejects whitespace-only authkey before submitting connect form', () => {
    const api = component as unknown as {
      form: TourvisorIntegrationCardComponent['form'];
      saveIntegrationSettings: () => void;
    };

    api.form.controls.authkey.setValue('   ');

    api.saveIntegrationSettings();

    expect(integrationService.upsertSettings).not.toHaveBeenCalled();
    expect(api.form.controls.authkey.hasError('required')).toBe(true);
  });

  it('transitions to connected state after successful connect', () => {
    const api = component as unknown as {
      form: TourvisorIntegrationCardComponent['form'];
      saveIntegrationSettings: () => void;
      isConnected: () => boolean;
    };

    api.form.patchValue({
      authkey: 'abc123',
      defaultAgentId: 'user-1',
    });

    api.saveIntegrationSettings();

    expect(integrationService.upsertSettings).toHaveBeenCalledWith({
      authkey: 'abc123',
      defaultAgentId: 'user-1',
      ingestOrderTypes: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(api.isConnected()).toBe(true);
    expect(toast.showSuccess).toHaveBeenCalledWith('TourVisor успешно подключён.');
  });

  it('shows inline API errors in connect flow', () => {
    const api = component as unknown as {
      form: TourvisorIntegrationCardComponent['form'];
      inlineError: () => string | null;
      saveIntegrationSettings: () => void;
    };

    integrationService.upsertSettings.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Invalid authkey' },
          }),
      ),
    );

    api.form.controls.authkey.setValue('broken-key');

    api.saveIntegrationSettings();

    expect(api.inlineError()).toBe('Invalid authkey');
  });

  it('disconnects after confirmation and returns to disconnected state', () => {
    const api = component as unknown as {
      settings: { set: (value: TourvisorIntegrationSettingsResponseDto) => void };
      isConnected: () => boolean;
      confirmDisconnect: () => void;
    };

    api.settings.set(createConnectedSettings());

    api.confirmDisconnect();

    expect(integrationService.disconnect).toHaveBeenCalled();
    expect(api.isConnected()).toBe(false);
  });

  it('sync now triggers API and refreshes settings after 3 seconds', () => {
    vi.useFakeTimers();

    try {
      const api = component as unknown as {
        settings: { set: (value: TourvisorIntegrationSettingsResponseDto) => void };
        syncNow: () => void;
      };

      api.settings.set(createConnectedSettings());

      api.syncNow();
      vi.advanceTimersByTime(3000);

      expect(integrationService.syncNow).toHaveBeenCalled();
      expect(integrationService.getSettings).toHaveBeenCalledTimes(2);
      expect(toast.showSuccess).toHaveBeenCalledWith('Синхронизация TourVisor запущена.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows fallback status line when no sync timestamp exists', () => {
    const api = component as unknown as {
      settings: { set: (value: TourvisorIntegrationSettingsResponseDto) => void };
    };

    api.settings.set({
      connected: true,
      defaultAgentId: null,
      ingestOrderTypes: [0, 1, 2, 3, 4, 5, 6],
      lastPolledAt: null,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Синхронизация не выполнялась — нажмите «Синхронизировать»',
    );
  });

  it('hides integration card for non-admin users', () => {
    fixture.destroy();
    integrationService.getSettings.mockClear();
    adminAccess = false;

    const nonAdminFixture = TestBed.createComponent(TourvisorIntegrationCardComponent);

    nonAdminFixture.detectChanges();

    expect(integrationService.getSettings).not.toHaveBeenCalled();
    expect((nonAdminFixture.nativeElement as HTMLElement).textContent).toContain(
      'Только администраторы могут управлять интеграциями.',
    );
  });

  it('shows toast error when loading agent options fails', () => {
    fixture.destroy();
    membersService.findAll.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Agent service unavailable' },
          }),
      ),
    );

    const failingFixture = TestBed.createComponent(TourvisorIntegrationCardComponent);

    failingFixture.detectChanges();

    expect(toast.showError).toHaveBeenCalledWith('Agent service unavailable');
  });
});

function createConnectedSettings(
  overrides: Partial<TourvisorIntegrationSettingsResponseDto> = {},
): TourvisorIntegrationSettingsResponseDto {
  return {
    connected: true,
    defaultAgentId: 'user-1',
    lastPolledAt: '2026-05-20T10:00:00.000Z',
    lastWebhookAt: '2026-05-20T10:05:00.000Z',
    ingestOrderTypes: [0, 1, 2, 3, 4, 5, 6],
    ...overrides,
  };
}
