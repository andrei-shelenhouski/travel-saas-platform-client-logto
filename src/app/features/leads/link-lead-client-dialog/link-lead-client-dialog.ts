import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { LeadResponseDto } from '@app/shared/models';

export type LinkLeadClientDialogData = {
  leadId: string;
  initialClientId: string | null;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-link-lead-client-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    ...MAT_FORM_BUTTONS,
  ],
  templateUrl: './link-lead-client-dialog.html',
  styleUrl: './link-lead-client-dialog.scss',
})
export class LinkLeadClientDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly leadsService = inject(LeadsService);
  private readonly dialogRef = inject(MatDialogRef<LinkLeadClientDialogComponent, LeadResponseDto>);
  protected readonly data = inject<LinkLeadClientDialogData>(MAT_DIALOG_DATA);

  protected readonly search = this.fb.nonNullable.control('');
  protected readonly options = signal<
    { id: string; fullName: string | null; phone: string | null; email: string | null }[]
  >([]);
  protected readonly selectedClientId = signal<string>('');
  protected readonly loadingOptions = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();

          if (trimmed.length < 2) {
            this.options.set([]);

            return of([]);
          }

          this.loadingOptions.set(true);

          return this.clientsService.getList({ search: trimmed, limit: 10 }).pipe(
            finalize(() => {
              this.loadingOptions.set(false);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        const items = Array.isArray(result) ? [] : result.items;

        this.options.set(items);
      });
  }

  protected onSelected(event: MatAutocompleteSelectedEvent): void {
    const client = event.option.value as {
      id: string;
      fullName: string | null;
    };

    this.selectedClientId.set(client.id);
    this.search.setValue(client.fullName ?? '', { emitEvent: false });
    this.errorMessage.set('');
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    const clientId = this.selectedClientId();

    if (!clientId || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.leadsService.linkClient(this.data.leadId, { clientId }).subscribe({
      next: (lead) => {
        this.dialogRef.close(lead);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveErrorMessage(error));
        this.submitting.set(false);
      },
      complete: () => {
        this.submitting.set(false);
      },
    });
  }

  protected displayClientLabel(option: { fullName: string | null } | string | null): string {
    if (!option) {
      return '';
    }

    if (typeof option === 'string') {
      return option;
    }

    return option.fullName ?? '';
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? error.message ?? 'Failed to link client';
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as { message?: string }).message ?? 'Failed to link client';
    }

    return 'Failed to link client';
  }
}
