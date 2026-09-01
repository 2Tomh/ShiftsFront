export interface EmployeeProfile {
  id?: string;
  fullName: string;
  email: string;
  hireDate: string | null;
  isArmed: boolean;
  customFieldValues: { [columnName: string]: string };
}

export interface EmployeeManagementConfig {
  id?: string;
  customColumns: string[];
}