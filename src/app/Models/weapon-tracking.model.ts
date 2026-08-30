export interface WeaponTracking {
  id?: string;
  employeeId: string;
  employeeName?: string;
  healthDeclarationSent: boolean;
  btfRequestSubmitted: boolean;
  btfAppointmentDate: string | null;
  psychologistAppointment: boolean;
}