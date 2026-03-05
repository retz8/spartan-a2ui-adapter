import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpartanA2uiAdapter } from './spartan-a2ui-adapter';

describe('SpartanA2uiAdapter', () => {
  let component: SpartanA2uiAdapter;
  let fixture: ComponentFixture<SpartanA2uiAdapter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpartanA2uiAdapter],
    }).compileComponents();

    fixture = TestBed.createComponent(SpartanA2uiAdapter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
