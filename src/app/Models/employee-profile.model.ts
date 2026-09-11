export type ArmedStatus = 'NotArmed' | 'InProgress' | 'Armed';

export interface EmployeeProfile {
  id?: string;
  fullName: string;
  email: string;
  hireDate: string | null;
  armedStatus: ArmedStatus;
  customFieldValues: { [columnName: string]: string };
  username?: string | null;
  password?: string;
  systemRole?: 'Admin' | 'Employee' | null;
}

export interface EmployeeManagementConfig {
  id?: string;
  customColumns: string[];
}