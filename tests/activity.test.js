import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/activity.js';
import { createMemoryActivityStore } from '../server/activity-store.js';

function response() { return {headers:{}, setHeader(k,v){this.headers[k]=v}, end(value){this.body=JSON.parse(value)}}; }
async function call(store, method, data, trusted=true) {
  const res=response();
  await handler({method, url:method==='GET'?`/api/activity?id=${data}`:'/api/activity', headers:{'content-type':'application/json'}, body:method==='GET'?undefined:JSON.stringify(data)},res,{store,trustedServerMutation:trusted,env:{}});
  return res;
}
const initial = {id:'paper-one', revision:1, title:'活動一', questions:[{id:'q1',label:'摩斯',kind:'text',prompt:'... --- ...',answer:'SOS'}]};
test('activity requires authorization, protects unreleased answers, releases explicitly and detects stale updates', async () => {
  const store = createMemoryActivityStore();
  assert.equal((await call(store, 'POST', {set:initial}, false)).statusCode, 503);
  const created=await call(store,'POST',{set:initial,expiresAt:Date.now()+3600000});
  assert.equal(created.statusCode, 201);
  assert.ok(created.body.ownerKey);
  const {id,ownerKey,version,setFingerprint}=created.body;
  let result=await call(store,'GET',id);
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.stringify(result.body).includes('SOS'), false);
  result=await call(store,'PUT',{id,ownerKey:'a'.repeat(43),expectedVersion:version,action:'release',set:initial,questionIds:['q1']});
  assert.equal(result.statusCode,403);
  result=await call(store,'PUT',{id,ownerKey,expectedVersion:version,action:'release',set:initial,questionIds:['q1']});
  assert.equal(result.statusCode,200);
  assert.equal((await call(store,'GET',id)).body.answers[0].answer,'SOS');
  assert.equal((await call(store,'PUT',{id,ownerKey,expectedVersion:version,action:'sync',baseFingerprint:setFingerprint,set:{...initial,revision:2}})).statusCode,409);
  const inspected=await call(store,'PUT',{id,ownerKey,expectedVersion:version,action:'inspect'});
  assert.equal(inspected.statusCode,200); assert.equal(inspected.body.version,2); assert.equal(inspected.body.setFingerprint,setFingerprint);
  result=await call(store,'PUT',{id,ownerKey,expectedVersion:2,action:'sync',baseFingerprint:setFingerprint,set:{...initial,revision:2,questions:[{...initial.questions[0],prompt:'.-',answer:'A'}]}});
  assert.equal(result.statusCode,200);
  assert.deepEqual((await call(store,'GET',id)).body.answers,[]);
  assert.equal((await call(store,'DELETE',{id,ownerKey,expectedVersion:3})).statusCode,200);
  assert.equal((await call(store,'GET',id)).statusCode,404);
});

test('invalid papers and expiry are refused', async () => {
  const store=createMemoryActivityStore();
  assert.equal((await call(store,'POST',{set:{...initial,questions:[]}})).statusCode,400);
  assert.equal((await call(store,'POST',{set:initial,expiresAt:Date.now()-1})).statusCode,400);
  assert.equal((await call(store,'GET','invalid')).statusCode,400);
});
