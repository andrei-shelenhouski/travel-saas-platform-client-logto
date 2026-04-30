import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn } from '@angular/router';

import { map } from 'rxjs';

import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
} from '@app/shared/components/confirm-dialog.component';

export type PendingChangesComponent = {
  hasUnsavedChanges: () => boolean;
};

export const pendingChangesGuard: CanDeactivateFn<PendingChangesComponent> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const dialog = inject(MatDialog);

  return dialog
    .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave this page?',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
      },
    })
    .afterClosed()
    .pipe(map((result) => result === true));
};
