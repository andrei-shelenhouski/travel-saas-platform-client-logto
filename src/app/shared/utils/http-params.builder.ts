import { HttpParams } from '@angular/common/http';

export class HttpParamsBuilder {
  private params = new HttpParams();

  /** Set a param only if value is not null/undefined */
  set(key: string, value: string | number | boolean | null | undefined): this {
    if (value !== null && value !== undefined) {
      this.params = this.params.set(key, String(value));
    }

    return this;
  }

  /** Append one or multiple values for the same key; skips undefined/null/empty */
  appendArray(key: string, value: string | string[] | null | undefined): this {
    if (value === null || value === undefined) {
      return this;
    }

    const values = Array.isArray(value) ? value : [value];

    for (const v of values.filter(Boolean)) {
      this.params = this.params.append(key, v);
    }

    return this;
  }

  /** Convenience: set page (1-indexed: page+1) and size */
  setPagination(page: number, size: number): this {
    return this.set('page', page + 1).set('size', size);
  }

  build(): HttpParams {
    return this.params;
  }
}
