import seed from "../../../mocks/fixtures.json";
export type MockState = typeof seed;
export type MockScenario = "happy_path"|"no_active_staff"|"subscription_expired"|"qr_revoked"|"table_disabled"|"call_cooldown"|"offline"|"empty_menu"|"server_error"|"slow_network";
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
let state:MockState=clone(seed);
let scenario:MockScenario="happy_path";
const sessions=new Map<string,{tableId:string;lastActivity:number;confirmedFirstCall:boolean}>();
const idem=new Map<string,unknown>();
const lastCall=new Map<string,number>();
export class MockApiError extends Error {constructor(public code:string,public status:number,public retryAfterSeconds?:number){super(code)}}
export const mockControl={
 getScenario:()=>scenario,
 setScenario:(next:MockScenario)=>{scenario=next;resetRuntime()},
 reset:()=>{state=clone(seed);scenario="happy_path";resetRuntime()},
 snapshot:()=>clone(state),
 setState:(next:MockState)=>{state=clone(next);resetRuntime()}
};
function resetRuntime(){sessions.clear();idem.clear();lastCall.clear()}
export async function mockDelay(){if(scenario==="offline")throw new MockApiError("NETWORK_ERROR",0);if(scenario==="server_error")throw new MockApiError("INTERNAL_ERROR",500);await new Promise<void>(r=>setTimeout(r,scenario==="slow_network"?1800:120))}
export const mockDb={
 list<K extends keyof MockState>(key:K):MockState[K]{return clone(state[key])},
 find<K extends "restaurants"|"branches"|"tables"|"products"|"categories"|"employees"|"subscriptions"|"shifts">(key:K,id:string){return clone((state[key] as Array<{id:string}>).find(x=>x.id===id)??null)},
 create<K extends "restaurants"|"branches"|"tables"|"products"|"categories"|"employees">(key:K,item:MockState[K][number]){(state[key] as Array<MockState[K][number]>).push(clone(item));return clone(item)},
 patch<K extends "restaurants"|"branches"|"tables"|"products"|"categories"|"employees">(key:K,id:string,changes:Partial<MockState[K][number]>){const rows=state[key] as Array<{id:string}>;const index=rows.findIndex(x=>x.id===id);if(index<0)throw new MockApiError("NOT_FOUND",404);const next={...rows[index],...changes};rows[index]=next;return clone(next)},
 archive<K extends "tables"|"products"|"categories"|"employees">(key:K,id:string){return this.patch(key,id,{archivedAt:new Date().toISOString()} as Partial<MockState[K][number]>)},
 listPage<K extends "restaurants"|"branches"|"tables"|"products"|"categories"|"employees"|"calls">(key:K,options:{branchId?:string;cursor?:string;limit?:number;search?:string}={}){const limit=Math.max(1,Math.min(100,options.limit??20));let rows=(state[key] as Array<{id:string;branchId?:string;name?:string}>).filter(x=>(!options.branchId||x.branchId===options.branchId)&&(!options.search||x.name?.includes(options.search)));const start=options.cursor?Math.max(0,rows.findIndex(x=>x.id===options.cursor)+1):0;rows=rows.slice(start,start+limit+1);return {items:clone(rows.slice(0,limit)),nextCursor:rows.length>limit?rows[limit-1].id:null}}
};
export const mockCalls={
 createSession(qrToken:string){const table=state.tables.find(t=>t.qrToken===qrToken);if(!table||!table.qrEnabled||scenario==="qr_revoked")throw new MockApiError("QR_REVOKED",410);const token="mock-session-"+crypto.randomUUID();sessions.set(token,{tableId:table.id,lastActivity:Date.now(),confirmedFirstCall:false});return {sessionToken:token,expiresAt:Date.now()+14400000,confirmedFirstCall:false}},
 getSession(token:string){const session=sessions.get(token);if(!session||Date.now()-session.lastActivity>=14400000)throw new MockApiError("SESSION_EXPIRED",401);session.lastActivity=Date.now();return session},
 createCall(token:string,type:"waiter"|"hookah",idempotencyKey:string){if(idem.has(idempotencyKey))return clone(idem.get(idempotencyKey));const session=this.getSession(token);const table=state.tables.find(t=>t.id===session.tableId);if(!table||!table.qrEnabled||scenario==="qr_revoked")throw new MockApiError("QR_REVOKED",410);const branch=state.branches.find(b=>b.id===table.branchId);if(!branch)throw new MockApiError("NOT_FOUND",404);const subscription=state.subscriptions.find(s=>s.restaurantId===branch.restaurantId);if(!subscription||scenario==="subscription_expired"||Date.now()>new Date(subscription.endsAt).getTime()+subscription.graceDays*86400000)throw new MockApiError("SUBSCRIPTION_INACTIVE",403);if(!table.callsEnabled||scenario==="table_disabled")throw new MockApiError("TABLE_DISABLED",403);if(!branch.callSettings.enabled)throw new MockApiError("CALLS_DISABLED",403);if(type==="waiter"&&!branch.callSettings.waiterEnabled||type==="hookah"&&!branch.callSettings.hookahEnabled)throw new MockApiError("CALL_TYPE_DISABLED",403);const key=table.id+":"+type;const last=lastCall.get(key)??0;const remaining=10000-(Date.now()-last);if(remaining>0||scenario==="call_cooldown")throw new MockApiError("COOLDOWN_ACTIVE",429,Math.ceil(Math.max(remaining,1000)/1000));lastCall.set(key,Date.now());const onShift=new Set(state.shifts.filter(s=>!s.endedAt).map(s=>s.employeeId));const eligible=state.employees.filter(e=>e.branchId===branch.id&&!e.archivedAt&&onShift.has(e.id)&&(branch.callSettings.routingMode==="all"||e.department===type));const noStaff=eligible.length===0||scenario==="no_active_staff";const call={id:crypto.randomUUID(),branchId:branch.id,tableId:table.id,type,createdAt:new Date().toISOString(),deliveryState:noStaff?"no_staff":"queued",ownerAlerted:noStaff};state.calls.push(call as MockState["calls"][number]);if(noStaff)state.ownerAlerts.push({id:crypto.randomUUID(),branchId:branch.id,type:"NO_ACTIVE_STAFF",createdAt:call.createdAt,read:false});const result={id:call.id,createdAt:call.createdAt,deliveryState:call.deliveryState,ownerAlerted:call.ownerAlerted};idem.set(idempotencyKey,result);session.confirmedFirstCall=true;return clone(result)}
};
