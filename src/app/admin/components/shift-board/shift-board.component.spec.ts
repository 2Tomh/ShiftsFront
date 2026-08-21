import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftBoardComponent } from './shift-board.component';

describe('ShiftBoardComponent', () => {
  let component: ShiftBoardComponent;
  let fixture: ComponentFixture<ShiftBoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShiftBoardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShiftBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
