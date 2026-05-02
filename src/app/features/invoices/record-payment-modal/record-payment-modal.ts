import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvoicesService } from '@app/services/invoices.service';
import { MAT_BUTTONS, MAT_DIALOG, MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { PaymentMethod, RecordPaymentRequestDto } from '@app/shared/models';

type RecordPaymentModalFieldErrorMap = Record<string, string | string[]>;

export type RecordPaymentModalData = {
  invoiceId: string;
  invoiceNumber: string;
  currency: string;
  outstandingAmount: number;
};

export type RecordPaymentModalResult = {
  refresh: true;
};

const PAYMENT_METHOD_OPTIONS: readonly PaymentMethod[] = ['BANK_TRANSFER', 'CASH', 'CARD', 'OTHER'];

@Component({
  selector: 'app-record-payment-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ...MAT_DIALOG,
    ...MAT_FORM_BUTTONS,
    ...MAT_BUTTONS,
  ],
  templateUrl: './record-payment-modal.html',
  styleUrl: './record-payment-modal.scss',
})
export class RecordPaymentModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly invoicesService = inject(InvoicesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(
    MatDialogRef<RecordPaymentModalComponent, RecordPaymentModalResult>,
  );

  protected readonly data = inject<RecordPaymentModalData>(MAT_DIALOG_DATA);
  protected readonly today = this.createTodayDate();
  protected readonly loading = signal(false);

  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  protected readonly outstandingAmount = computed(() =>
    this.normalizeAmount(this.data.outstandingAmount),
  );

  protected readonly form = this.fb.nonNullable.group({
    amount: this.fb.nonNullable.control(this.outstandingAmount(), {
      validators: [
        Validators.required,
        Validators.min(0.01),
        this.amountPrecisionValidator.bind(this),
      ],
    }),
    paymentDate: this.fb.control<Date | null>(this.today, {
      validators: [Validators.required, this.paymentDateValidator.bind(this)],
    }),
    paymentMethod: this.fb.nonNullable.control<PaymentMethod>('BANK_TRANSFER', {
      validators: [Validators.required],
    }),
    reference: this.fb.nonNullable.control(''),
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const formValue = this.form.getRawValue();
    const request: RecordPaymentRequestDto = {
      amount: formValue.amount,
      currency: this.data.currency,
      paymentDate: this.formatDate(formValue.paymentDate),
      paymentMethod: formValue.paymentMethod,
      reference: formValue.reference.trim() || undefined,
    };

    this.loading.set(true);
    this.invoicesService.recordPayment(this.data.invoiceId, request).subscribe({
      next: () => {
        this.dialogRef.close({ refresh: true });

        const message =
          request.amount >= this.outstandingAmount()
            ? $localize`:@@recordPaymentModalInvoiceFullyPaidSuccess:Invoice fully paid.`
            : $localize`:@@recordPaymentModalPaymentRecordedSuccess:Payment recorded. Invoice updated.`;

        this.snackBar.open(message, 'OK', { duration: 4000 });
      },
      error: (errorResponse: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(this.resolveErrorMessage(errorResponse), 'OK', { duration: 5000 });
      },
    });
  }

  private amountPrecisionValidator(control: AbstractControl<number>): ValidationErrors | null {
    const value = control.value;
    const hasMaxTwoDecimals =
      Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

    if (hasMaxTwoDecimals) {
      return null;
    }

    return { decimalPlaces: true };
  }

  private paymentDateValidator(control: AbstractControl<Date | null>): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const selectedDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());

    if (selectedDate.getTime() > this.today.getTime()) {
      return { futureDate: true };
    }

    return null;
  }

  private createTodayDate(): Date {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private formatDate(value: Date | null): string {
    if (!value) {
      return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private normalizeAmount(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.round(value * 100) / 100;
  }

  private resolveErrorMessage(errorResponse: HttpErrorResponse): string {
    const fieldErrors = errorResponse.error?.fieldErrors;

    if (this.isFieldErrorMap(fieldErrors)) {
      const fieldMessages = Object.values(fieldErrors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);

      if (fieldMessages.length > 0) {
        return fieldMessages.join('; ');
      }
    }

    return (
      errorResponse.error?.message ??
      errorResponse.message ??
      $localize`:@@recordPaymentModalRecordPaymentError:Failed to record payment.`
    );
  }

  private isFieldErrorMap(value: unknown): value is RecordPaymentModalFieldErrorMap {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Object.values(value).every(
      (entry) =>
        typeof entry === 'string' ||
        (Array.isArray(entry) && entry.every((item) => typeof item === 'string')),
    );
  }
}
