import { types, encoded, compileQuestion, symbolSvg } from '../js/paper-codec.js';
import { validateQuestionSet, publicQuestionSet, validId } from '../shared/question-set.js';

const $=id=>document.getElementById(id);
// Shared zh-Hant / English dictionary loaded by /js/i18n.js.
const tr=value=>(window.SKW_I18N?window.SKW_I18N.t(value):String(value==null?'':value));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LEADER_KEY='skw_e_paper_sets_v1', MEMBER_KEY='skw_e_paper_member_v1';
const ID=/^[A-Za-z0-9_-]{22,64}$/;
const OWNER=/^[A-Za-z0-9_-]{43}$/;
const MAX_FILE=200000;
let token='', tokenUntil=0, lockTimer, sets=[], snapshot=null, editing=null, selected=null, shareData=null, member=null, pendingActivity='', stream=null, scanFrame=0, configPromise=null, activityBusy=false;
const status=(message,error=false)=>{ $('status').textContent=message; $('status').classList.toggle('error',error); };
const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
function getStored(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function readSets(){ snapshot=localStorage.getItem(LEADER_KEY); const list=getStored(LEADER_KEY,[]); sets=Array.isArray(list)?list:[]; }
function saveSets() {
  if(localStorage.getItem(LEADER_KEY)!==snapshot) throw Error('另一個分頁已修改題庫；請先備份並重新整理，避免覆蓋。');
  const next=JSON.stringify(sets); localStorage.setItem(LEADER_KEY,next); snapshot=next;
}
function saveMember(){ try{ localStorage.setItem(MEMBER_KEY,JSON.stringify(member)); return true; }catch{status('無法儲存作答；請檢查瀏覽器儲存空間，並先下載作答檔。',true); return false;} }
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function fileJson(file){ if(!file || file.size>MAX_FILE) throw Error('檔案太大（上限 200 KB）。'); return file.text().then(text=>JSON.parse(text)); }
function err(e){status(e?.message||'操作失敗，請稍後再試。',true)}
function checkedPrivate(s){
  if(!s || !validId(s.id) || !Number.isSafeInteger(s.revision) || s.revision<1 || typeof s.title!=='string' || !s.title.trim() || s.title.length>100 || !Array.isArray(s.questions) || !s.questions.length || s.questions.length>30) throw Error('題組格式不正確。');
  const ids=new Set();
  for(const q of s.questions){if(!validId(q.id)||ids.has(q.id)||typeof q.text!=='string'||q.text.length>160||!['decode','encode'].includes(q.direction)||!types[q.type])throw Error('題目格式不正確。');ids.add(q.id);compileQuestion(q);}
  if(s.activity && (!ID.test(s.activity.id||'')||!OWNER.test(s.activity.ownerKey||'')||!OWNER.test(s.activity.setFingerprint||'')||!Number.isSafeInteger(s.activity.version)||s.activity.version<1||!Number.isSafeInteger(s.activity.syncedRevision)||!Number.isSafeInteger(s.activity.expiresAt))) throw Error('活動管理資料無效。');
  if(!validateQuestionSet(toSet(s),{privateAnswers:true})) throw Error('題組超出支援範圍。');
  return s;
}
function toSet(s){ return {id:s.id,revision:s.revision,title:s.title.trim(),questions:s.questions.map(compileQuestion)}; }
function pub(s){return publicQuestionSet(toSet(s));}
function answerPackage(s){return {format:'scout-answers-v1',setId:s.id,revision:s.revision,answers:toSet(s).questions.map(q=>({id:q.id,answer:q.answer}))};}
function fixedPackage(s){return {format:'scout-paper-v1',set:pub(s)};}
function privatePackage(s){return {format:'scout-private-v1',set:s};}
function session(){ if(!token || Date.now()>=tokenUntil){logout(false);throw Error('領袖登入已到期，請重新登入。');} return token; }
async function apiUrl(){
  if(!configPromise) configPromise=fetch('/api/config',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(c=>{const u=new URL(c.activityApiUrl);if(u.protocol!=='https:'||u.pathname!=='/api/activity'||u.search||u.hash)throw Error();return u.href}).catch(()=>{configPromise=null;throw Error('連網活動未設定；請先完成 Cloudflare 和 Vercel 設定。')});
  return configPromise;
}
async function activityRequest(method,body){
  const url=await apiUrl(); const opts={method,cache:'no-store'};
  let target=url;
  if(method==='GET') {const u=new URL(url);u.searchParams.set('id',body);target=u.href;}
  else {opts.headers={'Content-Type':'application/json','Authorization':'Bearer '+session()};opts.body=JSON.stringify(body);if(new TextEncoder().encode(opts.body).length>32768)throw Error('連網資料超過 32 KB，請縮短題目或拆成多套。');}
  let res; try{res=await fetch(target,opts);}catch{throw Error('連網失敗，請檢查網絡、Cloudflare 設定或稍後重試。');}
  let data={};try{data=await res.json();}catch{}
  if(!res.ok){ if(res.status===401){logout(false);throw Error('領袖登入失效，請重新登入。');} const map={conflict:'活動版本衝突，請勿覆蓋；請先核對另一個領袖裝置。',set_conflict:'題組與雲端不同，請核對後處理。',not_found:'活動不存在、已結束或已過期。',not_owner:'活動管理鑰匙不正確。',storage_unavailable:'連網服務暫時不可用。',leader_not_configured:'領袖驗證服務未完成設定。'};throw Error(map[data.error]||`活動操作失敗（${res.status}，${data.error||'未知錯誤'}）。`); }
  return data;
}
function setTab(which){$('leaderArea').hidden=which!=='leader';$('memberArea').hidden=which!=='member';$('leaderTab').classList.toggle('active',which==='leader');$('memberTab').classList.toggle('active',which==='member');if(which!=='member')stopScanner();}
$('memberTab').onclick=()=>setTab('member');$('leaderTab').onclick=()=>setTab('leader');
function logout(changeTab=true){token='';tokenUntil=0;clearTimeout(lockTimer);$('leaderWorkspace').hidden=true;$('loginPanel').hidden=false;$('password').value='';$('editor').hidden=true;$('manage').hidden=true;if(changeTab)setTab('member');}
$('logout').onclick=()=>logout();
$('login').onclick=async()=>{try{const p=$('password').value;if(!p)throw Error('請輸入領袖密碼。');const r=await fetch('/api/leader',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p}),cache:'no-store'});const data=await r.json();$('password').value='';if(!r.ok)throw Error(({incorrect:'密碼不正確。',rate_limited:'嘗試次數過多，請稍後再試。',not_configured:'伺服器尚未設定領袖密碼。',signing_not_configured:'伺服器尚未設定獨立簽署密鑰。'})[data.error]||'登入失敗，請檢查伺服器設定。');token=data.token;tokenUntil=Date.now()+Math.min(data.durationSeconds,86400)*1000;lockTimer=setTimeout(()=>{logout(false);status('領袖登入已到期，請重新登入。');},Math.min(data.durationSeconds,86400)*1000);readSets();$('loginPanel').hidden=true;$('leaderWorkspace').hidden=false;renderSets();status('領袖模式已解鎖。');}catch(e){err(e)}};
function renderSets(){
 $('setList').innerHTML=sets.length?sets.map(s=>`<div class="set-card"><h3 data-i18n-skip>${esc(s.title)}</h3><p>${Array.isArray(s.questions)?s.questions.length:0} 題 · 版本 ${esc(s.revision)}${s.activity?' · 已連結活動':''}</p><button type="button" class="secondary" data-select="${esc(s.id)}">開啟題組</button></div>`).join(''):'<p>尚未建立題組。</p>';
 if(window.SKW_I18N)window.SKW_I18N.applyTranslations($('setList'));
 $('setList').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{try{session();selected=b.dataset.select;checkedPrivate(getSelected());renderManage();$('manage').scrollIntoView({behavior:'smooth'});}catch(e){err(e)}});
}
function getSelected(){const s=sets.find(x=>x.id===selected);if(!s)throw Error('找不到題組，請重新整理。');return s;}
function newDraft(){return {id:randomId(),revision:1,title:'',questions:[{id:randomId(),text:'',type:'Morse',direction:'decode'}],activity:null};}
function beginEdit(s){session();editing=structuredClone(s);$('setTitle').value=editing.title;renderEditor();$('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth'});}
$('newSet').onclick=()=>{try{if(sets.length>=50)throw Error('最多保存 50 套題組。');beginEdit(newDraft());}catch(e){err(e)}};
$('importExisting').onclick=()=>{try{const old=getStored('skw_test_questions',[]);if(!Array.isArray(old)||!old.length)throw Error('現有試卷沒有題目。');if(old.length>30)throw Error('現有試卷超過 30 題，請先減少題目。');const draft=newDraft();draft.title='匯入的試卷';draft.questions=old.map(q=>({id:randomId(),text:String(q.text||'').slice(0,160),type:types[q.type]?q.type:'Morse',direction:q.direction==='decode'?'encode':'decode'}));beginEdit(draft);status('已匯入現有試卷；請檢查每題再儲存。電子試卷使用固定 SCOUT／位移 3，不使用輪播或音訊設定。');}catch(e){err(e)}};
function collectEditor(){
  editing.title=$('setTitle').value.trim();
  $('questionEditor').querySelectorAll('[data-q]').forEach(el=>{const q=editing.questions[Number(el.dataset.q)];if(q)q[el.dataset.field]=el.value;});
}
function renderEditor(){
 $('questionEditor').innerHTML=editing.questions.map((q,i)=>`<div class="question"><h3>第 ${i+1} 題</h3><label for="qtext${i}">英文訊息</label><input id="qtext${i}" data-q="${i}" data-field="text" maxlength="160" value="${esc(q.text)}" placeholder="例如 SOS"><div class="row"><div><label for="qtype${i}">密碼種類</label><select id="qtype${i}" data-q="${i}" data-field="type">${Object.entries(types).map(([k,v])=>`<option value="${k}" ${q.type===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div><label for="qdir${i}">題目方向</label><select id="qdir${i}" data-q="${i}" data-field="direction"><option value="decode" ${q.direction==='decode'?'selected':''}>顯示密碼，翻譯英文</option><option value="encode" ${q.direction==='encode'?'selected':''}>顯示英文，寫成密碼</option></select></div><button type="button" class="danger" data-remove="${i}">刪除本題</button></div></div>`).join('');
 $('questionEditor').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{collectEditor();editing.questions.splice(Number(b.dataset.remove),1);renderEditor();});
 if(window.SKW_I18N)window.SKW_I18N.applyTranslations($('questionEditor'));
}
$('addQuestion').onclick=()=>{collectEditor();if(editing.questions.length>=30)return status('每套最多 30 題。',true);editing.questions.push({id:randomId(),text:'',type:'Morse',direction:'decode'});renderEditor();};
$('cancelEdit').onclick=()=>{$('editor').hidden=true;editing=null;};
$('saveSet').onclick=()=>{try{session();collectEditor();const old=sets.find(s=>s.id===editing.id);editing.revision=old?old.revision+1:1;checkedPrivate(editing);if(!old&&sets.length>=50)throw Error('最多保存 50 套題組。');const previous=sets;sets=old?sets.map(s=>s.id===editing.id?editing:s):[...sets,editing];try{saveSets()}catch(e){sets=previous;throw e;}selected=editing.id;editing=null;$('editor').hidden=true;renderSets();renderManage();status('已儲存在此瀏覽器。連網活動如有修改，需手動同步。');}catch(e){err(e)}};
$('editSet').onclick=()=>{try{beginEdit(getSelected())}catch(e){err(e)}};
$('privateBackup').onclick=()=>{try{session();download(privatePackage(getSelected()),'scout-private-backup.json');status('私人備份含答案及活動管理鑰匙，請妥善保管，切勿發給成員。');}catch(e){err(e)}};
$('deleteSet').onclick=()=>{try{session();const s=getSelected();if(!confirm(tr(s.activity?'此題組仍連結活動。刪除本機資料不會結束雲端活動，亦會失去管理鑰匙。確定刪除？':'確定刪除此本機題組？')))return;const before=sets;sets=sets.filter(x=>x.id!==s.id);try{saveSets()}catch(e){sets=before;throw e}selected=null;$('manage').hidden=true;renderSets();}catch(e){err(e)}};
$('backupFile').onchange=async e=>{try{session();const data=await fileJson(e.target.files[0]);if(data.format!=='scout-private-v1')throw Error('不是私人備份檔。');const s=checkedPrivate(data.set);const existing=sets.find(x=>x.id===s.id);if(!existing&&sets.length>=50)throw Error('最多保存 50 套題組。');if(!confirm(tr(existing?'此題組已存在。還原將取代本機版本，包括其活動管理資料；請先備份原版本並核對。確定還原？':'私人備份包含未公布答案及活動管理鑰匙。確定匯入？')))return;const before=sets;sets=existing?sets.map(x=>x.id===s.id?s:x):[...sets,s];try{saveSets()}catch(error){sets=before;throw error}renderSets();status('已還原私人備份。');}catch(e){err(e)}finally{e.target.value=''}};
function renderManage(){const s=getSelected();$('manage').hidden=false;$('shareBox').hidden=true;$('manageTitle').textContent=s.title;$('manageMeta').textContent=`${s.questions.length} 題 · 題組版本 ${s.revision} · ${s.activity?'連網活動版本 '+s.activity.version:'尚未建立活動'}`;
 const a=s.activity;
 $('activityManage').innerHTML=a?`<p>活動 ID：<code>${esc(a.id)}</code> · 到期：${esc(new Date(a.expiresAt).toLocaleString())} · ${a.syncedRevision===s.revision?'本機題組已同步':'本機有未同步修改'}</p><div class="row"><button data-action="activityShare">分享活動 QR</button><button class="secondary" data-action="sync">同步題目</button><button class="secondary" data-action="release">公布全部答案</button><button class="secondary" data-action="extend">延長期限</button><button class="secondary" data-action="inspect">重新取得活動版本</button><button class="danger" data-action="end">結束活動</button><button class="secondary" data-action="unlink">解除本機活動連結</button></div>`:`<label for="expiryDays">活動有效期（日，1–365）</label><div class="row"><input id="expiryDays" type="number" min="1" max="365" value="7"><button data-action="create">建立連網活動</button></div>`;
 $('activityManage').querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>runActivity(b.dataset.action));
 if(window.SKW_I18N)window.SKW_I18N.applyTranslations($('activityManage'));
}
function encodeHash(value){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decodeHash(value){if(value.length>MAX_FILE*2||!/^[A-Za-z0-9_-]+$/.test(value))throw Error('分享碼不正確或太長。');const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
function showShare(title,link,data,help){shareData=data;$('shareTitle').textContent=title;$('shareHelp').textContent=help;$('shareLink').value=link;$('downloadShare').hidden=!data;$('shareBox').hidden=false;$('qr').innerHTML='';if(link.length>1000){$('shareHelp').textContent+=' 連結過長，不產生 QR；請下載 JSON。';return;}try{if(!window.QRCode)throw Error();new window.QRCode($('qr'),{text:link,width:240,height:240,correctLevel:window.QRCode.CorrectLevel.M});}catch{$('qr').innerHTML='';$('shareHelp').textContent+=' 無法產生可掃描 QR，請使用連結或 JSON。';}}
function fixedShare(answers){try{session();const s=checkedPrivate(getSelected());const data=answers?answerPackage(s):fixedPackage(s);const link=location.origin+location.pathname+'#'+(answers?'answers':'paper')+'='+encodeHash(data);showShare(answers?'答案分享':'題目分享',link,data,answers?'請在適當時間才分享答案，需先匯入同一版本試卷。':'不包含答案欄位。請實際測試 QR，過密時使用 JSON。');}catch(e){err(e)}}
$('fixedQuestions').onclick=()=>fixedShare(false);$('fixedAnswers').onclick=()=>fixedShare(true);
$('downloadShare').onclick=()=>{if(shareData)download(shareData,shareData.format==='scout-answers-v1'?'scout-answers.json':'scout-paper.json')};
$('copyShare').onclick=async()=>{try{await navigator.clipboard.writeText($('shareLink').value);status('已複製連結。')}catch{ $('shareLink').select();status('請手動複製已選取的連結。');}};
async function runActivity(action){if(activityBusy){status('活動操作進行中，請稍候。');return;}activityBusy=true;try{
 session();const s=checkedPrivate(getSelected()), a=s.activity;
 if(action==='unlink'){if(!confirm(tr('只解除此裝置的活動連結，不會結束雲端活動。若沒有私人備份，可能無法再管理活動。確定？')))return;const before=sets;sets=sets.map(x=>x.id===s.id?{...s,activity:null}:x);try{saveSets()}catch(e){sets=before;throw e}renderSets();renderManage();status('已解除本機活動連結；雲端活動仍存在直至結束或到期。');return;}
 if(action==='activityShare'){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('activity',a.id);showShare('活動分享',u.href,null,'成員開啟後須按「更新題目及答案」；活動連結只含讀取 ID。');return;}
 if(localStorage.getItem(LEADER_KEY)!==snapshot)throw Error('另一個分頁已修改題庫，請先備份並重新整理。');
 let method='PUT', body, result;
 if(action==='create'){const days=Number($('expiryDays').value);if(!Number.isInteger(days)||days<1||days>365)throw Error('有效期需為 1 至 365 日。');if(!confirm(tr('建立連網活動會把題目及答案儲存在 Cloudflare。確定繼續？')))return;method='POST';body={set:toSet(s),expiresAt:Date.now()+days*86400000};}
 else {body={id:a.id,ownerKey:a.ownerKey,expectedVersion:a.version};
  if(action==='inspect')Object.assign(body,{action:'inspect'});
  if(action==='sync'){if(a.syncedRevision===s.revision)throw Error('本機題組沒有新修改。');if(!confirm(tr('同步後，之前已公布的答案會清除。確定？')))return;Object.assign(body,{action:'sync',baseFingerprint:a.setFingerprint,set:toSet(s)});}
  if(action==='release'){if(a.syncedRevision!==s.revision)throw Error('請先同步本機修改，再公布答案。');if(!confirm(tr('公布全部答案？已下載的答案無法收回。')))return;Object.assign(body,{action:'release',set:toSet(s),questionIds:s.questions.map(q=>q.id)});}
  if(action==='extend'){const input=prompt(tr('延長後距離現在的有效期（日，必須比現有到期時間長，最多 365 日）'),'30');if(input===null)return;const days=Number(input);if(!Number.isInteger(days)||days<1||days>365)throw Error('有效期需為 1 至 365 日。');Object.assign(body,{action:'extend',expiresAt:Date.now()+days*86400000});}
  if(action==='end'){if(!confirm(tr('確定結束連網活動？舊 QR 將失效，已下載的內容不能收回。')))return;method='DELETE';}
 }
 result=await activityRequest(method,body);
 if(action==='inspect' && result.setFingerprint!==a.setFingerprint)throw Error('雲端題組與本機記錄不同，不能自動覆蓋；請使用最後同步的領袖裝置處理。');
 const next=structuredClone(s);
 if(action==='end')next.activity=null;
 else next.activity={id:result.id,ownerKey:action==='create'?result.ownerKey:a.ownerKey,version:result.version,setFingerprint:result.setFingerprint,expiresAt:result.expiresAt,syncedRevision:action==='create'||action==='sync'?s.revision:a.syncedRevision};
 const before=sets;sets=sets.map(x=>x.id===s.id?next:x);try{saveSets()}catch(e){sets=before;download(privatePackage(next),'scout-recovery-private.json');throw Error('雲端操作已成功，但本機保存失敗或另一分頁已修改。已嘗試下載私人恢復檔，請立即保管並核對，不要再次建立活動。');}
 renderSets();renderManage();status(action==='create'?'活動已建立。請立即下載私人備份以保存管理鑰匙。':'活動操作成功。成員需自行按更新。');
 }catch(e){err(e)}finally{activityBusy=false}}
function safePublic(set){const normalized=validateQuestionSet(set);if(!normalized)throw Error('試卷格式無效。');return normalized;}
function safeAnswers(answers,set){if(!Array.isArray(answers)||answers.length>set.questions.length)throw Error('答案格式無效。');const seen=new Set();return answers.map(a=>{if(!a||!set.questions.some(q=>q.id===a.id)||seen.has(a.id)||typeof a.answer!=='string'||a.answer.length>2000)throw Error('答案格式無效。');seen.add(a.id);return {id:a.id,answer:a.answer};});}
function receive(set,answers,source,version){
 set=safePublic(set);answers=safeAnswers(answers||[],set);
 if(member?.set){
  if(member.set.id===set.id && set.revision<member.set.revision)throw Error('這是較舊版本的題目，未有取代本機內容。');
  if(member.set.id===set.id && set.revision===member.set.revision && JSON.stringify(member.set)!==JSON.stringify(set))throw Error('相同版本的題目內容不同，已拒絕取代。');
  if((member.set.id!==set.id||member.set.revision!==set.revision) && !confirm(tr('載入其他題組或新版本會清除目前作答。請先下載作答檔，確定繼續？')))return false;
 }
 const same=member?.set?.id===set.id && member.set.revision===set.revision;
 member={set,answers,source,version:version||0,name:same?member.name:'',responses:same?member.responses:{}};
 saveMember();renderMember();return true;
}
function receivePackage(data){
 if(data?.format==='scout-paper-v1'){if(receive(data.set,[],{type:'fixed'},0))status('已收取固定試卷。');return;}
 if(data?.format==='scout-answers-v1'){
  if(!member?.set || data.setId!==member.set.id || data.revision!==member.set.revision)throw Error('答案不屬於目前試卷版本；請先讀取相同版本的題目。');
  const answers=safeAnswers(data.answers,member.set);if(!confirm(tr('載入答案後會顯示參考答案，確定繼續？')))return;
  member.answers=answers;saveMember();renderMember();status('已載入參考答案。');return;
 }
 throw Error('不是支援的試卷或答案檔。');
}
function openText(value){
 const text=value.trim();if(!text)throw Error('請貼上連結。');
 if(text.startsWith('{')){receivePackage(JSON.parse(text));return;}
 const u=new URL(text,location.href);
 if(u.origin!==location.origin || u.pathname.replace(/index\.html$/, '')!==location.pathname.replace(/index\.html$/, ''))throw Error('只接受本站電子試卷連結；請勿貼上其他網站的連結。');
 const id=u.searchParams.get('activity');
 if(id){if(!ID.test(id))throw Error('活動 ID 格式不正確。');pendingActivity=id;renderOnline();status('已載入活動 ID；請按「更新題目及答案」才會連網讀取。');return;}
 const params=new URLSearchParams(u.hash.slice(1));const hash=params.get('paper')||params.get('answers');if(!hash)throw Error('連結不含試卷資料。');receivePackage(decodeHash(hash));
}
function renderOnline(){const id=pendingActivity||member?.source?.activityId||'';$('onlineControls').hidden=!id;$('activityId').textContent=id;}
$('openShare').onclick=()=>{try{openText($('shareInput').value)}catch(e){err(e)}};
$('refreshActivity').onclick=async()=>{try{
 const id=pendingActivity||member?.source?.activityId;if(!id||!ID.test(id))throw Error('活動 ID 無效。');
 const data=await activityRequest('GET',id);if(data.id!==id||!Number.isSafeInteger(data.version)||data.version<1||!Number.isSafeInteger(data.expiresAt))throw Error('活動回應格式無效。');
 if(member?.source?.activityId===id && data.version<member.version)throw Error('收到較舊的活動版本，已拒絕取代。');
 if(receive(data.set,data.answers,{type:'activity',activityId:id,expiresAt:data.expiresAt},data.version)){pendingActivity='';renderOnline();status('已手動更新題目及已公布答案。');}
 }catch(e){err(e)}};
function renderPrompt(q){if(q.kind==='text')return `<div class="prompt">${esc(q.prompt)}</div>`;return `<div class="prompt symbols">${q.prompt.split(' ').map(t=>t==='/'?'<span class="space" aria-label="空格"></span>':symbolSvg(q.kind,t)).join('')}</div>`;}
function renderMember(){
 $('memberPaper').hidden=!member?.set;if(!member?.set){renderOnline();return;}
 $('paperTitle').textContent=member.set.title;$('paperMeta').textContent=`${member.set.questions.length} 題 · 題組版本 ${member.set.revision}${member.source?.type==='activity'?' · 連網活動，版本 '+member.version:' · 固定試卷'}`;$('memberName').value=member.name||'';
 $('memberQuestions').innerHTML=member.set.questions.map((q,i)=>{const ans=member.answers?.find(a=>a.id===q.id);return `<article class="question"><h3>第 ${i+1} 題 · ${esc(q.label)}</h3>${renderPrompt(q)}<label for="response${i}">你的答案</label><textarea id="response${i}" rows="2" maxlength="2000" data-response="${esc(q.id)}" placeholder="輸入你的答案；符號題可描述或另附圖像">${esc(member.responses?.[q.id]||'')}</textarea>${ans?`<p class="small">參考答案</p><div class="answer" data-i18n-skip>${esc(ans.answer)}</div>`:'<p class="small">尚未提供參考答案</p>'}</article>`}).join('');
 if(window.SKW_I18N)window.SKW_I18N.applyTranslations($('memberPaper'));
 $('memberQuestions').querySelectorAll('[data-response]').forEach(el=>el.oninput=()=>{member.responses[el.dataset.response]=el.value;saveMember()});renderOnline();
}
$('memberName').oninput=e=>{if(member){member.name=e.target.value;saveMember();}};
$('exportSubmission').onclick=()=>{if(!member?.set)return;download({format:'scout-submission-v1',setId:member.set.id,revision:member.set.revision,title:member.set.title,name:member.name||'',responses:member.set.questions.map(q=>({id:q.id,label:q.label,response:member.responses[q.id]||''}))},'scout-submission.json');status('已下載作答檔，請自行傳送給領袖。');};
$('clearMember').onclick=()=>{if(!confirm(tr('移除此裝置的題目及作答？請先下載作答檔。')))return;member=null;pendingActivity='';try{localStorage.removeItem(MEMBER_KEY)}catch{}renderMember();status('已移除本機試卷。');};
$('submissionFile').onchange=async e=>{try{session();const data=await fileJson(e.target.files[0]);if(data?.format!=='scout-submission-v1'||!validId(data.setId)||!Number.isSafeInteger(data.revision)||typeof data.title!=='string'||data.title.length>100||typeof data.name!=='string'||data.name.length>60||!Array.isArray(data.responses)||data.responses.length>30||!data.responses.every(r=>validId(r.id)&&typeof r.label==='string'&&r.label.length<=100&&typeof r.response==='string'&&r.response.length<=2000))throw Error('作答檔格式無效。');const matched=sets.find(s=>s.id===data.setId);let source=matched&&matched.revision===data.revision?toSet(matched):null;
 $('submissionView').innerHTML=`<div class="question"><h3>作答檔：<span data-i18n-skip>${esc(data.title)} · ${esc(data.name||'未填姓名')}</span></h3><p>${esc(source?'已找到相同版本題組，可供人工批閱。':'本機沒有相同版本題組，僅顯示作答，不顯示答案。')}</p>${data.responses.map((r,i)=>{const answer=source?.questions.find(q=>q.id===r.id)?.answer;return `<p><strong>第 ${i+1} 題 · ${esc(r.label)}</strong><br>成員：<span data-i18n-skip>${esc(r.response||'（未作答）')}</span><br>${answer?'參考答案：<span data-i18n-skip>'+esc(answer)+'</span>':''}</p>`}).join('')}</div>`;
 if(window.SKW_I18N)window.SKW_I18N.applyTranslations($('submissionView'));status('已開啟作答檔；不會自動評分或上傳。');}catch(e){err(e)}finally{e.target.value=''}};
function scanImage(source){const canvas=document.createElement('canvas');const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;if(!w||!h||w*h>40000000)throw Error('無法讀取圖片或圖片尺寸過大。');const ratio=Math.min(1,1600/Math.max(w,h));canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);const data=ctx.getImageData(0,0,canvas.width,canvas.height);return window.jsQR?.(data.data,canvas.width,canvas.height)?.data||'';}
$('memberFile').onchange=async e=>{const file=e.target.files[0];try{if(!file) return;if(file.size>MAX_FILE*20)throw Error('圖片或檔案過大。');if(file.type.startsWith('image/')){const objectUrl=URL.createObjectURL(file);try{const image=new Image();image.src=objectUrl;await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('無法讀取圖片。'))});const text=scanImage(image);if(!text)throw Error('未能讀取 QR 圖片，請嘗試更清晰的圖片。');openText(text)}finally{URL.revokeObjectURL(objectUrl)}}else receivePackage(await fileJson(file));}catch(e){err(e)}finally{e.target.value=''}};
function stopScanner(){cancelAnimationFrame(scanFrame);scanFrame=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('camera').srcObject=null;$('scanner').hidden=true;}
$('stopScan').onclick=stopScanner;
$('scan').onclick=async()=>{try{if(!window.jsQR||!navigator.mediaDevices?.getUserMedia)throw Error('此瀏覽器無法使用相機；請匯入 QR 圖片或貼上連結。');stopScanner();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});$('scanner').hidden=false;$('camera').srcObject=stream;await $('camera').play();const tick=()=>{if(!stream)return;try{const text=scanImage($('camera'));if(text){stopScanner();openText(text);return;}}catch(e){if($('camera').readyState>=2){stopScanner();err(e);return;}}scanFrame=requestAnimationFrame(tick)};tick();}catch(e){stopScanner();err(e)}};
window.addEventListener('pagehide',stopScanner);
try{readSets();const stored=getStored(MEMBER_KEY,null);if(stored?.set){const set=safePublic(stored.set);const answers=safeAnswers(stored.answers||[],set);if(stored.source?.type==='activity'&&!ID.test(stored.source.activityId))throw Error('活動 ID 無效。');const responses={};for(const q of set.questions){const value=stored.responses?.[q.id];if(typeof value==='string')responses[q.id]=value.slice(0,2000);}member={...stored,set,answers,responses,name:typeof stored.name==='string'?stored.name.slice(0,60):''};}renderMember();const initial=new URL(location.href);const id=initial.searchParams.get('activity');if(id){if(!ID.test(id))throw Error('活動 ID 格式無效。');pendingActivity=id;renderOnline();status('請按「更新題目及答案」才會連網讀取。');}else if(initial.hash){openText(initial.href);history.replaceState(null,'',location.pathname);} }catch(e){err(e)}
// Cache only the electronic-paper shell. API and activity data are never cached
// by the service worker; users explicitly choose when to update an activity.
if ('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) {
  navigator.serviceWorker.register('/papers/sw.js', {scope:'/papers/'}).catch(()=>{});
}
