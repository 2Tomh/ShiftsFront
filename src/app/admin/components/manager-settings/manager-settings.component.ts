import { Component, OnInit } from '@angular/core';
import { ManagerSettingsService } from '../../../services/ManagerSettings.service';
import { ManagerSettings } from '../../../Models/ManagerSettings';

@Component({
  selector: 'app-manager-settings',
  templateUrl: './manager-settings.component.html',
  styleUrls: ['./manager-settings.component.css']
})
export class ManagerSettingsComponent implements OnInit {
  settings: ManagerSettings = { name: '', email: '' };
  isLoading = true;
  isSaving = false;

  constructor(private managerSettingsService: ManagerSettingsService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.managerSettingsService.get().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('שגיאה בטעינת פרטי המנהל', err);
        this.isLoading = false;
      }
    });
  }

  private isValidEmail(email: string): boolean {
    // בדיקה בסיסית - מספיק כדי לתפוס טעויות הקלדה נפוצות, לא תקן RFC מלא.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  save(): void {
    const name = this.settings.name.trim();
    const email = this.settings.email.trim();

    if (!name) {
      alert('יש להזין שם למנהל');
      return;
    }
    if (!email || !this.isValidEmail(email)) {
      alert('יש להזין כתובת מייל תקינה');
      return;
    }

    this.isSaving = true;
    this.managerSettingsService.update({ ...this.settings, name, email }).subscribe({
      next: () => {
        this.isSaving = false;
        alert('פרטי המנהל נשמרו בהצלחה! מעכשיו כל טופס שנשלח למנהל (כמו הצהרת בריאות) יישלח לכתובת הזו.');
      },
      error: (err) => {
        this.isSaving = false;
        console.error('שגיאה בשמירת פרטי המנהל', err);
        alert('שגיאה בשמירת הפרטים. נסה שוב.');
      }
    });
  }
}