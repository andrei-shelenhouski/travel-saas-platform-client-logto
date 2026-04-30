import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OffersService } from '@app/services/offers.service';

import { OfferPdfPreviewModalComponent } from './offer-pdf-preview-modal';

describe('OfferPdfPreviewModalComponent', () => {
  let fixture: ComponentFixture<OfferPdfPreviewModalComponent>;

  const offersServiceMock = {
    getPdf: vi.fn(() => of(new Blob(['pdf'], { type: 'application/pdf' }))),
  };

  const dialogRefMock = {
    close: vi.fn(),
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    if (!('createObjectURL' in URL)) {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    if (!('revokeObjectURL' in URL)) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: vi.fn(),
        writable: true,
      });
    }

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:offer-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [OfferPdfPreviewModalComponent],
      providers: [
        { provide: OffersService, useValue: offersServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            offerId: 'offer-1',
            offerNumber: 'OF-100',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferPdfPreviewModalComponent);
    fixture.detectChanges();
  });

  it('loads pdf blob on init', () => {
    expect(offersServiceMock.getPdf).toHaveBeenCalledWith('offer-1');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('renders error state when pdf request fails', async () => {
    offersServiceMock.getPdf.mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture = TestBed.createComponent(OfferPdfPreviewModalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent as string).toContain(
      'Unable to load PDF. Please try again.',
    );
  });

  it('revokes blob url on destroy', () => {
    fixture.destroy();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:offer-preview');
  });
});
