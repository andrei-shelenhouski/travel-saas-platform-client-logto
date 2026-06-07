import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '@environments/environment';

import type { BookingDocumentResponseDto } from '@app/shared/models';

@Component({
  selector: 'app-document-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './document-row.html',
  styleUrl: './document-row.scss',
})
export class DocumentRowComponent {
  private readonly http = inject(HttpClient);

  readonly document = input.required<BookingDocumentResponseDto>();
  readonly delete = output<BookingDocumentResponseDto>();

  readonly downloading = signal(false);

  protected onDownload(): void {
    const doc = this.document();

    if (!doc.downloadUrl || this.downloading()) {
      return;
    }

    const url = doc.downloadUrl.startsWith('http')
      ? doc.downloadUrl
      : `${environment.baseUrl}${doc.downloadUrl}`;

    this.downloading.set(true);
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = globalThis.document.createElement('a');
        a.href = objectUrl;
        a.download = doc.filename ?? 'document';
        globalThis.document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false),
    });
  }
}
