import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';
import { MeService } from '@app/services/me.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { PermissionService } from '@app/services/permission.service';
import { PageContentComponent } from '@app/shared/components';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import {
  ClientResponseDto,
  ContactResponseDto,
  CreateLeadDto,
  LeadResponseDto,
  OrgRole,
} from '@app/shared/models';
import { formatClientSearchLabel } from '@app/shared/utils/client-display';

import { atLeastOneContactValidator } from '../leads.validators';

type CreateLeadForm = FormGroup<{
  clientId: FormControl<string>;
  clientName: FormControl<string>;
  contactEmail: FormControl<string>;
  contactPhone: FormControl<string>;
  contactTelegram: FormControl<string>;
  destination: FormControl<string>;
  departDateFrom: FormControl<string>;
  departDateTo: FormControl<string>;
  returnDateFrom: FormControl<string>;
  returnDateTo: FormControl<string>;
  adults: FormControl<number>;
  children: FormControl<number>;
  notes: FormControl<string>;
  assignedAgentId: FormControl<string>;
}>;

type AgentOption = {
  id: string;
  name: string;
};

type FieldErrorMap = Record<string, string>;

const SALES_ROLES = new Set<OrgRole>([OrgRole.AGENT, OrgRole.SALES_AGENT, OrgRole.ADMIN]);

function trimmedRequired(control: AbstractControl): ValidationErrors | null {
  const s = typeof control.value === 'string' ? control.value.trim() : '';

  return s ? null : { required: true };
}

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as CreateLeadForm;
  const departFrom = group.controls.departDateFrom.value;
  const departTo = group.controls.departDateTo.value;
  const returnFrom = group.controls.returnDateFrom.value;

  if (departFrom && departTo && departTo < departFrom) {
    return { departDateRangeInvalid: true };
  }

  if (departFrom && returnFrom && returnFrom < departFrom) {
    return { returnBeforeDepart: true };
  }

  return null;
}

function isFieldErrorMap(value: unknown): value is FieldErrorMap {
  return typeof value === 'object' && value !== null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-lead',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ...MAT_FORM_BUTTONS,
    PageHeading,
    PageHeadingAction,
    PageContentComponent,
  ],
  templateUrl: './create-lead.html',
  styleUrl: './create-lead.scss',
})
export class CreateLeadComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clientsService = inject(ClientsService);
  private readonly leadsService = inject(LeadsService);
  private readonly membersService = inject(OrganizationMembersService);
  private readonly meService = inject(MeService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly form: CreateLeadForm = this.fb.nonNullable.group(
    {
      clientId: [''],
      clientName: ['', trimmedRequired],
      contactEmail: ['', Validators.email],
      contactPhone: ['', Validators.pattern(/^\+?\d{10,15}$/)],
      contactTelegram: ['', Validators.maxLength(60)],
      destination: ['', trimmedRequired],
      departDateFrom: [''],
      departDateTo: [''],
      returnDateFrom: [''],
      returnDateTo: [''],
      adults: [2, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      assignedAgentId: [''],
    },
    {
      validators: [atLeastOneContactValidator, dateRangeValidator],
    },
  );
  protected readonly clientSearch = this.fb.nonNullable.control('');
  protected readonly clientOptions = signal<ClientResponseDto[]>([]);
  protected readonly loadingClients = signal(false);
  protected readonly noClientsFound = signal(false);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly serverFieldErrors = signal<FieldErrorMap>({});

  protected readonly isNewClientMode = signal(false);
  protected readonly selectedClient = signal<ClientResponseDto | null>(null);
  protected readonly contactLocked = signal(false);
  protected readonly clientContacts = signal<ContactResponseDto[]>([]);
  protected readonly selectedContactPersonId = signal<string>('');

  protected readonly showAssignAgent = computed(() => this.permissionService.canAssignLead());
  protected readonly showContactPersonPicker = computed(() => {
    const client = this.selectedClient();

    return (
      !this.isNewClientMode() &&
      client !== null &&
      (client.type === 'COMPANY' || client.type === 'B2B_AGENT') &&
      this.clientContacts().length > 0
    );
  });
  protected readonly selfUserId = computed(() => this.meService.getMeData()?.id ?? '');
  protected readonly agentOptions = signal<AgentOption[]>([]);

  constructor() {
    this.loadMeIfNeeded();
    this.syncClientSearch();
    this.loadAssignableAgents();

    effect(() => {
      const userId = this.selfUserId();

      if (!this.form.controls.assignedAgentId.value && userId) {
        this.form.controls.assignedAgentId.setValue(userId, { emitEvent: false });
      }
    });
  }

  protected clientDisplayFn(client: ClientResponseDto | string | null): string {
    if (!client) {
      return '';
    }

    if (typeof client === 'string') {
      return client;
    }

    return formatClientSearchLabel(client);
  }

  protected onAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value as ClientResponseDto | 'create-new';

    if (value === 'create-new') {
      this.enableNewClientMode();

      return;
    }

    this.selectClient(value);
  }

  protected enableNewClientMode(): void {
    this.clientOptions.set([]);
    this.noClientsFound.set(false);
    this.selectedClient.set(null);
    this.contactLocked.set(false);
    this.clientContacts.set([]);
    this.selectedContactPersonId.set('');
    this.isNewClientMode.set(true);

    this.clientSearch.setValue('', { emitEvent: false });
    this.form.controls.clientId.setValue('');
    this.form.controls.clientName.enable({ emitEvent: false });
    this.form.controls.contactPhone.enable({ emitEvent: false });
    this.form.controls.contactEmail.enable({ emitEvent: false });
    this.form.controls.contactTelegram.enable({ emitEvent: false });
  }

  protected disableNewClientMode(): void {
    this.isNewClientMode.set(false);
  }

  protected unlockContactEditing(): void {
    this.contactLocked.set(false);
    this.form.controls.clientName.enable({ emitEvent: false });
    this.form.controls.contactPhone.enable({ emitEvent: false });
    this.form.controls.contactEmail.enable({ emitEvent: false });
    this.form.controls.contactTelegram.enable({ emitEvent: false });
  }

  protected showContactGroupError(): boolean {
    return (
      this.form.hasError('atLeastOneContactRequired') &&
      (this.form.controls.contactPhone.touched ||
        this.form.controls.contactEmail.touched ||
        this.form.controls.contactTelegram.touched)
    );
  }

  protected hasServerError(controlName: keyof CreateLeadForm['controls']): boolean {
    const control = this.form.controls[controlName];

    return control.hasError('server') && !!this.serverFieldErrors()[controlName];
  }

  protected serverErrorText(controlName: keyof CreateLeadForm['controls']): string {
    return this.serverFieldErrors()[controlName] ?? '';
  }

  protected onSubmit(): void {
    this.error.set('');
    this.clearServerErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const values = this.form.getRawValue();
    const clientId = this.selectedClient()?.id ?? '';
    const dto: CreateLeadDto = {
      clientType: 'INDIVIDUAL',
      clientName: values.clientName.trim(),
      destination: values.destination.trim(),
      adults: Number(values.adults),
      children: Number(values.children),
    };

    if (!this.isNewClientMode() && clientId) {
      dto.clientId = clientId;
    }

    if (values.contactPhone.trim()) {
      dto.contactPhone = values.contactPhone.trim();
    }

    if (values.contactEmail.trim()) {
      dto.contactEmail = values.contactEmail.trim();
    }

    if (values.contactTelegram.trim()) {
      dto.contactTelegram = values.contactTelegram.trim();
    }

    if (values.departDateFrom) {
      dto.departDateFrom = values.departDateFrom;
    }

    if (values.departDateTo) {
      dto.departDateTo = values.departDateTo;
    }

    if (values.returnDateFrom) {
      dto.returnDateFrom = values.returnDateFrom;
    }

    if (values.returnDateTo) {
      dto.returnDateTo = values.returnDateTo;
    }

    if (values.notes.trim()) {
      dto.notes = values.notes.trim();
    }

    if (this.showAssignAgent() && values.assignedAgentId.trim()) {
      dto.assignedAgentId = values.assignedAgentId.trim();
    }

    if (!this.showAssignAgent() && this.selfUserId()) {
      dto.assignedAgentId = this.selfUserId();
    }

    const contactPersonId = this.selectedContactPersonId();

    if (contactPersonId) {
      dto.contactPersonId = contactPersonId;
    }

    this.loading.set(true);

    this.leadsService
      .create(dto)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (created: LeadResponseDto) => {
          this.snackBar.open('Лид создан', 'Close', { duration: 4000 });
          void this.router.navigate(['/app/leads', created.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.applyBackendValidation(err);
        },
      });
  }

  private syncClientSearch(): void {
    this.clientSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const query = value.trim();

          if (this.isNewClientMode() || query.length < 2) {
            this.clientOptions.set([]);
            this.noClientsFound.set(false);

            return of([]);
          }

          this.loadingClients.set(true);

          return this.clientsService.getList({ search: query, limit: 10 }).pipe(
            catchError(() => of({ items: [] })),
            finalize(() => this.loadingClients.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        const items = Array.isArray(response) ? [] : (response.items ?? []);

        this.clientOptions.set(items);
        this.noClientsFound.set(this.clientSearch.value.trim().length >= 2 && items.length === 0);
      });
  }

  private selectClient(client: ClientResponseDto): void {
    const contactEmail = this.pickClientEmail(client);
    const contactPhone = this.pickClientPhone(client);

    this.disableNewClientMode();
    this.selectedClient.set(client);
    this.contactLocked.set(true);
    this.noClientsFound.set(false);
    this.clientContacts.set([]);
    this.selectedContactPersonId.set('');

    this.clientSearch.setValue(this.clientDisplayFn(client), { emitEvent: false });
    this.form.patchValue(
      {
        clientId: client.id,
        clientName: client.fullName ?? '',
        contactEmail,
        contactPhone,
        contactTelegram: client.telegramHandle ?? '',
      },
      { emitEvent: false },
    );

    this.form.controls.clientName.disable({ emitEvent: false });
    this.form.controls.contactPhone.disable({ emitEvent: false });
    this.form.controls.contactEmail.disable({ emitEvent: false });
    this.form.controls.contactTelegram.disable({ emitEvent: false });

    if (client.type === 'COMPANY' || client.type === 'B2B_AGENT') {
      this.clientsService
        .listContacts(client.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((contacts) => {
          this.clientContacts.set(contacts);

          const primary = contacts.find((c) => c.primary);

          if (primary) {
            this.selectedContactPersonId.set(primary.id);
            this.applyContactPersonToForm(primary);
          }
        });
    }
  }

  protected onContactPersonSelected(event: MatSelectChange): void {
    const contactId = event.value as string;

    this.selectedContactPersonId.set(contactId);

    const contact = this.clientContacts().find((c) => c.id === contactId);

    if (contact) {
      this.applyContactPersonToForm(contact);
    }
  }

  private applyContactPersonToForm(contact: ContactResponseDto): void {
    this.form.patchValue(
      {
        contactPhone: contact.phone ?? '',
        contactEmail: contact.email ?? '',
        contactTelegram: contact.telegramHandle ?? '',
      },
      { emitEvent: false },
    );
  }

  private pickClientPhone(client: ClientResponseDto): string {
    const primaryContact = client.contacts.find((contact) => contact.primary);

    return primaryContact?.phone ?? client.phone ?? '';
  }

  private pickClientEmail(client: ClientResponseDto): string {
    const primaryContact = client.contacts.find((contact) => contact.primary);

    return primaryContact?.email ?? client.email ?? '';
  }

  private loadAssignableAgents(): void {
    if (!this.showAssignAgent()) {
      return;
    }

    this.membersService
      .findAll()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((members) => {
        const options = members
          .filter((member) => member.active && SALES_ROLES.has(member.role as OrgRole))
          .map((member) => ({ id: member.userId, name: member.name }))
          .sort((a, b) => a.name.localeCompare(b.name));

        this.agentOptions.set(options);
      });
  }

  private loadMeIfNeeded(): void {
    if (this.meService.getMeData()) {
      return;
    }

    this.meService
      .getMe()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private applyBackendValidation(err: HttpErrorResponse): void {
    if (err.status !== 422) {
      this.error.set(err.error?.message ?? err.message ?? 'Не удалось создать лид');

      return;
    }

    const fieldErrors = err.error?.fieldErrors;

    if (!isFieldErrorMap(fieldErrors)) {
      this.error.set(err.error?.message ?? 'Ошибка валидации');

      return;
    }

    const nextErrors: FieldErrorMap = {};

    Object.entries(fieldErrors).forEach(([key, value]) => {
      const text = Array.isArray(value) ? value.join(', ') : String(value);
      const control = this.form.controls[key as keyof CreateLeadForm['controls']];

      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: true });
        nextErrors[key] = text;
      }
    });

    this.serverFieldErrors.set(nextErrors);
  }

  private clearServerErrors(): void {
    this.serverFieldErrors.set({});

    Object.values(this.form.controls).forEach((control) => {
      const errors = { ...(control.errors ?? {}) };

      if (!errors['server']) {
        return;
      }

      delete errors['server'];
      control.setErrors(Object.keys(errors).length > 0 ? errors : null);
    });
  }
}
