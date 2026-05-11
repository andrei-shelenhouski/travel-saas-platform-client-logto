import { AbstractControl, FormArray, FormGroup, ValidationErrors } from '@angular/forms';

export function toSafeNumber(value: number | string | null | undefined): number {
  const num = Number(value);

  if (Number.isFinite(num)) {
    return num;
  }

  return 0;
}

export function dueDateAfterInvoiceDateValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!(control instanceof FormGroup)) {
    return null;
  }

  const invoiceDate = String(control.get('invoiceDate')?.value ?? '');
  const dueDate = String(control.get('dueDate')?.value ?? '');

  if (!invoiceDate || !dueDate) {
    return null;
  }

  if (dueDate >= invoiceDate) {
    return null;
  }

  return { dueDateBeforeInvoiceDate: true };
}

export function minLineItemsValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) {
    return null;
  }

  if (control.length > 0) {
    return null;
  }

  return { minItems: true };
}
