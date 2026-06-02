import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { map, Observable } from 'rxjs';

import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog.component';

import type { ConfirmDialogData } from '@app/shared/components/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
