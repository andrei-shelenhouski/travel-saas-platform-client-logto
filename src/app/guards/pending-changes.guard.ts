import { CanDeactivateFn } from '@angular/router';

export type PendingChangesComponent = {
  hasUnsavedChanges: () => boolean;
};

export const pendingChangesGuard: CanDeactivateFn<PendingChangesComponent> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return window.confirm('You have unsaved changes. Leave this page?');
};
