export interface WeaponTracking {
  id?: string;
  employeeId: string;
  employeeName?: string;
  healthDeclarationSent: boolean;
  btfRequestSubmitted: boolean;
  btfAppointmentDate: string | null;
  psychologistAppointment: boolean;
  refreshDate: string | null;
  licenseDate: string | null;
  customFieldValues: { [columnName: string]: string };
}

export interface WeaponTrackingConfig {
  id?: string;
  customColumns: string[];
}