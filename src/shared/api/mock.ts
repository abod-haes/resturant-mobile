import type{EmployeeApi,Shift,ServiceCall}from"./types";
let shift:Shift|null=null;const calls:ServiceCall[]=[{id:"call-1",branchId:"branch-1",tableNumber:"1",floor:"الأرضي",area:"داخلي",type:"waiter",createdAt:new Date().toISOString()},{id:"call-2",branchId:"branch-1",tableNumber:"2",floor:"الأرضي",area:"تراس",type:"hookah",createdAt:new Date(Date.now()-600000).toISOString()}];
const delay=()=>new Promise<void>(r=>setTimeout(r,200));
export const mockEmployeeApi:EmployeeApi={async getCurrentShift(){await delay();return shift},async startShift(){await delay();shift={id:"shift-"+Date.now(),employeeId:"emp-1",startedAt:new Date().toISOString(),status:"active"};return shift},async endShift(){await delay();shift=null},async listCalls(){await delay();return [...calls]}};
