import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MAT_FORM_BUTTONS, MAT_ICONS } from '@app/shared/material-imports';

type InvoiceLineItemFormGroup = FormGroup<{
  sortOrder: FormControl<number>;
  description: FormControl<string>;
  serviceDateFrom: FormControl<string>;
  serviceDateTo: FormControl<string>;
  travelers: FormControl<string>;
  unitPrice: FormControl<number | null>;
  quantity: FormControl<number>;
  total: FormControl<number>;
  tourCost: FormControl<number | null>;
  commissionPct: FormControl<number | null>;
  commissionAmount: FormControl<number | null>;
  netToPay: FormControl<number>;
  commissionVat: FormControl<number>;
}>;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invoice-line-items-form',
  imports: [DragDropModule, ReactiveFormsModule, ...MAT_FORM_BUTTONS, ...MAT_ICONS],
  templateUrl: './invoice-line-items-form.html',
})
export class InvoiceLineItemsFormComponent {
  /** The FormArray owned by the parent — mutations go directly through the shared reference. */
  readonly lineItemsArray = input.required<FormArray<InvoiceLineItemFormGroup>>();
  /** Whether the invoice is in B2B-agent mode (controls which price fields are shown). */
  readonly isB2bMode = input<boolean>(false);

  /** Emitted when user clicks "Add line item". */
  readonly addItem = output<void>();
  /** Emitted with the row index when user clicks "Remove". */
  readonly removeItem = output<number>();
  /** Emitted with the CDK drop event when user reorders rows. */
  readonly dropItem = output<CdkDragDrop<InvoiceLineItemFormGroup[]>>();
  /** Emitted with row index after standard (non-B2B) price input changes. */
  readonly standardItemInput = output<number>();
  /** Emitted with row index after B2B commission % input changes. */
  readonly b2bCommissionPctInput = output<number>();
  /** Emitted with row index after B2B commission amount input changes. */
  readonly b2bCommissionAmountInput = output<number>();
  /** Emitted with row index after B2B tour cost input changes. */
  readonly b2bTourCostInput = output<number>();
}
