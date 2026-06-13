import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-api-key-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Создать API-ключ</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Название ключа</mat-label>
          <input
            autocomplete="off"
            formControlName="name"
            matInput
            placeholder="Например: Основной сайт"
            type="text"
          />
          @if (form.controls.name.hasError('required') && form.controls.name.touched) {
            <mat-error>Название обязательно.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Отмена</button>
      <button color="primary" mat-flat-button type="button" (click)="submit()">Создать</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }

      mat-dialog-content {
        padding-top: 0.5rem;
      }
    `,
  ],
})
export class CreateApiKeyDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateApiKeyDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.dialogRef.close(this.form.controls.name.value.trim());
  }

  protected cancel(): void {
    this.dialogRef.close(null);
  }
}
