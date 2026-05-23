import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { ContractsService } from '@app/services/contracts.service';

import { CreateContractPageComponent } from './create-contract-page';

describe('CreateContractPageComponent', () => {
  let component: CreateContractPageComponent;
  let fixture: ComponentFixture<CreateContractPageComponent>;
  let contractsService: { create: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    contractsService = {
      create: vi.fn(() =>
        of({
          id: 'contract-1',
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CreateContractPageComponent],
      providers: [
        provideRouter([]),
        { provide: ContractsService, useValue: contractsService },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CreateContractPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('submits create payload and navigates to detail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onCreateSubmitted({
      clientId: 'client-1',
      contractNumber: 'CNT-1',
      signedAt: '2026-05-23',
    });

    expect(contractsService.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/app/contracts', 'contract-1']);
  });
});
