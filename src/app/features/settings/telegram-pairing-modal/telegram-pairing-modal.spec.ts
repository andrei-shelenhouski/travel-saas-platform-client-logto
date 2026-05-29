import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of } from 'rxjs';

import { TelegramIntegrationService } from '@app/services/telegram-integration.service';

import { TelegramPairingModalComponent } from './telegram-pairing-modal';

describe('TelegramPairingModalComponent', () => {
  let fixture: ComponentFixture<TelegramPairingModalComponent>;
  let component: TelegramPairingModalComponent;

  const serviceMock = {
    createPairingToken: vi.fn(() =>
      of({
        token: 'NEW-TOKEN',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
    ),
    getMyPairing: vi.fn(() => of({ status: 'unpaired' })),
    disconnectMyPairing: vi.fn(() => of(undefined)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelegramPairingModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            token: {
              token: 'ABC-12345',
              expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            },
          },
        },
        {
          provide: MatDialogRef,
          useValue: { close: vi.fn() },
        },
        {
          provide: TelegramIntegrationService,
          useValue: serviceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TelegramPairingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders start command with token', () => {
    const api = component as unknown as {
      startCommand: () => string;
    };

    expect(api.startCommand()).toBe('/start ABC-12345');
  });

  it('regenerates token', () => {
    const api = component as unknown as {
      regenerateToken: () => void;
      token: () => string;
    };

    api.regenerateToken();

    expect(serviceMock.createPairingToken).toHaveBeenCalled();
    expect(api.token()).toBe('NEW-TOKEN');
  });
});
