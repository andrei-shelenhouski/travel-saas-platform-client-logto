import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function resolveMessage(err: HttpErrorResponse): string {
  const msg = err.error?.message ?? err.message;

  return msg && String(msg).trim() ? String(msg) : GENERIC_ERROR;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorHandlerService {
  private readonly snackBar = inject(MatSnackBar);

  catch<T>(customMessage?: string): MonoTypeOperatorFunction<T> {
    return catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      const { status } = err;

      // 5xx / network errors handled globally by errorHandlerInterceptor (ToastService)
      if (!status || status === 0 || status >= 500) {
        return throwError(() => err);
      }

      // 401 is redirected by the interceptor
      if (status === 401) {
        return throwError(() => err);
      }

      const message = customMessage ?? resolveMessage(err);

      this.snackBar.open(message, 'Close', { duration: 5000 });

      return throwError(() => err);
    });
  }
}
