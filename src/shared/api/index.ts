import type{EmployeeApi}from"./types";import{mockEmployeeApi}from"./mock";
const base=process.env.EXPO_PUBLIC_API_BASE_URL??"http://localhost:3000/api/v1";
async function req<T>(path:string,method="GET"):Promise<T>{const r=await fetch(base+path,{method,headers:{"Content-Type":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return (await r.json() as {data:T}).data}
const live:EmployeeApi={getCurrentShift:()=>req("/employee/shifts/current"),startShift:()=>req("/employee/shifts/start","POST"),endShift:()=>req("/employee/shifts/end","POST"),listCalls:()=>req("/employee/calls")};
export const employeeApi:EmployeeApi=process.env.EXPO_PUBLIC_API_MODE==="live"?live:mockEmployeeApi;
