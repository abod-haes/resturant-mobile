export type Department="waiter"|"hookah";
export type Shift={id:string;employeeId:string;startedAt:string;status:"active"|"ended"};
export type ServiceCall={id:string;branchId:string;tableNumber:string;floor:string;area:string;type:Department;createdAt:string};
export interface EmployeeApi{getCurrentShift():Promise<Shift|null>;startShift():Promise<Shift>;endShift():Promise<void>;listCalls():Promise<ServiceCall[]>}
