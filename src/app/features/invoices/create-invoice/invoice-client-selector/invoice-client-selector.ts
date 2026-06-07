import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { ClientResponseDto } from '@app/shared/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-client-selector',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  templateUrl: './invoice-client-selector.html',
  styleUrl: './invoice-client-selector.scss',
})
export class InvoiceClientSelectorComponent {
  /** The standalone search input control (owned by parent). */
  readonly clientSearchControl = input.required<FormControl<string>>();
  /** Autocomplete options to display. */
  readonly clientOptions = input.required<ClientResponseDto[]>();
  /** Whether the options list is loading. */
  readonly clientOptionsLoading = input<boolean>(false);
  /** Whether the hidden clientId control has been touched (for error display). */
  readonly clientIdTouched = input<boolean>(false);
  /** Whether the hidden clientId control has a `required` error. */
  readonly clientIdHasRequiredError = input<boolean>(false);
  /** Current value of the clientType control (read-only display). */
  readonly clientTypeValue = input<string>('');
  /** In edit mode the search control is disabled. */
  readonly isEditMode = input<boolean>(false);
  /** Function to format a client for display. Injected from parent to avoid coupling. */
  readonly displayFn = input.required<(client: ClientResponseDto) => string>();

  readonly optionSelected = output<MatAutocompleteSelectedEvent>();
  readonly searchBlurred = output<void>();

  protected trackByClientId(_: number, client: ClientResponseDto): string {
    return client.id;
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.optionSelected.emit(event);
  }

  protected onBlur(): void {
    this.searchBlurred.emit();
  }
}
