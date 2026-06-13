import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ApiKeyCreatedDialogData = {
  rawKey: string;
};

@Component({
  selector: 'app-api-key-created-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Ключ создан</h2>
    <mat-dialog-content>
      <p class="warning-text">
        <mat-icon class="warn-icon">warning</mat-icon>
        Скопируйте ключ сейчас. Он больше не будет показан.
      </p>
      <div class="key-display-row">
        <pre class="raw-key">{{ data.rawKey }}</pre>
        <button mat-icon-button matTooltip="Скопировать ключ" type="button" (click)="copyKey()">
          <mat-icon>content_copy</mat-icon>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        color="primary"
        mat-flat-button
        type="button"
        [disabled]="!canClose()"
        (click)="close()"
      >
        @if (!canClose()) {
          <span>Закрыть ({{ countdown() }}с)</span>
        } @else {
          <span>Закрыть</span>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning-text {
        align-items: center;
        color: #b45309;
        display: flex;
        font-size: 0.875rem;
        gap: 0.5rem;
        margin: 0 0 1rem;
      }

      .warn-icon {
        font-size: 1.25rem;
        height: 1.25rem;
        width: 1.25rem;
      }

      .key-display-row {
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
      }

      .raw-key {
        color: #0f172a;
        flex: 1;
        font-family: monospace;
        font-size: 0.875rem;
        margin: 0;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
    `,
  ],
})
export class ApiKeyCreatedDialogComponent implements OnInit {
  protected readonly data = inject<ApiKeyCreatedDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ApiKeyCreatedDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly canClose = signal(false);
  protected readonly countdown = signal(2);

  ngOnInit(): void {
    let remaining = 2;
    const interval = setInterval(() => {
      remaining -= 1;
      this.countdown.set(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        this.canClose.set(true);
      }
    }, 1000);
  }

  protected copyKey(): void {
    navigator.clipboard.writeText(this.data.rawKey).then(() => {
      this.snackBar.open('Ключ скопирован.', 'Close', { duration: 3000 });
    });
  }

  protected close(): void {
    if (!this.canClose()) {
      return;
    }

    this.dialogRef.close();
  }
}
