import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function returnDateAfterDepartDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const departDate = String(control.get('departDate')?.value ?? '').trim();
    const returnDate = String(control.get('returnDate')?.value ?? '').trim();

    if (!departDate || !returnDate) {
      return null;
    }

    if (returnDate >= departDate) {
      return null;
    }

    return { invalidReturnDateRange: true };
  };
}
