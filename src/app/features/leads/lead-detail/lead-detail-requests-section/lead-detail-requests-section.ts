import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// eslint-disable-next-line max-len
import { LeadDetailOffersSectionComponent } from '@app/features/leads/lead-detail/lead-detail-offers-section/lead-detail-offers-section';
import { MAT_BUTTONS, MAT_FORM_BUTTONS, MAT_MENU } from '@app/shared/material-imports';
import { MarkdownPipe } from '@app/shared/pipes/markdown-pipe';

import { returnDateAfterDepartDateValidator } from '../lead-detail-request.validators';

import type { OfferResponseDto, RequestResponseDto } from '@app/shared/models';

export type CreateRequestPayload = {
  destination: string | undefined;
  departDate: string | undefined;
  returnDate: string | undefined;
  adults: number | undefined;
  children: number | undefined;
  notes: string | undefined;
  managerId: string | undefined;
};

export type UpdateRequestPayload = CreateRequestPayload & { requestId: string };

export type AgentOption = { id: string; userId: string; name: string };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lead-detail-requests-section',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    ...MAT_BUTTONS,
    ...MAT_FORM_BUTTONS,
    ...MAT_MENU,
    LeadDetailOffersSectionComponent,
    MarkdownPipe,
  ],
  templateUrl: './lead-detail-requests-section.html',
  styleUrl: './lead-detail-requests-section.scss',
})
export class LeadDetailRequestsSectionComponent {
  private readonly fb = inject(FormBuilder);

  readonly requests = input<RequestResponseDto[]>([]);
  readonly offersByRequest = input<Map<string, OfferResponseDto[]>>(new Map());
  readonly filteredAgents = input<AgentOption[]>([]);
  readonly showAddButton = input<boolean>(true);
  readonly savingRequest = input<boolean>(false);
  readonly updatingRequest = input<boolean>(false);
  readonly deletingRequestId = input<string | null>(null);
  readonly canCreateOffer = input<boolean>(false);

  readonly requestCreated = output<CreateRequestPayload>();
  readonly requestUpdated = output<UpdateRequestPayload>();
  readonly requestDeleted = output<{ requestId: string; index: number }>();
  readonly createOfferClicked = output<string>();

  protected readonly showAddRequestForm = signal(false);
  protected readonly editingRequestId = signal<string | null>(null);
  protected readonly expandedNotesRequestId = signal<string | null>(null);

  protected readonly addRequestForm = this.fb.group(
    {
      destination: this.fb.control<string>('', { validators: [Validators.required] }),
      departDate: this.fb.control<string>(''),
      returnDate: this.fb.control<string>(''),
      adults: this.fb.control<number | null>(1, { validators: [Validators.min(0)] }),
      children: this.fb.control<number | null>(0, { validators: [Validators.min(0)] }),
      notes: this.fb.control<string>(''),
      managerId: this.fb.control<string>(''),
    },
    { validators: [returnDateAfterDepartDateValidator()] },
  );

  protected readonly editRequestForm = this.fb.group(
    {
      destination: this.fb.control<string>('', { validators: [Validators.required] }),
      departDate: this.fb.control<string>(''),
      returnDate: this.fb.control<string>(''),
      adults: this.fb.control<number | null>(1, { validators: [Validators.min(0)] }),
      children: this.fb.control<number | null>(0, { validators: [Validators.min(0)] }),
      notes: this.fb.control<string>(''),
      managerId: this.fb.control<string>(''),
    },
    { validators: [returnDateAfterDepartDateValidator()] },
  );

  protected readonly hasRequests = computed(() => this.requests().length > 0);

  protected toggleAddRequestForm(): void {
    this.showAddRequestForm.update((value) => !value);

    if (!this.showAddRequestForm()) {
      this.resetAddForm();
    }
  }

  protected submitAddRequest(): void {
    if (this.savingRequest()) {
      return;
    }

    if (this.addRequestForm.invalid) {
      this.addRequestForm.markAllAsTouched();

      return;
    }

    const value = this.addRequestForm.getRawValue();

    this.requestCreated.emit({
      destination: this.normalizeText(value.destination),
      departDate: this.normalizeText(value.departDate),
      returnDate: this.normalizeText(value.returnDate),
      adults: value.adults ?? undefined,
      children: value.children ?? undefined,
      notes: this.normalizeText(value.notes),
      managerId: this.normalizeText(value.managerId),
    });
  }

  protected cancelAddRequest(): void {
    this.showAddRequestForm.set(false);
    this.resetAddForm();
  }

  protected startEditRequest(request: RequestResponseDto): void {
    this.editingRequestId.set(request.id);
    this.editRequestForm.reset({
      destination: request.destination ?? '',
      departDate: this.asDateInputValue(request.departDate),
      returnDate: this.asDateInputValue(request.returnDate),
      adults: request.adults ?? 1,
      children: request.children ?? 0,
      notes: request.notes ?? '',
      managerId: request.managerId ?? '',
    });
  }

  protected cancelEditRequest(): void {
    this.editingRequestId.set(null);
  }

  protected submitEditRequest(requestId: string): void {
    if (this.updatingRequest()) {
      return;
    }

    if (this.editRequestForm.invalid) {
      this.editRequestForm.markAllAsTouched();

      return;
    }

    const value = this.editRequestForm.getRawValue();

    this.requestUpdated.emit({
      requestId,
      destination: this.normalizeText(value.destination),
      departDate: this.normalizeText(value.departDate),
      returnDate: this.normalizeText(value.returnDate),
      adults: value.adults ?? undefined,
      children: value.children ?? undefined,
      notes: this.normalizeText(value.notes),
      managerId: this.normalizeText(value.managerId),
    });
  }

  protected confirmDeleteRequest(request: RequestResponseDto, index: number): void {
    if (!this.canDeleteRequest(request) || this.deletingRequestId()) {
      return;
    }

    const confirmed = confirm(
      `Вы уверены, что хотите удалить ${this.getRequestIdentifier(request, index)}?`,
    );

    if (!confirmed) {
      return;
    }

    this.requestDeleted.emit({ requestId: request.id, index });
  }

  protected canDeleteRequest(request: RequestResponseDto): boolean {
    return (request.offersCount ?? 0) === 0;
  }

  protected canCreateOfferForRequest(status: string | null | undefined): boolean {
    return status !== 'CLOSED' && this.canCreateOffer();
  }

  protected getRequestIdentifier(request: RequestResponseDto, index: number): string {
    return `TR-${index + 1}`;
  }

  protected getOffersForRequest(requestId: string): OfferResponseDto[] {
    return this.offersByRequest().get(requestId) ?? [];
  }

  protected isEditingRequest(requestId: string): boolean {
    return this.editingRequestId() === requestId;
  }

  protected toggleNotesExpanded(requestId: string): void {
    const current = this.expandedNotesRequestId();

    this.expandedNotesRequestId.set(current === requestId ? null : requestId);
  }

  protected isNotesExpanded(requestId: string): boolean {
    return this.expandedNotesRequestId() === requestId;
  }

  protected canShowDateRangeError(formName: 'add' | 'edit'): boolean {
    const form = formName === 'add' ? this.addRequestForm : this.editRequestForm;

    if (!form.hasError('invalidReturnDateRange')) {
      return false;
    }

    const returnDateControl = form.get('returnDate');

    return Boolean(returnDateControl?.dirty || returnDateControl?.touched);
  }

  protected getRequestStatusClass(status: string | null | undefined): string {
    if (status === 'OPEN') {
      return 'request-status-open';
    }

    if (status === 'QUOTED') {
      return 'request-status-quoted';
    }

    if (status === 'CLOSED') {
      return 'request-status-closed';
    }

    return 'request-status-default';
  }

  protected getRequestStatusLabel(status: string | null | undefined): string {
    if (status === 'OPEN') {
      return 'Открыт';
    }

    if (status === 'QUOTED') {
      return 'Оценён';
    }

    if (status === 'CLOSED') {
      return 'Закрыт';
    }

    return status ?? 'Неизвестно';
  }

  protected formatDateRange(
    from: string | null | undefined,
    to: string | null | undefined,
  ): string {
    const fromText = this.formatDateShort(from ?? null);
    const toText = this.formatDateShort(to ?? null);

    if (fromText === '—' && toText === '—') {
      return '—';
    }

    if (fromText !== '—' && toText !== '—') {
      return `${fromText} - ${toText}`;
    }

    return fromText === '—' ? toText : fromText;
  }

  protected formatDateShort(iso: string | null): string {
    if (!iso) {
      return '—';
    }

    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
      return iso;
    }
  }

  /** Called by parent after a successful create to reset the form. */
  resetAfterCreate(): void {
    this.showAddRequestForm.set(false);
    this.resetAddForm();
  }

  /** Called by parent after a successful edit to collapse the editor. */
  resetAfterEdit(): void {
    this.editingRequestId.set(null);
  }

  /** Full reset called by parent when the lead data reloads. */
  resetState(): void {
    this.showAddRequestForm.set(false);
    this.editingRequestId.set(null);
    this.resetAddForm();
    this.editRequestForm.reset({
      destination: '',
      departDate: '',
      returnDate: '',
      adults: 1,
      children: 0,
      notes: '',
      managerId: '',
    });
  }

  private resetAddForm(): void {
    this.addRequestForm.reset({
      destination: '',
      departDate: '',
      returnDate: '',
      adults: 1,
      children: 0,
      notes: '',
      managerId: '',
    });
  }

  private asDateInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private normalizeText(value: string | null | undefined): string | undefined {
    const trimmed = value?.trim();

    return trimmed || undefined;
  }
}
