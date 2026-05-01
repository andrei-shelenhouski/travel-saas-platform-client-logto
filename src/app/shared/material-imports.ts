import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';

/** Shared Angular Material modules for outline form fields and buttons. */
export const MAT_FORM_BUTTONS = [
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
] as const;

/** Material buttons only (toolbars, lists, dialogs without form fields). */
export const MAT_BUTTONS = [MatButtonModule] as const;

/** Segmented controls / filter tabs on list views. */
export const MAT_BUTTON_TOGGLES = [MatButtonToggleModule] as const;

/** Material dialogs. */
export const MAT_DIALOG = [MatDialogModule] as const;

/** Material icons only. */
export const MAT_ICONS = [MatIconModule] as const;

/** Material autocomplete with form controls. */
export const MAT_AUTOCOMPLETE = [MatAutocompleteModule] as const;

/** Sidebar / app shell navigation list with icons. */
export const MAT_NAV_LIST = [MatListModule, MatIconModule] as const;

/** Dropdown menus (e.g. organization switcher). */
export const MAT_MENU = [MatMenuModule, MatDividerModule] as const;
