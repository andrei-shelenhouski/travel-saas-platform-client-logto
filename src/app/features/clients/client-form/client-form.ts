import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageContentComponent } from '@app/shared/components';
import { FormSectionComponent } from '@app/shared/components/form-section/form-section';
import { PageHeading } from '@app/shared/components/page-heading/page-heading';
import { PageHeadingAction } from '@app/shared/components/page-heading/page-heading-action.directive';
import { ClientType, CreateClientDto, UpdateClientDto } from '@app/shared/models';

import type { ClientResponseDto } from '@app/shared/models';

type TypeOption = {
  value: ClientType;
  label: string;
  subLabel: string;
  icon: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: ClientType.INDIVIDUAL,
    label: 'Физ. лицо',
    subLabel: 'Частный клиент',
    icon: 'person',
  },
  {
    value: ClientType.COMPANY,
    label: 'Компания',
    subLabel: 'Юридическое лицо',
    icon: 'business',
  },
  {
    value: ClientType.B2B_AGENT,
    label: 'B2B агент',
    subLabel: 'Турагентство / партнёр',
    icon: 'work',
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-client-form',
  imports: [
    MatCheckboxModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    PageContentComponent,
    FormSectionComponent,
    PageHeading,
    PageHeadingAction,
  ],
  templateUrl: './client-form.html',
  styleUrl: './client-form.scss',
})
export class ClientFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly mode = input<'create' | 'edit'>('create');
  readonly initialClient = input<ClientResponseDto | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly submitError = input('');

  readonly cancelled = output<void>();
  readonly createSubmitted = output<CreateClientDto>();
  readonly updateSubmitted = output<UpdateClientDto>();

  readonly isEditMode = computed(() => this.mode() === 'edit');

  readonly ClientType = ClientType;
  readonly typeOptions = TYPE_OPTIONS;
  readonly selectedType = signal<ClientType | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    telegramHandle: [''],
    notes: [''],
    dataConsentGiven: [false, Validators.requiredTrue],
    dataConsentDate: ['', Validators.required],
    companyName: [''],
    legalAddress: [''],
    unp: ['', Validators.pattern(/^\d{9}$/)],
    okpo: [''],
    iban: [''],
    bankName: [''],
    bik: [''],
    trademark: ['', Validators.maxLength(200)],
    registrationCert: ['', Validators.maxLength(100)],
    taxationType: ['', Validators.maxLength(60)],
    directorName: ['', Validators.maxLength(200)],
    rataMember: [false],
  });

  readonly commissionPctCtrl = this.fb.control<number | null>({ value: null, disabled: true });

  readonly consentGiven = toSignal(this.form.controls.dataConsentGiven.valueChanges, {
    initialValue: false,
  });

  constructor() {
    effect(() => {
      const mode = this.mode();

      if (mode === 'create') {
        this.enableCreateMode();

        return;
      }

      this.enableEditMode();
      this.patchForm(this.initialClient());
    });

    effect(() => {
      if (!this.isEditMode()) {
        return;
      }

      this.patchForm(this.initialClient());
    });
  }

  private readonly _autoConsentDate = effect(() => {
    const checked = this.consentGiven();

    untracked(() => {
      if (checked && !this.form.controls.dataConsentDate.value) {
        this.form.controls.dataConsentDate.setValue(new Date().toISOString().slice(0, 10));
      }
    });
  });

  selectType(type: ClientType): void {
    if (this.isEditMode()) {
      return;
    }

    this.selectedType.set(type);
    this.updateCompanyValidators(type);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  submit(): void {
    const type = this.selectedType();

    if (this.form.invalid || this.loading() || this.saving() || type === null) {
      this.form.markAllAsTouched();

      return;
    }

    const value = this.form.getRawValue();

    if (this.isEditMode()) {
      this.updateSubmitted.emit(this.buildUpdateDto(value, type));

      return;
    }

    this.createSubmitted.emit(this.buildCreateDto(value, type));
  }

  private updateCompanyValidators(type: ClientType): void {
    const { companyName, legalAddress } = this.form.controls;
    const isCompanyType = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;

    if (isCompanyType) {
      companyName.setValidators(Validators.required);
      legalAddress.setValidators(Validators.required);
    } else {
      companyName.clearValidators();
      legalAddress.clearValidators();
    }

    companyName.updateValueAndValidity({ emitEvent: false });
    legalAddress.updateValueAndValidity({ emitEvent: false });
  }

  private enableCreateMode(): void {
    this.form.controls.dataConsentGiven.setValidators(Validators.requiredTrue);
    this.form.controls.dataConsentDate.setValidators(Validators.required);
    this.form.controls.dataConsentGiven.enable({ emitEvent: false });
    this.form.controls.dataConsentDate.enable({ emitEvent: false });
    this.form.controls.dataConsentGiven.updateValueAndValidity({ emitEvent: false });
    this.form.controls.dataConsentDate.updateValueAndValidity({ emitEvent: false });
  }

  private enableEditMode(): void {
    this.form.controls.dataConsentGiven.clearValidators();
    this.form.controls.dataConsentDate.clearValidators();
    this.form.controls.dataConsentGiven.disable({ emitEvent: false });
    this.form.controls.dataConsentDate.disable({ emitEvent: false });
    this.form.controls.dataConsentGiven.updateValueAndValidity({ emitEvent: false });
    this.form.controls.dataConsentDate.updateValueAndValidity({ emitEvent: false });
  }

  // eslint-disable-next-line complexity
  private patchForm(client: ClientResponseDto | null): void {
    if (client === null) {
      return;
    }

    const type = this.normalizeClientType(client.type);

    this.selectedType.set(type);
    this.updateCompanyValidators(type);
    this.commissionPctCtrl.setValue(client.commissionPct);
    this.form.patchValue({
      fullName: client.fullName ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      telegramHandle: client.telegramHandle ?? '',
      notes: client.notes ?? '',
      dataConsentGiven: client.dataConsentGiven,
      dataConsentDate: client.dataConsentDate?.slice(0, 10) ?? '',
      companyName: client.companyName ?? '',
      legalAddress: client.legalAddress ?? '',
      unp: client.unp ?? '',
      okpo: client.okpo ?? '',
      iban: client.iban ?? '',
      bankName: client.bankName ?? '',
      bik: client.bik ?? '',
      trademark: client.trademark ?? '',
      registrationCert: client.registrationCert ?? '',
      taxationType: client.taxationType ?? '',
      directorName: client.directorName ?? '',
      rataMember: client.rataMember ?? false,
    });
  }

  private normalizeClientType(type: string): ClientType {
    if (
      type === ClientType.INDIVIDUAL ||
      type === ClientType.COMPANY ||
      type === ClientType.B2B_AGENT
    ) {
      return type;
    }

    return ClientType.INDIVIDUAL;
  }

  private buildCreateDto(
    value: ReturnType<ClientFormComponent['form']['getRawValue']>,
    type: ClientType,
  ): CreateClientDto {
    const isCompanyType = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;
    const dto: CreateClientDto = {
      type,
      fullName: value.fullName.trim(),
      dataConsentGiven: value.dataConsentGiven,
    };

    if (value.phone.trim()) {
      dto.phone = value.phone.trim();
    }

    if (value.email.trim()) {
      dto.email = value.email.trim();
    }

    if (value.telegramHandle.trim()) {
      dto.telegramHandle = value.telegramHandle.trim();
    }

    if (value.notes.trim()) {
      dto.notes = value.notes.trim();
    }

    if (isCompanyType) {
      dto.companyName = value.companyName.trim();
      dto.legalAddress = value.legalAddress.trim();

      if (value.unp.trim()) {
        dto.unp = value.unp.trim();
      }

      if (value.okpo.trim()) {
        dto.okpo = value.okpo.trim();
      }

      if (value.iban.trim()) {
        dto.iban = value.iban.trim();
      }

      if (value.bankName.trim()) {
        dto.bankName = value.bankName.trim();
      }

      if (value.bik.trim()) {
        dto.bik = value.bik.trim();
      }

      if (type === ClientType.B2B_AGENT) {
        if (value.trademark.trim()) {
          dto.trademark = value.trademark.trim();
        }

        if (value.registrationCert.trim()) {
          dto.registrationCert = value.registrationCert.trim();
        }

        if (value.taxationType.trim()) {
          dto.taxationType = value.taxationType.trim();
        }

        if (value.directorName.trim()) {
          dto.directorName = value.directorName.trim();
        }

        dto.rataMember = value.rataMember;
      }
    }

    return dto;
  }

  private buildUpdateDto(
    value: ReturnType<ClientFormComponent['form']['getRawValue']>,
    type: ClientType,
  ): UpdateClientDto {
    const isCompanyType = type === ClientType.COMPANY || type === ClientType.B2B_AGENT;
    const dto: UpdateClientDto = {
      fullName: value.fullName.trim(),
    };

    if (value.phone.trim()) {
      dto.phone = value.phone.trim();
    }

    if (value.email.trim()) {
      dto.email = value.email.trim();
    }

    if (value.telegramHandle.trim()) {
      dto.telegramHandle = value.telegramHandle.trim();
    }

    if (value.notes.trim()) {
      dto.notes = value.notes.trim();
    }

    if (isCompanyType) {
      dto.companyName = value.companyName.trim();
      dto.legalAddress = value.legalAddress.trim();

      if (value.unp.trim()) {
        dto.unp = value.unp.trim();
      }

      if (value.okpo.trim()) {
        dto.okpo = value.okpo.trim();
      }

      if (value.iban.trim()) {
        dto.iban = value.iban.trim();
      }

      if (value.bankName.trim()) {
        dto.bankName = value.bankName.trim();
      }

      if (value.bik.trim()) {
        dto.bik = value.bik.trim();
      }

      if (type === ClientType.B2B_AGENT) {
        if (value.trademark.trim()) {
          dto.trademark = value.trademark.trim();
        }

        if (value.registrationCert.trim()) {
          dto.registrationCert = value.registrationCert.trim();
        }

        if (value.taxationType.trim()) {
          dto.taxationType = value.taxationType.trim();
        }

        if (value.directorName.trim()) {
          dto.directorName = value.directorName.trim();
        }

        dto.rataMember = value.rataMember;
      }
    }

    return dto;
  }
}
