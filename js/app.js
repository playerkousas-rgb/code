// ===================== DATA =====================
const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
const SEMAPHORE_MAP = {'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png','I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png','Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png','Y':'y.png','Z':'z.png'};
const SEM_ANGLES = {'A':[180,225],'B':[180,270],'C':[180,315],'D':[180,0],'E':[0,45],'F':[0,90],'G':[0,135],'H':[225,270],'I':[225,315],'J':[90,0],'K':[225,0],'L':[225,45],'M':[225,90],'N':[225,135],'O':[270,315],'P':[270,0],'Q':[270,45],'R':[270,90],'S':[270,135],'T':[315,0],'U':[315,45],'V':[0,90],'W':[45,90],'X':[45,135],'Y':[315,90],'Z':[135,90]};
const BRAILLE_MAP = {'A':[1],'B':[1,2],'C':[1,4],'D':[1,4,5],'E':[1,5],'F':[1,2,4],'G':[1,2,4,5],'H':[1,2,5],'I':[2,4],'J':[2,4,5],'K':[1,3],'L':[1,2,3],'M':[1,3,4],'N':[1,3,4,5],'O':[1,3,5],'P':[1,2,3,4],'Q':[1,2,3,4,5],'R':[1,2,3,5],'S':[2,3,4],'T':[2,3,4,5],'U':[1,3,6],'V':[1,2,3,6],'W':[2,4,5,6],'X':[1,3,4,6],'Y':[1,3,4,5,6],'Z':[1,3,5,6]};
const CANGJIE_ROOTS = {'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈','J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口','S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'};
const NATO_MAP = {'A':'Alpha','B':'Bravo','C':'Charlie','D':'Delta','E':'Echo','F':'Foxtrot','G':'Golf','H':'Hotel','I':'India','J':'Juliett','K':'Kilo','L':'Lima','M':'Mike','N':'November','O':'Oscar','P':'Papa','Q':'Quebec','R':'Romeo','S':'Sierra','T':'Tango','U':'Uniform','V':'Victor','W':'Whiskey','X':'X-ray','Y':'Yankee','Z':'Zulu'};
const PINYIN_MAP = {'A':'ā','B':'bēi','C':'cī','D':'dī','E':'ē','F':'éf','G':'gē','H':'hēi','I':'ī','J':'jiē','K':'kēi','L':'ēl','M':'ēm','N':'ēn','O':'ō','P':'pī','Q':'qiū','R':'ār','S':'ēs','T':'tī','U':'ū','V':'vī','W':'dá bū liú','X':'ēi kè sī','Y':'wāi','Z':'zèi'};
const JYUTPING_MAP = {'A':'ei1','B':'bi1','C':'si1','D':'di1','E':'i1','F':'ef1','G':'ze1','H':'eik1 si2','I':'aai1','J':'ze1','K':'kei1','L':'e1 lou2','M':'em1','N':'en1','O':'o1','P':'pi1','Q':'kiu1','R':'aa1 lou2','S':'e1 si2','T':'ti1','U':'ju1','V':'wi1','W':'daa1 bou2 liu4','X':'ik1 si2','Y':'waai1','Z':'zei1'};
const PHONE_LOOKUP = {}; const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });
const CHINESE_DICTIONARY = {'昌':'AA','明':'AB','童':'YT','軍':'BW','海':'EY','山':'U','天':'MK','地':'GP','人':'O'};

// ===================== STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0, projTimer = null, audioCtx = null, natoTimer = null;
let peer = null, hostConn = null, connections = [], players = {}, buzzQueue = [], gameMode = 'idle', myPeerId = null, shakeWatcher = null;

const $ = (id) => document.getElementById(id);
const showToast = (m) => { const t = $('toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); };

// ===================== GET SPEED =====================
function getSpeed() {
  var s = document.getElementById('projSpeedOverlay');
  if(!s || s.value === undefined) s = document.getElementById('projSpeed');
  return s ? parseInt(s.value) : 1200;
}

// ===================== RENDERERS =====================
function renderStickFigure(c, color, size) {
  color=color||"white"; size=size||80;
  const a = SEM_ANGLES[c.toUpperCase()];
  if(!a) return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:2rem">${c}</div>`;
  var h = `<svg width="${size}" height="${size*1.2}" viewBox="0 0 100 120"><circle cx="50" cy="25" r="10" fill="none" stroke="${color}" stroke-width="4"/><line x1="50" y1="35" x2="50" y2="75" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="35" y2="110" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="65" y2="110" stroke="${color}" stroke-width="4"/>`;
  a.forEach((ang,i)=>{ var rad=(ang-90)*Math.PI/180; h+=`<line x1="50" y1="45" x2="${50+Math.cos(rad)*45}" y2="${45+Math.sin(rad)*45}" stroke="${color==='white'?(i===0?'#ffcc00':'#00d2ff'):'black'}" stroke-width="6" stroke-linecap="round"/>`; });
  return h+'</svg>';
}

function renderDoll(c, size) {
  size=size||100; const src=SEMAPHORE_MAP[c.toUpperCase()];
  return src ? `<img src="images/${src}" style="width:${size}px;height:${size}px;object-fit:contain;">` : renderStickFigure(c,"white",size);
}

function renderBraille(c) {
  const d = BRAILLE_MAP[c.toUpperCase()]||[];
  var h='<div class="braille-char">';
  for(var i=1;i<=6;i++) h+=`<div class="braille-dot ${d.includes(i)?'active':''}"></div>`;
  return h+'</div>';
}

function renderPigpenSVG(c, color) {
  color=color||"#ffcc00";
  const maps={'A':"M35,10 L35,35 L10,35",'B':"M10,10 L10,35 L35,35 L35,10",'C':"M10,10 L10,35 L35,35",'D':"M10,10 L35,10 L35,35 L10,35",'E':"M10,10 L35,10 L35,35 L10,35 Z",'F':"M35,10 L10,10 L10,35 L35,35",'G':"M35,35 L35,10 L10,10",'H':"M10,35 L10,10 L35,10 L35,35",'I':"M10,35 L10,10 L35,10",'J':["M35,10 L35,35 L10,35",true],'K':["M10,10 L10,35 L35,35 L35,10",true],'L':["M10,10 L10,35 L35,35",true],'M':["M10,10 L35,10 L35,35 L10,35",true],'N':["M10,10 L35,10 L35,35 L10,35 Z",true],'O':["M35,10 L10,10 L10,35 L35,35",true],'P':["M35,35 L35,10 L10,10",true],'Q':["M10,35 L10,10 L35,10 L35,35",true],'R':["M10,35 L10,10 L35,10",true],'S':"M10,10 L22.5,22.5 L35,10",'T':"M35,10 L22.5,22.5 L35,35",'U':"M10,35 L22.5,22.5 L35,35",'V':"M10,10 L22.5,22.5 L10,35",'W':["M10,10 L22.5,22.5 L35,10",true,{x:22.5,y:15}],'X':["M35,10 L22.5,22.5 L35,35",true,{x:30,y:22.5}],'Y':["M10,35 L22.5,22.5 L35,35",true,{x:22.5,y:30}],'Z':["M10,10 L22.5,22.5 L10,35",true,{x:15,y:22.5}]};
  var data=maps[c.toUpperCase()]; if(!data) return `<span>${c}</span>`;
  var path=Array.isArray(data)?data[0]:data, dot=Array.isArray(data)&&data[1], dp=(Array.isArray(data)&&data[2])||{x:22.5,y:22.5};
  return `<svg width="40" height="40" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${dp.x}" cy="${dp.y}" r="${dot?3:0}" fill="${color}"/></svg>`;
}

function encodeChinese(text) { return text.split('').map(c=>CHINESE_DICTIONARY[c]||c).join(' ').toUpperCase(); }

function getEncoded(text, type, key, shift) {
  key=key||'SCOUT'; shift=shift||3; const t=text.toUpperCase();
  switch(type) {
    case 'Morse': return t.split('').map(c=>MORSE_CODE[c]||c).join(' ');
    case 'Grid': return t.split('').map(c=>{if(c===' ')return '/';var i="ABCDEFGHIKLMNOPQRSTUVWXY".indexOf(c);return i===-1?c:key[i%5]+key[Math.floor(i/5)];}).join(' ');
    case 'Phone': return t.split('').map(c=>{var i=PHONE_LOOKUP[c];return i?i.key+i.presses:c;}).join('  ');
    case 'Caesar': return t.replace(/[A-Z]/g,c=>String.fromCharCode(65+(c.charCodeAt(0)-65+shift)%26));
    case 'Atbash': return t.replace(/[A-Z]/g,c=>String.fromCharCode(90-(c.charCodeAt(0)-65)));
    case 'Reverse': return text.split('').reverse().join('').toUpperCase();
    case 'NATO': return t.split('').map(c=>NATO_MAP[c]||c).join(' ');
    case 'Cangjie': case 'Quick': return encodeChinese(text);
    default: return t;
  }
}

// ===================== PROJECTION =====================
function clearProj() {
  clearInterval(projTimer); projTimer=null;
  if(audioCtx){audioCtx.close();audioCtx=null;}
  if(natoTimer){clearInterval(natoTimer);natoTimer=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  var pb=$('btnProjPlay'); if(pb) pb.classList.add('hidden');
}

function showProjection() {
  clearProj(); var q=testQuestions[currentProjIdx]; if(!q)return;
  $('projectionOverlay').style.display='flex';
  $('projCounter').textContent=(currentProjIdx+1)+' / '+testQuestions.length;
  var hasCarousel=(q.type==='Morse'||q.type==='Semaphore'||q.type==='NATO')&&q.display==='carousel';
  var hasAudio=(q.type==='Morse'||q.type==='NATO')&&q.display==='audio';
  var pb=$('btnProjPlay');
  if(hasCarousel||hasAudio){if(pb)pb.classList.remove('hidden');if(pb)pb.textContent=q.display==='audio'?'🔊 播放音訊':'▶ 開始輪播';}
  renderProjStatic(q);
}

function renderProjStatic(q) {
  var c=$('projectionContent'), u=q.text.toUpperCase(), h='';
  if(q.display==='static'||(q.type!=='Morse'&&q.type!=='Semaphore'&&q.type!=='NATO')) {
    if(q.type==='Morse') h=`<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${getEncoded(q.text,'Morse')}</div>`;
    else if(q.type==='Semaphore'){var s=$('semPrintStyle').value;h=`<div class="flex flex-wrap justify-center gap-6">${u.split('').map(c=>c===' '?'<div class="w-16"></div>':(s==='doll'?renderDoll(c,120):renderStickFigure(c,"white",120))).join('')}</div>`;}
    else if(q.type==='Braille') h=`<div class="flex flex-wrap justify-center gap-10 scale-[2.5]">${u.split('').map(c=>c===' '?'<div class="w-10"></div>':renderBraille(c)).join('')}</div>`;
    else if(q.type==='Pigpen') h=`<div class="flex flex-wrap justify-center gap-10 scale-[3]">${u.split('').map(c=>c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
    else if(q.type==='NATO') h=`<div class="text-[5vw] font-black text-white text-center leading-relaxed">${getEncoded(q.text,'NATO').split(' ').map(w=>`<span class="inline-block mx-2 px-6 py-2 bg-white/5 rounded-2xl">${w}</span>`).join('')}</div>`;
    else h=`<div class="text-[9vw] font-black text-white text-center">${getEncoded(q.text,q.type)}</div>`;
  } else { h=`<div class="text-slate-600 text-3xl font-black">${q.display==='audio'?'聽力考核項目':'點擊下方開始輪播'}</div>`; }
  c.innerHTML=`<div class="animate-in w-full text-center">${h}</div>`;
}

// ===================== PLAY MORSE (速度可調) =====================
function playMorse(text, speedMs) {
  speedMs=speedMs||getSpeed();
  if(audioCtx)audioCtx.close(); audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  var f = 1200 / speedMs; // speedMs 100=快(×12), 5000=慢(×0.24)
  var dot = 0.04 / f, dash = 0.12 / f, gap = 0.04 / f, letterGap = 0.08 / f, wordGap = 0.25 / f;
  var t=audioCtx.currentTime, upper=text.toUpperCase();
  upper.split('').forEach(function(c){
    var code=MORSE_CODE[c];
    if(code){
      code.split('').forEach(function(s){
        var d=s==='.'?dot:dash;
        var o=audioCtx.createOscillator(), g=audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.1,t); o.start(t); o.stop(t+d); t+=d+gap;
      });
      t+=letterGap-gap;
    } else { t+=wordGap; }
  });
}

// ===================== PLAY NATO (速度可調) =====================
function playNatoAudio(text, speedMs) {
  speedMs=speedMs||getSpeed();
  if(!window.speechSynthesis){showToast('瀏覽器不支援語音');return;}
  window.speechSynthesis.cancel();
  var f=1200/speedMs;
  var intervalMs=Math.round(Math.max(100,Math.min(6000,800/f)));
  var rate=Math.max(0.2,Math.min(10,0.5+1.0*f));
  var upper=text.toUpperCase(), idx=0;
  if(natoTimer){clearInterval(natoTimer);natoTimer=null;}
  natoTimer=setInterval(function(){
    if(idx>=upper.length){clearInterval(natoTimer);natoTimer=null;return;}
    var c=upper[idx]; idx++;
    if(c===' ')return;
    var word=NATO_MAP[c];
    if(word){
      var utter=new SpeechSynthesisUtterance(word);
      utter.lang='en-US'; utter.rate=rate; utter.pitch=1.0;
      window.speechSynthesis.speak(utter);
    }
  },intervalMs);
}

// ===================== REFERENCE TABLES =====================
function buildReferenceTables() {
  var h='',chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for(var i=0;i<chars.length;i+=6){h+='<tr>';for(var j=0;j<6&&(i+j)<chars.length;j++){var c=chars[i+j];h+=`<td data-ch="${c}"><b>${c}</b><br>${MORSE_CODE[c]}</td>`;}h+='</tr>';}
  $('morseTable').innerHTML=h;
  h='';"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(function(c){h+=`<div class="flex flex-col items-center gap-1 p-2 bg-black/20 rounded border border-white/5"><span class="text-[9px] font-black text-slate-500">${c}</span><img src="images/${SEMAPHORE_MAP[c]}" class="w-10 h-10 grayscale opacity-40"></div>`;});
  $('semaphoreGrid').innerHTML=h;
  h='<div class="grid grid-cols-3 gap-2 w-48">';
  ['1','2:ABC','3:DEF','4:GHI','5:JKL','6:MNO','7:PQRS','8:TUV','9:WXYZ'].forEach(function(k){h+=`<div class="bg-black/40 p-2 rounded text-center"><div class="text-[var(--skw-gold)] font-bold text-sm">${k.split(':')[0]}</div><div class="text-[9px] text-slate-500">${k.split(':')[1]||''}</div></div>`;});
  $('phoneTableWrap').innerHTML=h+'</div>';
  var key=$('gridKey').value.toUpperCase(),alpha="ABCDEFGHIKLMNOPQRSTUVWXY";
  h=`<tr><th></th>${key.split('').map(function(k){return `<th>${k}</th>`;}).join('')}</tr>`;
  for(var r=0;r<5;r++){h+='<tr><th>'+key[r]+'</th>';for(var c2=0;c2<5;c2++){var ch=alpha[r*5+c2];h+=`<td data-ch="${ch}">${ch}</td>`;}h+='</tr>';}
  $('gridTable').innerHTML=h;
  h='<div class="grid grid-cols-9 gap-2">';
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(function(c){h+=`<div class="flex flex-col items-center gap-1">${renderBraille(c)}<span class="text-[9px] font-bold text-slate-500">${c}</span></div>`;});
  $('brailleTableWrap').innerHTML=h+'</div>';
}

function buildPigpenGrid() {
  var g=$('pigpenGrid'); if(!g)return;
  var h='';"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(function(c){h+=`<div class="flex flex-col items-center gap-1 p-2 bg-black/20 rounded border border-white/5">${renderPigpenSVG(c)}<span class="text-[9px] font-black text-slate-500">${c}</span></div>`;});
  g.innerHTML=h;
}

function updateAll() {
  var v=$('inputText').value,t=v.toUpperCase(),key=$('gridKey').value.toUpperCase();
  $('outMorse').textContent=getEncoded(v,'Morse');
  $('outSemaphore').innerHTML=t.split('').map(function(c){return c===' '?'<span class="w-8"></span>':renderStickFigure(c,"#ffcc00",60);}).join('');
  $('outPhone').textContent=getEncoded(v,'Phone');
  $('outBraille').innerHTML=t.split('').map(function(c){return c===' '?'<span class="w-8"></span>':renderBraille(c);}).join('');
  $('outPigpen').innerHTML=t.split('').map(function(c){return c===' '?'<span class="mx-2">/</span>':renderPigpenSVG(c);}).join('');
  $('outGrid').textContent=getEncoded(v,'Grid',key);
  $('outCaesar').textContent=getEncoded(v,'Caesar','',parseInt($('caesarShift').value));
  $('outAtbash').textContent=getEncoded(v,'Atbash');
  $('outReverse').textContent=getEncoded(v,'Reverse');
  $('outNato').textContent=getEncoded(v,'NATO');
  $('outCangjie').textContent=getEncoded(v,'Cangjie');
  $('outPinyin').textContent=t.split('').map(function(c){return PINYIN_MAP[c]||c;}).join(' ');
  $('outJyutping').textContent=t.split('').map(function(c){return JYUTPING_MAP[c]||c;}).join(' ');
}

// ===================== PEERJS / BUZZER =====================
function initGameHost() {
  if(typeof Peer==='undefined'){showToast('PeerJS 未載入');return;}
  try{
    peer=new Peer();
    peer.on('open',function(id){
      myPeerId=id; $('gameIdDisplay').textContent='遊戲 ID: '+id;
      var qr=$('joinQr'); qr.innerHTML='';
      try{new QRCode(qr,{text:window.location.origin+window.location.pathname+'?join='+encodeURIComponent(id),width:160,height:160});showToast('QR Code 已生成');}
      catch(e){qr.innerHTML='<p class="text-slate-400 text-xs">QR Code 載入失敗</p>';}
    });
    peer.on('connection',function(conn){
      connections.push(conn);
      conn.on('data',function(data){
        if(data.type==='join'){if(!players[data.name]){players[data.name]={name:data.name,score:0,joinedAt:Date.now()};updatePlayerList();}}
        else if(data.type==='buzz'){if(gameMode==='open'&&!buzzQueue.find(function(p){return p.name===data.name;})){buzzQueue.push({name:data.name,time:Date.now()});updateBuzzList();connections.forEach(function(c){c.send({type:'buzz_order',queue:buzzQueue.map(function(p){return p.name;})});});}}
      });
      conn.on('close',function(){connections=connections.filter(function(c){return c!==conn;});$('playerCount').textContent=connections.length+' 人連線';});
      conn.send({type:'state',gameMode:gameMode,players:Object.values(players),queue:buzzQueue.map(function(p){return p.name;})});
    });
  }catch(e){showToast('搶答系統初始化失敗');}
}

function updatePlayerList() {
  $('buzzList').innerHTML=Object.values(players).sort(function(a,b){return b.score-a.score;}).map(function(p){return `<div class="skw-card text-center p-6 mb-0"><div class="text-3xl font-black text-[var(--skw-gold)]">${p.name}</div><div class="text-slate-500 text-xs mt-2 font-bold">${p.score} 分</div></div>`;}).join('');
  $('playerCount').textContent=Object.keys(players).length+' 人連線';
}

function updateBuzzList() {
  $('buzzList').innerHTML=buzzQueue.map(function(p,i){return `<div class="skw-card text-center p-6 mb-0 ${i===0?'ring-2 ring-emerald-500':''}"><div class="text-3xl font-black ${i===0?'text-emerald-400':'text-white'}">${i===0?'🔔 ':''}${p.name}</div><div class="text-slate-500 text-xs mt-2">搶答 #${i+1}</div></div>`;}).join('');
  $('playerCount').textContent=Object.keys(players).length+' 人連線';
}

function startShakeWatcher() {
  if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){DeviceMotionEvent.requestPermission().then(function(s){if(s==='granted')startShakeListener();}).catch(function(){startShakeListener();});}
  else{startShakeListener();}
}
function startShakeListener() {
  if(shakeWatcher)return; var lx=0,ly=0,lz=0,lt=0;
  shakeWatcher=window.addEventListener('devicemotion',function(e){
    var a=e.accelerationIncludingGravity; if(!a)return;
    var x=a.x,y=a.y,z=a.z;
    if(lt===0){lx=x;ly=y;lz=z;lt=Date.now();return;}
    if(Math.abs(x-lx)+Math.abs(y-ly)+Math.abs(z-lz)>25&&gameMode==='open')sendBuzz();
    lx=x;ly=y;lz=z;lt=Date.now();
  },{frequency:100});
}
function stopShakeWatcher(){if(shakeWatcher){window.removeEventListener('devicemotion',shakeWatcher);shakeWatcher=null;}}
function sendBuzz(){if(hostConn&&gameMode==='open'){hostConn.send({type:'buzz'});$('buzzStatus').textContent='已搶答！';$('btnBuzzer').classList.add('disabled');}}

// ===================== SPEED SYNC =====================
function syncSpeed() {
  var s1=$('projSpeed'), s2=$('projSpeedOverlay'), sv1=$('projSpeedVal'), sv2=$('projSpeedOverlayVal');
  if(s1&&s2){
    s1.oninput=function(){var v=parseInt(this.value);sv1&&(sv1.textContent=(v/1000).toFixed(1)+'s');s2.value=v;sv2&&(sv2.textContent=(v/1000).toFixed(1)+'s');};
    s2.oninput=function(){var v=parseInt(this.value);sv2&&(sv2.textContent=(v/1000).toFixed(1)+'s');s1.value=v;sv1&&(sv1.textContent=(v/1000).toFixed(1)+'s');};
  }
}

// ===================== APP INIT =====================
document.addEventListener('DOMContentLoaded', function() {
  buildReferenceTables(); buildPigpenGrid(); updateAll();

  var urlParams=new URLSearchParams(window.location.search), joinId=urlParams.get('join');
  if(joinId){document.querySelector('.mode-btn.active')&&document.querySelector('.mode-btn.active').classList.remove('active');$('editorView').classList.add('hidden');$('testPaperView').classList.add('hidden');$('gameView').classList.add('hidden');$('memberView').classList.remove('hidden');$('memberView').style.display='flex';myPeerId=joinId;}

  document.querySelectorAll('.mode-btn').forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('active');});this.classList.add('active');
      var m=this.dataset.mode;
      $('editorView').classList.toggle('hidden',m!=='editor');
      $('testPaperView').classList.toggle('hidden',m!=='testpaper');
      $('gameView').classList.toggle('hidden',m!=='game');
      if(m==='testpaper') renderTestList();
      if(m==='game') initGameHost();
    };
  });

  $('mobileMenuBtn').onclick=function(){$('sidebar').classList.toggle('open');};
  $('inputText').oninput=updateAll;
  $('btnAddToTest').onclick=function(){if($('inputText').value){testQuestions.push({id:Date.now(),text:$('inputText').value,type:'Morse',display:'static'});localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));showToast('已加入');}};
  $('btnPlayMorse').onclick=function(){var t=$('inputText').value.toUpperCase();if(t)playMorse(t,getSpeed());};
  $('gridKey').oninput=function(){buildReferenceTables();updateAll();};

  // SPEED SYNC
  syncSpeed();

  // PROJECTION
  $('btnProjectTest').onclick=function(){if(testQuestions.length){currentProjIdx=0;showProjection();}};
  $('btnProjNext').onclick=function(){if(currentProjIdx<testQuestions.length-1){currentProjIdx++;showProjection();}};
  $('btnProjPrev').onclick=function(){if(currentProjIdx>0){currentProjIdx--;showProjection();}};
  $('btnExitProjection').onclick=function(){$('projectionOverlay').style.display='none';clearProj();};

  // PLAY BUTTON
  $('btnProjPlay').onclick=function(){
    var q=testQuestions[currentProjIdx]; if(!q)return;
    var text=q.text.toUpperCase(), speed=getSpeed();
    if(q.display==='audio'){
      if(q.type==='Morse'){playMorse(text,speed);return;}
      if(q.type==='NATO'){playNatoAudio(text,speed);return;}
      return;
    }
    var i=0, style=$('semPrintStyle').value;
    clearInterval(projTimer);
    projTimer=setInterval(function(){
      if(i>=text.length){clearInterval(projTimer);return;}
      var c=text[i],h='';
      if(q.type==='Morse') h=`<div class="text-[25vw] font-mono text-[var(--skw-gold)]">${MORSE_CODE[c]||c}</div>`;
      else if(q.type==='NATO') h=`<div class="text-[12vw] font-black text-white">${NATO_MAP[c]||c}</div>`;
      else h=(style==='doll'?renderDoll(c,450):renderStickFigure(c,"white",450));
      $('projectionContent').innerHTML=`<div class="animate-in flex flex-col items-center">${h}<div class="mt-16 text-slate-500 font-bold text-2xl">字母 ${i+1} / ${text.length}</div></div>`;
      i++;
    },speed);
  };

  // ===== PRINT =====
  $('btnExportPDF').onclick=function(){
    if(!testQuestions.length)return alert('請先加入題目');
    var style=$('semPrintStyle').value;
    $('printQuestions').innerHTML=testQuestions.map(function(q,idx){
      var upper=q.text.toUpperCase(),encoded='';
      if(q.type==='Semaphore') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':(style==='doll'?`<img src="images/${SEMAPHORE_MAP[c]}" class="w-16 h-16 border border-black p-0.5">`:renderStickFigure(c,"black",60));}).join('')}</div>`;
      else if(q.type==='Braille') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':renderBraille(c);}).join('')}</div>`;
      else if(q.type==='Pigpen') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':renderPigpenSVG(c,"#000");}).join('')}</div>`;
      else if(q.type==='NATO') encoded=q.display==='audio'?'<span class="text-xl italic">（聽力考核項目）</span>':`<div class="text-lg font-bold text-center">${upper.split('').map(function(c){return c===' '?'  ':NATO_MAP[c]||c;}).join(' ')}</div>`;
      else if(q.type==='Morse'&&q.display==='audio') encoded='<span class="text-xl italic">（聽力考核項目）</span>';
      else encoded=`<span class="text-2xl font-mono">${getEncoded(q.text,q.type)}</span>`;
      return `<div class="print-question"><b>Q${idx+1}. 翻譯以下密碼 (${q.type}):</b><div class="mt-6 flex items-center justify-center">${encoded}</div><div class="mt-10 border-b border-black w-full h-8"></div></div>`;
    }).join('');
    setTimeout(function(){window.print();},200);
  };

  // ===== BUZZER =====
  $('btnStartGame').onclick=function(){
    gameMode=(gameMode==='open')?'idle':'open';
    $('btnStartGame').textContent=gameMode==='open'?'🔴 關閉搶答':'🟢 開放搶答 (RESET)';
    $('btnStartGame').className=gameMode==='open'?'w-full py-5 bg-red-600 rounded-3xl font-black text-white text-xl shadow-lg':'w-full py-5 bg-emerald-600 rounded-3xl font-black text-white text-xl shadow-lg';
    if(gameMode==='open'){buzzQueue=[];updateBuzzList();connections.forEach(function(c){c.send({type:'game_open'});});}
    else{connections.forEach(function(c){c.send({type:'game_close'});});}
  };

  $('btnJoinConfirm').onclick=function(){
    var name=$('playerName').value.trim(); if(!name)return alert('請輸入姓名');
    if(!joinId&&!myPeerId)return alert('無遊戲 ID');
    try{
      if(typeof Peer==='undefined'){alert('PeerJS 未載入');return;}
      var mp=new Peer();
      mp.on('open',function(){
        var conn=mp.connect(joinId||myPeerId); hostConn=conn;
        conn.on('open',function(){conn.send({type:'join',name:name});$('memberJoinForm').classList.add('hidden');$('memberBuzzer').classList.remove('hidden');$('displayMyName').textContent=name;});
        conn.on('data',function(data){
          if(data.type==='game_open'){gameMode='open';$('buzzStatus').textContent='領袖已開放搶答！快按 BUZZ!';$('btnBuzzer').classList.remove('disabled');$('btnBuzzer').textContent='BUZZ!';}
          else if(data.type==='game_close'){gameMode='idle';$('buzzStatus').textContent='等待領袖開放...';$('btnBuzzer').classList.add('disabled');}
          else if(data.type==='buzz_order'){var i=data.queue.indexOf(name);$('buzzStatus').textContent=i===0?'你是第 1 名！':(i+1)+' 名';}
        });
      });
    }catch(e){alert('連線失敗');}
  };

  $('btnBuzzer').onclick=sendBuzz;
  $('shakeToggle').onchange=function(){if(this.checked){startShakeWatcher();showToast('搖一搖已開啟');}else{stopShakeWatcher();}};
  if(joinId){$('memberView').style.display='flex';}
});

// ===================== TEST LIST =====================
function renderTestList() {
  var list=$('testQuestionList'),labels={"Morse":"摩斯密碼","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高密碼","Grid":"座標密碼","Phone":"電話密碼","Caesar":"凱撒位移","Atbash":"反射密碼","Reverse":"倒序密碼","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
  list.innerHTML=testQuestions.map(function(q,idx){
    var hasDisplay=q.type==='Morse'||q.type==='Semaphore'||q.type==='NATO';
    var hasAudio=q.type==='Morse'||q.type==='NATO';
    return `<div class="skw-card flex flex-col md:flex-row justify-between items-center mb-0 p-5 gap-4"><div class="flex items-center gap-4 flex-wrap"><span class="text-[var(--skw-gold)] font-black">Q${idx+1}</span><span class="font-bold">${q.text}</span><select onchange="testQuestions[${idx}].type=this.value;localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));renderTestList();" class="bg-black/60 text-white text-xs p-2 rounded">${Object.entries(labels).map(function(v){return '<option value="'+v[0]+'"'+(q.type===v[0]?'selected':'')+'>'+v[1]+'</option>';}).join('')}</select>${hasDisplay?`<select onchange="testQuestions[${idx}].display=this.value;localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));renderTestList();" class="bg-sky-900/40 text-sky-200 text-xs p-2 rounded"><option value="static" ${q.display==='static'?'selected':''}>整條</option><option value="carousel" ${q.display==='carousel'?'selected':''}>輪播</option>${hasAudio?'<option value="audio" '+(q.display==='audio'?'selected':'')+'>聲音</option>':''}</select>`:''}</div><button onclick="testQuestions.splice(${idx},1);localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));renderTestList();" class="text-red-400 text-xs">刪除</button></div>`;
  }).join('');
}