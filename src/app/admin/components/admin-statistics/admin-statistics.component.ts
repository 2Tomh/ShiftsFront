import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../../../services/statistics.service';
import { StatisticsResult } from '../../../Models/statistics.model';

@Component({
  selector: 'app-admin-statistics',
  templateUrl: './admin-statistics.component.html',
  styleUrls: ['./admin-statistics.component.css']
})
export class AdminStatisticsComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  isLoading = false;
  data: StatisticsResult | null = null;

  shiftTypeColumns: string[] = [];

  // חדש - שולט אילו כרטיסי חימוש כרגע "פתוחים" (מציגים את רשימת
  // השמות). מתחיל סגור, כדי לא להציף את המסך אוטומטית ברשימות ארוכות.
  expandedGroups = new Set<'notArmed' | 'inProgress' | 'armed'>();

  constructor(private statisticsService: StatisticsService) { }

  ngOnInit(): void {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30);

    this.endDate = this.formatDateForInput(today);
    this.startDate = this.formatDateForInput(monthAgo);

    this.loadStats();
  }

  private formatDateForInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadStats(): void {
    if (!this.startDate || !this.endDate) {
      alert('נא לבחור טווח תאריכים מלא');
      return;
    }
    if (this.endDate < this.startDate) {
      alert('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה');
      return;
    }

    this.isLoading = true;
    this.statisticsService.getStatistics(this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.data = res;

        const typesSet = new Set<string>();
        res.perEmployee.forEach(e => Object.keys(e.byType).forEach(t => typesSet.add(t)));
        this.shiftTypeColumns = Array.from(typesSet);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת סטטיסטיקות', err);
        this.isLoading = false;
      }
    });
  }

  armedPercent(count: number): number {
    if (!this.data) return 0;
    const total = this.data.armedStats.notArmed.count + this.data.armedStats.inProgress.count + this.data.armedStats.armed.count;
    return total === 0 ? 0 : Math.round((count / total) * 100);
  }

  get armedTotal(): number {
    if (!this.data) return 0;
    return this.data.armedStats.notArmed.count + this.data.armedStats.inProgress.count + this.data.armedStats.armed.count;
  }

  getEmployeeShiftCount(emp: { byType: { [type: string]: number } }, type: string): number {
    return emp.byType[type] || 0;
  }

  setQuickRange(days: number): void {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    this.endDate = this.formatDateForInput(today);
    this.startDate = this.formatDateForInput(from);
    this.loadStats();
  }

  // חדש - מרחיב/מכווץ את רשימת השמות מתחת לכרטיס חימוש ספציפי
  toggleGroup(group: 'notArmed' | 'inProgress' | 'armed'): void {
    if (this.expandedGroups.has(group)) {
      this.expandedGroups.delete(group);
    } else {
      this.expandedGroups.add(group);
    }
  }

  isGroupExpanded(group: 'notArmed' | 'inProgress' | 'armed'): boolean {
    return this.expandedGroups.has(group);
  }
}