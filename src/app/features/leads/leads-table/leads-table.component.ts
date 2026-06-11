import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';

import { ClientTypeBadgeComponent } from '@app/features/clients/client-type-badge/client-type-badge';
import {
  DeleteLeadDialogComponent,
  DeleteLeadDialogResult,
} from '@app/features/leads/delete-lead-dialog/delete-lead-dialog';
import { LeadSourceBadgeComponent } from '@app/features/leads/lead-source-badge/lead-source-badge';
import { PermissionService } from '@app/services/permission.service';
import { StatusBadgeComponent } from '@app/shared/components/status-badge.component';

import type { LeadResponseDto } from '@app/shared/models';

const ALL_COLUMNS = [
  'number',
  'name',
  'clientType',
  'destination',
  'dates',
  'status',
  'assignedAgent',
  'createdAt',
  'updatedAt',
  'source',
  'contactEmail',
  'contactPhone',
  'actions',
] as const;

@Component({
  selector: 'app-leads-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIcon,
    MatMenuModule,
    MatTableModule,
    ClientTypeBadgeComponent,
    LeadSourceBadgeComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './leads-table.component.html',
  styleUrl: './leads-table.component.scss',
  host: { class: 'table-wrap' },
})
export class LeadsTableComponent {
  readonly leads = input.required<LeadResponseDto[]>();
  readonly omitColumns = input<string[]>([]);

  readonly leadDeleted = output<string>();

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly permissionService = inject(PermissionService);

  protected readonly canDeleteLead = computed(() => this.permissionService.canDeleteLead());

  protected readonly displayedColumns = computed<string[]>(() => {
    const omit = new Set(this.omitColumns());

    return ALL_COLUMNS.filter((col) => {
      if (omit.has(col)) {
        return false;
      }

      if (col === 'actions' && !this.canDeleteLead()) {
        return false;
      }

      return true;
    });
  });

  protected isDeleted(lead: LeadResponseDto): boolean {
    return Boolean(lead.deletedAt);
  }

  protected getTravelDatesLabel(lead: LeadResponseDto): string {
    const from = lead.departDateFrom;
    const to = lead.departDateTo;

    if (!from && !to) {
      return '—';
    }

    if (from && to) {
      return `${from} - ${to}`;
    }

    return from ?? to ?? '—';
  }

  protected navigateToLead(lead: LeadResponseDto): void {
    if (this.isDeleted(lead)) {
      return;
    }

    void this.router.navigate(['/app/leads', lead.id]);
  }

  protected openDeleteDialog(event: Event, lead: LeadResponseDto): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(DeleteLeadDialogComponent, {
      width: '480px',
      data: {
        leadId: lead.id,
        leadNumber: lead.number,
        hasOffers: (lead.offers ?? []).length > 0,
      },
    });

    dialogRef.afterClosed().subscribe((result: DeleteLeadDialogResult | undefined) => {
      if (result?.deleted) {
        this.leadDeleted.emit(lead.id);
      }
    });
  }
}
