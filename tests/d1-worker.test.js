import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../cloudflare/worker.js';
import login from '../api/leader.js';
import verify from '../api/leader-verify.js';

function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=JSON.parse(b)}}}
function d1(db){return {prepare(sql){return {bind(...values){return {async first(){return db.prepare(sql).get(...values)||null},async run(){const result=db.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes)}}}}}}}}}
test('worker and D1 enforce publication, owner key, expiry and current password',async t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE activities(id TEXT PRIMARY KEY,version INTEGER NOT NULL,expires_at INTEGER NOT NULL,data TEXT NOT NULL);');
 let env={LEADER_PASSWORD:'password-1',LEADER_SESSION_SECRET:'a-long-random-server-only-secret-123456789'};
 const res=response();await login({method:'POST',headers:{'content-type':'application/json'},body:{password:env.LEADER_PASSWORD}},res,{env});const token=res.body.token;
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original});
 globalThis.fetch=async(_url,opts)=>{const r=response();await verify({method:'POST',headers:{authorization:opts.headers.Authorization,'x-scout-paper-worker-key':opts.headers['X-Scout-Paper-Worker-Key']}},r,{env});return new Response(JSON.stringify(r.body),{status:r.statusCode});};
 const workerEnv={ACTIVITY_DB:d1(db),ALLOWED_ORIGINS:'https://scout.example',LEADER_VERIFY_URL:'https://scout.example/api/leader-verify',LEADER_SESSION_SECRET:env.LEADER_SESSION_SECRET};
 const call=async(method,data)=>{let url='https://worker.example/api/activity';const headers={Origin:'https://scout.example'};const opts={method,headers};if(method==='GET')url+='?id='+encodeURIComponent(data);else{headers.Authorization='Bearer '+token;headers['Content-Type']='application/json';opts.body=JSON.stringify(data);}return worker.fetch(new Request(url,opts),workerEnv)};
 const set={id:'set1',revision:1,title:'測試',questions:[{id:'q1',label:'摩斯',kind:'text',prompt:'... --- ...',answer:'SOS'}]};
 let r=await call('POST',{set,expiresAt:Date.now()+3600000});assert.equal(r.status,201);const created=await r.json();
 r=await call('GET',created.id);assert.equal(r.status,200);const pub=await r.json();assert.equal(JSON.stringify(pub).includes('SOS'),false);
 r=await call('PUT',{id:created.id,ownerKey:created.ownerKey,expectedVersion:1,action:'release',set,questionIds:['q1']});assert.equal(r.status,200);
 r=await call('GET',created.id);assert.equal((await r.json()).answers[0].answer,'SOS');
 env={...env,LEADER_PASSWORD:'password-2'};
 r=await call('DELETE',{id:created.id,ownerKey:created.ownerKey,expectedVersion:2});assert.equal(r.status,401,'old token cannot write after password rotation');
 db.prepare('UPDATE activities SET expires_at = ? WHERE id = ?').run(Date.now()-1,created.id);
 r=await call('GET',created.id);assert.equal(r.status,404);
});
