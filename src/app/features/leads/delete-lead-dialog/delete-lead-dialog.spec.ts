import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of, throwError } from 'rxjs';

import { LeadsService } from '@app/services/leads.service';

import { DeleteLeadDialogComponent } from './delete-lead-dialog';

describe('DeleteLeadDialogComponent', () => {
  let fixture: ComponentFixture<DeleteLeadDialogComponent>;
  let component: DeleteLeadDialogComponent;
  let leadsServiceMock: { softDelete: ReturnType<typeof vi.fn> };
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let dialogData: { leadId: string; leadNumber: string; hasOffers: boolean };

  beforeEach(async () => {
    leadsServiceMock = { softDelete: vi.fn() };
    dialogRefMock = { close: vi.fn() };
    dialogData = {
      leadId: 'lead-123',
      leadNumber: 'L-042',
      hasOffers: false,
    };

    await TestBed.configureTestingModule({
      imports: [DeleteLeadDialogComponent],
      providers: [
        provideHttpClient(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: LeadsService, useValue: leadsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteLeadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render lead number in the dialog body', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('L-042');
  });

  it('should close with deleted:false when cancel is clicked', () => {
    (component as unknown as { onCancel: () => void }).onCancel();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ deleted: false });
  });

  it('should call softDelete and close with deleted:true on success', async () => {
    leadsServiceMock.softDelete.mockReturnValue(
      of({ id: 'lead-123', deletedAt: '2026-05-31T00:00:00Z' }),
    );
    (component as unknown as { onConfirm: () => void }).onConfirm();
    expect(leadsServiceMock.softDelete).toHaveBeenCalledWith('lead-123');
    expect(dialogRefMock.close).toHaveBeenCalledWith({ deleted: true, leadId: 'lead-123' });
  });

  it('should render warning banner when hasOffers is true', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DeleteLeadDialogComponent],
      providers: [
        provideHttpClient(),
        { provide: MAT_DIALOG_DATA, useValue: { ...dialogData, hasOffers: true } },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: LeadsService, useValue: leadsServiceMock },
      ],
    }).compileComponents();

    const warningFixture = TestBed.createComponent(DeleteLeadDialogComponent);
    warningFixture.detectChanges();

    const text = (warningFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('есть связанные предложения');
  });

  it('should show inline 409 error without closing the dialog', async () => {
    leadsServiceMock.softDelete.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {},
            statusText: 'Conflict',
          }),
      ),
    );

    (component as unknown as { onConfirm: () => void }).onConfirm();
    fixture.detectChanges();

    expect(dialogRefMock.close).not.toHaveBeenCalled();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('У заявки есть активное бронирование');
  });
});
