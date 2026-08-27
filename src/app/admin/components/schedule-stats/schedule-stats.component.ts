import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-schedule-stats',
  templateUrl: './schedule-stats.component.html',
  styleUrls: ['./schedule-stats.component.css']
})
export class ScheduleStatsComponent {
  @Input() employeeStats: any[] = [];

  @Output() clearStatsEvent = new EventEmitter<void>();
  @Output() editNameEvent = new EventEmitter<any>();
  @Output() openEditModalEvent = new EventEmitter<any>();

  clearAll() {
    this.clearStatsEvent.emit();
  }

  editName(stat: any) {
    this.editNameEvent.emit(stat);
  }

  openEditModal(stat: any) {
    this.openEditModalEvent.emit(stat);
  }
}