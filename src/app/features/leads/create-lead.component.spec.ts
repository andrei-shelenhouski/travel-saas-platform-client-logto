import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CreateLeadComponent } from './create-lead.component';
import { LeadsService } from '../../services/leads.service';

describe('CreateLeadComponent', () => {
  let component: CreateLeadComponent;
  let fixture: ComponentFixture<CreateLeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateLeadComponent],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: { create: () => of({ id: '1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateLeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
