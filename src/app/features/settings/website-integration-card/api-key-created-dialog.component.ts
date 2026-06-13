import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ApiKeyCreatedDialogData = {
  rawKey: string;
};

@Component({
  selector: 'app-api-key-created-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './api-key-created-dialog.component.html',
  styleUrl: './api-key-created-dialog.component.scss',
})
export class ApiKeyCreatedDialogComponent implements OnInit {
  protected readonly data = inject<ApiKeyCreatedDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ApiKeyCreatedDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

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

    this.destroyRef.onDestroy(() => clearInterval(interval));
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
