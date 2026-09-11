export interface LoginResponse {
    token: string;
    role: 'Admin' | 'Employee';
    username: string;
    employeeId?: string;
    employeeName?: string;
}