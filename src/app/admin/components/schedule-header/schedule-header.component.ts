import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-schedule-header',
  templateUrl: './schedule-header.component.html',
  styleUrls: ['./schedule-header.component.css']
})
export class ScheduleHeaderComponent {
  @Input() isPublishing = false;
  @Input() shiftsLength = 0;
  @Input() isWeekPublished = false;

  @Output() generateWeekEvent = new EventEmitter<void>();
  @Output() publishWeekEvent = new EventEmitter<void>();

  onGenerateWeek() {
    this.generateWeekEvent.emit();
  }

  onPublishWeek() {
    this.publishWeekEvent.emit();
  }
}