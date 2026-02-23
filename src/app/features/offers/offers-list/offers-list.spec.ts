import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OffersListComponent } from './offers-list';
import { OffersService } from '../../../services/offers.service';

describe('OffersListComponent', () => {
  let component: OffersListComponent;
  let fixture: ComponentFixture<OffersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OffersListComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersService,
          useValue: { getList: () => of([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OffersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
