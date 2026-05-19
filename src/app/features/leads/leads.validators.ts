import { AbstractControl, ValidationErrors } from '@angular/forms';

export function atLeastOneContactValidator(control: AbstractControl): ValidationErrors | null {
  const phone = String(control.get('contactPhone')?.value ?? '').trim();
  const email = String(control.get('contactEmail')?.value ?? '').trim();
  const telegram = String(control.get('contactTelegram')?.value ?? '').trim();

  if (phone || email || telegram) {
    return null;
  }

  return { atLeastOneContactRequired: true };
}
