import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { AppUser } from '../../../Models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: AppUser[] = [];
  isLoading = false;

  // ===== טופס יצירת משתמש חדש =====
  newUsername = '';
  newPassword = '';
  newRole: 'Admin' | 'Employee' = 'Employee';
  newEmployeeName = '';
  isCreating = false;
  createError = '';

  // ===== עריכת משתמש קיים =====
  editingUser: AppUser | null = null;
  editUsername = '';
  editPassword = '';
  editEmail = '';
  editRole: 'Admin' | 'Employee' = 'Employee';
  editEmployeeName = '';
  isSaving = false;
  editError = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.authService.getUsers().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.users = data;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  createUser(): void {
    this.createError = '';

    if (!this.newUsername.trim() || !this.newPassword.trim()) {
      this.createError = 'נא למלא שם משתמש וסיסמה';
      return;
    }

    if (this.newRole === 'Employee' && !this.newEmployeeName.trim()) {
      this.createError = 'נא לציין שם עובד לקישור המשתמש';
      return;
    }

    this.isCreating = true;

    this.authService.createUser({
      username: this.newUsername.trim(),
      password: this.newPassword,
      role: this.newRole,
      employeeName: this.newRole === 'Employee' ? this.newEmployeeName.trim() : undefined
    }).subscribe({
      next: () => {
        this.isCreating = false;
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.isCreating = false;
        this.createError = err.error?.error || err.error || 'שגיאה ביצירת המשתמש';
      }
    });
  }

  deleteUser(user: AppUser): void {
    if (!confirm(`למחוק את המשתמש "${user.username}"? הוא לא יוכל יותר להתחבר.`)) return;

    this.authService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
      },
      error: (err) => {
        console.error(err);
        alert('שגיאה במחיקת המשתמש');
      }
    });
  }

  // ===== עריכה =====

  startEdit(user: AppUser): void {
    this.editingUser = user;
    this.editUsername = user.username;
    this.editPassword = '';
    this.editEmail = user.email || '';
    this.editRole = user.role;
    this.editEmployeeName = user.employeeName || '';
    this.editError = '';
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.editingUser) return;
    this.editError = '';

    if (!this.editUsername.trim()) {
      this.editError = 'נא למלא שם משתמש';
      return;
    }

    if (this.editRole === 'Employee' && !this.editEmployeeName.trim()) {
      this.editError = 'נא לציין שם עובד לקישור המשתמש';
      return;
    }

    this.isSaving = true;

    const payload: any = {
      username: this.editUsername.trim(),
      email: this.editEmail.trim(),
      role: this.editRole,
      employeeName: this.editRole === 'Employee' ? this.editEmployeeName.trim() : undefined
    };

    if (this.editPassword.trim()) {
      payload.password = this.editPassword;
    }

    this.authService.updateUser(this.editingUser.id, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.editingUser = null;
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving = false;
        this.editError = err.error?.error || err.error || 'שגיאה בעדכון המשתמש';
      }
    });
  }

  private resetForm(): void {
    this.newUsername = '';
    this.newPassword = '';
    this.newRole = 'Employee';
    this.newEmployeeName = '';
  }

  roleLabel(role: string): string {
    return role === 'Admin' ? 'מנהל' : 'עובד';
  }
}