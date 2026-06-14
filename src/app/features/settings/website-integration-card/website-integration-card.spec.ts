import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { IntegrationApiKeysService } from '@app/services/integration-api-keys.service';
import { PermissionService } from '@app/services/permission.service';
import { ConfirmDialogService } from '@app/shared/services/confirm-dialog.service';

import { WebsiteIntegrationCardComponent } from './website-integration-card';

import type { IntegrationApiKeyResponseDto } from '@app/shared/models/organization.model';

function makeKey(
  overrides: Partial<IntegrationApiKeyResponseDto> = {},
): IntegrationApiKeyResponseDto {
  return {
    id: 'key-1',
    name: 'Test Key',
    keyPrefix: 'nv_test',
    widgetConfig: null,
    lastUsedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    revokedAt: null,
    ...overrides,
  };
}

describe('WebsiteIntegrationCardComponent', () => {
  let fixture: ComponentFixture<WebsiteIntegrationCardComponent>;
  let component: WebsiteIntegrationCardComponent;

  let apiKeysService: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };

  let dialog: { open: ReturnType<typeof vi.fn> };
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let confirmDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiKeysService = {
      list: vi.fn(() => of([makeKey()])),
      create: vi.fn(() =>
        of({
          id: 'key-new',
          name: 'New Key',
          keyPrefix: 'nv_new',
          rawKey: 'raw-secret',
          widgetConfig: null,
          lastUsedAt: null,
          createdAt: '2026-01-01T00:00:00Z',
        }),
      ),
      update: vi.fn((id: string, dto: object) => of({ ...makeKey(), ...dto, id })),
      revoke: vi.fn(() => of(undefined)),
    };

    dialog = { open: vi.fn(() => ({ afterClosed: () => of(null) })) };
    snackBar = { open: vi.fn() };
    confirmDialog = { open: vi.fn(() => of(false)) };

    await TestBed.configureTestingModule({
      imports: [WebsiteIntegrationCardComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: IntegrationApiKeysService, useValue: apiKeysService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        {
          provide: PermissionService,
          useValue: { canUpdateSettings: () => true, canManageIntegrations: () => true },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WebsiteIntegrationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and loads keys on init', () => {
    expect(apiKeysService.list).toHaveBeenCalled();
    expect(
      (component as unknown as { keys: () => IntegrationApiKeyResponseDto[] }).keys(),
    ).toHaveLength(1);
  });

  it('keyDisplayPrefix returns prefix with mask', () => {
    const api = component as unknown as {
      keyDisplayPrefix: (key: IntegrationApiKeyResponseDto) => string;
    };
    expect(api.keyDisplayPrefix(makeKey())).toBe('nv_test••••');
  });

  it('formatDate returns em dash for null', () => {
    const api = component as unknown as { formatDate: (v: string | null | undefined) => string };
    expect(api.formatDate(null)).toBe('—');
    expect(api.formatDate(undefined)).toBe('—');
  });

  it('formatDate returns formatted date for ISO string', () => {
    const api = component as unknown as { formatDate: (v: string) => string };
    const result = api.formatDate('2026-01-15T00:00:00Z');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  it('startRename sets renamingKeyId and renameValue', () => {
    const api = component as unknown as {
      startRename: (key: IntegrationApiKeyResponseDto) => void;
      renamingKeyId: () => string | null;
      renameValue: () => string;
    };
    api.startRename(makeKey());
    expect(api.renamingKeyId()).toBe('key-1');
    expect(api.renameValue()).toBe('Test Key');
  });

  it('cancelRename clears renaming state', () => {
    const api = component as unknown as {
      startRename: (key: IntegrationApiKeyResponseDto) => void;
      cancelRename: () => void;
      renamingKeyId: () => string | null;
    };
    api.startRename(makeKey());
    api.cancelRename();
    expect(api.renamingKeyId()).toBeNull();
  });

  it('saveRename calls update and clears renaming state', () => {
    const api = component as unknown as {
      startRename: (key: IntegrationApiKeyResponseDto) => void;
      saveRename: (key: IntegrationApiKeyResponseDto) => void;
      renamingKeyId: () => string | null;
      renameValue: { set: (v: string) => void };
    };
    api.startRename(makeKey());
    api.renameValue.set('New Name');
    api.saveRename(makeKey());
    expect(apiKeysService.update).toHaveBeenCalledWith('key-1', { name: 'New Name' });
    expect(api.renamingKeyId()).toBeNull();
  });

  it('toggleWidgetPanel opens and collapses panel', () => {
    const api = component as unknown as {
      toggleWidgetPanel: (key: IntegrationApiKeyResponseDto) => void;
      expandedKeyId: () => string | null;
    };
    api.toggleWidgetPanel(makeKey());
    expect(api.expandedKeyId()).toBe('key-1');
    api.toggleWidgetPanel(makeKey());
    expect(api.expandedKeyId()).toBeNull();
  });

  it('saveWidgetConfig rejects when both phone and email are hidden', () => {
    const api = component as unknown as {
      toggleWidgetPanel: (key: IntegrationApiKeyResponseDto) => void;
      widgetForm: {
        controls: {
          fields: {
            controls: {
              phone: { controls: { visible: { setValue: (v: boolean) => void } } };
              email: { controls: { visible: { setValue: (v: boolean) => void } } };
            };
          };
        };
      };
      saveWidgetConfig: (key: IntegrationApiKeyResponseDto) => void;
    };
    api.toggleWidgetPanel(makeKey());
    api.widgetForm.controls.fields.controls.phone.controls.visible.setValue(false);
    api.widgetForm.controls.fields.controls.email.controls.visible.setValue(false);
    api.saveWidgetConfig(makeKey());
    expect(snackBar.open).toHaveBeenCalledWith('Телефон или Email должен быть видимым.', 'Close', {
      duration: 4000,
    });
    expect(apiKeysService.update).not.toHaveBeenCalled();
  });

  it('confirmRevoke calls dialog and revokes key on confirmation', () => {
    confirmDialog.open.mockReturnValue(of(true));
    const api = component as unknown as {
      confirmRevoke: (key: IntegrationApiKeyResponseDto) => void;
      keys: () => IntegrationApiKeyResponseDto[];
    };
    api.confirmRevoke(makeKey());
    expect(apiKeysService.revoke).toHaveBeenCalledWith('key-1');
    expect(api.keys()).toHaveLength(0);
  });

  it('confirmRevoke does not revoke when cancelled', () => {
    confirmDialog.open.mockReturnValue(of(false));
    const api = component as unknown as {
      confirmRevoke: (key: IntegrationApiKeyResponseDto) => void;
    };
    api.confirmRevoke(makeKey());
    expect(apiKeysService.revoke).not.toHaveBeenCalled();
  });
});
