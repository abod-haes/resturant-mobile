import type{EmployeeApi,Shift,ServiceCall}from"./types";
import {mockDb,mockDelay,mockControl}from"../mock/engine";
const employeeId="emp-1";
export const mockEmployeeApi:EmployeeApi={
 async getCurrentShift(){await mockDelay();const shift=mockDb.list("shifts").find(s=>s.employeeId===employeeId&&!s.endedAt);return shift?{id:shift.id,employeeId:shift.employeeId,startedAt:shift.startedAt,status:"active"}:null},
 async startShift(){await mockDelay();const existing=mockDb.list("shifts").find(s=>s.employeeId===employeeId&&!s.endedAt);if(existing)return {id:existing.id,employeeId,startedAt:existing.startedAt,status:"active"};const shift={id:`shift-${Date.now()}`,employeeId,branchId:"branch-1",startedAt:new Date().toISOString(),endedAt:null};mockControl.setState({...mockControl.snapshot(),shifts:[...mockDb.list("shifts"),shift]});return {id:shift.id,employeeId,startedAt:shift.startedAt,status:"active"}},
 async endShift(){await mockDelay();const state=mockControl.snapshot();mockControl.setState({...state,shifts:state.shifts.map(s=>s.employeeId===employeeId&&!s.endedAt?{...s,endedAt:new Date().toISOString()}:s)})},
 async listCalls(){await mockDelay();const branchId=mockDb.list("employees").find(e=>e.id===employeeId)?.branchId;const tables=mockDb.list("tables");const areas=mockDb.list("areas");const floors=mockDb.list("floors");return mockDb.list("calls").filter(c=>c.branchId===branchId).map(c=>{const table=tables.find(t=>t.id===c.tableId);const area=areas.find(a=>a.id===table?.areaId);return {id:c.id,branchId:c.branchId,tableNumber:table?.number??"—",area:area?.name??"—",floor:floors.find(f=>f.id===area?.floorId)?.name??"—",type:c.type as "waiter"|"hookah",createdAt:c.createdAt} satisfies ServiceCall})}
};
