import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { PermissionService } from '@app/services/permission.service';

import { LeadsTableComponent } from './leads-table.component';

import type { LeadResponseDto } from '@app/shared/models';

describe('LeadsTableComponent', () => {
  let component: LeadsTableComponent;
  let fixture: ComponentFixture<LeadsTableComponent>;
  let router: Router;
  let canDeleteLead = false;

  const lead = {
    id: 'lead-1',
    number: 'LD-001',
    clientName: 'Client',
    status: 'NEW',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as LeadResponseDto;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsTableComponent],
      providers: [
        provideRouter([]),
        {
          provide: PermissionService,
          useValue: {
            canDeleteLead: vi.fn(() => canDeleteLead),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn(() => ({ afterClosed: () => of(undefined) })),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LeadsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('leads', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide actions column when delete permission is unavailable', () => {
    canDeleteLead = false;
    fixture.componentRef.setInput('leads', [lead]);
    fixture.detectChanges();

    const displayed = component['displayedColumns']();

    expect(displayed).not.toContain('actions');
  });

  it('should navigate to lead details on row click when lead is active', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('leads', [lead]);
    fixture.detectChanges();

    const tableRow = fixture.nativeElement.querySelector('.table-row') as HTMLElement;

    tableRow.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/app/leads', 'lead-1']);
  });

  it('should not navigate when lead is deleted', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const deletedLead = {
      ...lead,
      id: 'lead-2',
      deletedAt: '2026-01-03T00:00:00.000Z',
    } as LeadResponseDto;

    fixture.componentRef.setInput('leads', [deletedLead]);
    fixture.detectChanges();

    const tableRow = fixture.nativeElement.querySelector('.table-row') as HTMLElement;

    tableRow.click();

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
