export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string; // מגיע מהשרת כ-ISO string
  endDate: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  reviewedAt?: string;
  adminNote?: string;
}