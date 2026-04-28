import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
import { Router, RouterLink } from '@angular/router';

import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { ClientsService } from '@app/services/clients.service';
import { LeadsService } from '@app/services/leads.service';
import { MeService } from '@app/services/me.service';
import { OrganizationMembersService } from '@app/services/organization-members.service';
import { RoleService } from '@app/services/role.service';
import { MAT_FORM_BUTTONS } from '@app/shared/material-imports';
import { ClientResponseDto, CreateLeadDto, LeadResponseDto, OrgRole } from '@app/shared/models';
import { ToastService } from '@app/shared/services/toast.service';

type CreateLeadForm = FormGroup<{
  clientId: FormControl<string>;
  clientName: FormControl<string>;
  contactEmail: FormControl<string>;
  contactPhone: FormControl<string>;
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

function phoneOrEmailRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as CreateLeadForm;
  const phone = group.controls.contactPhone.value.trim();
  const email = group.controls.contactEmail.value.trim();

  if (phone || email) {
    return null;
  }

  return { phoneOrEmailRequired: true };
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
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form: CreateLeadForm = this.fb.nonNullable.group(
    {
      clientId: [''],
      clientName: ['', trimmedRequired],
      contactEmail: ['', Validators.email],
      contactPhone: ['', Validators.pattern(/^\+?\d{10,15}$/)],
      destination: ['', trimmedRequired],
      departDateFrom: [''],
      departDateTo: [''],
      returnDateFrom: [''],
      returnDateTo: [''],
      adults: [1, [Validators.required, Validators.min(1)]],
      children: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      assignedAgentId: [''],
    },
    {
      validators: [phoneOrEmailRequiredValidator, dateRangeValidator],
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

  protected readonly showAssignAgent = computed(
    () => this.roleService.isAdmin() || this.roleService.isManager(),
  );
  protected readonly selfUserId = computed(() => this.meService.getMeData()?.id ?? '');
  protected readonly agentOptions = signal<AgentOption[]>([]);

  constructor() {
    this.loadMeIfNeeded();
    this.syncClientSearch();
    this.loadAssignableAgents();
  }

  protected clientDisplayFn(client: ClientResponseDto | string | null): string {
    if (!client) {
      return '';
    }

    if (typeof client === 'string') {
      return client;
    }

    return client.fullName ?? '';
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
    this.isNewClientMode.set(true);

    this.clientSearch.setValue('', { emitEvent: false });
    this.form.controls.clientId.setValue('');
    this.form.controls.clientName.enable({ emitEvent: false });
    this.form.controls.contactPhone.enable({ emitEvent: false });
    this.form.controls.contactEmail.enable({ emitEvent: false });
  }

  protected disableNewClientMode(): void {
    this.isNewClientMode.set(false);
  }

  protected unlockContactEditing(): void {
    this.contactLocked.set(false);
    this.form.controls.clientName.enable({ emitEvent: false });
    this.form.controls.contactPhone.enable({ emitEvent: false });
    this.form.controls.contactEmail.enable({ emitEvent: false });
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

    this.loading.set(true);

    this.leadsService
      .create(dto)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (created: LeadResponseDto) => {
          this.toast.showSuccess('Lead created');
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

    this.clientSearch.setValue(client.fullName ?? '', { emitEvent: false });
    this.form.patchValue(
      {
        clientId: client.id,
        clientName: client.fullName ?? '',
        contactEmail,
        contactPhone,
      },
      { emitEvent: false },
    );

    this.form.controls.clientName.disable({ emitEvent: false });
    this.form.controls.contactPhone.disable({ emitEvent: false });
    this.form.controls.contactEmail.disable({ emitEvent: false });
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
      this.error.set(err.error?.message ?? err.message ?? 'Failed to create lead');

      return;
    }

    const fieldErrors = err.error?.fieldErrors;

    if (!isFieldErrorMap(fieldErrors)) {
      this.error.set(err.error?.message ?? 'Validation failed');

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
