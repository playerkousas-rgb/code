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
function normalizeGridKey(value){var clean=String(value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);return (clean+'SCOUT').slice(0,5);}
const CHINESE_DICTIONARY = {'昌':'AA','明':'AB','童':'YT','軍':'BW','海':'EY','山':'U','天':'MK','地':'GP','人':'O'};

// ===================== STATE =====================
function readStoredQuestions() {
  try {
    var value=JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
    return Array.isArray(value) ? value : [];
  } catch(e) { return []; }
}
let testQuestions = readStoredQuestions();
let currentProjIdx = 0, projTimer = null, audioCtx = null, natoTimer = null, toastTimer = null;
let peer = null, hostConn = null, connections = [], players = Object.create(null), buzzQueue = [], gameMode = 'idle', myPeerId = null, myPlayerName = '', shakeWatcher = null;

const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value == null ? '' : value).replace(/[&<>'"]/g, function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];});
const showToast = (m) => {
  const t = $('toast');
  if(!t)return;
  clearTimeout(toastTimer);
  t.textContent=m;
  t.classList.add('show');
  toastTimer=setTimeout(()=>t.classList.remove('show'),2000);
};

// ===================== GET SPEED =====================
function getSpeed() {
  // Per-question speed is the source of truth in the test-paper flow.
  // The top-level slider is still used while editing a question so the
  // change can be previewed before the user saves.
  var s = document.getElementById('projSpeedOverlay');
  if(!s || s.value === undefined) s = document.getElementById('projSpeed');
  return s ? parseInt(s.value) : 1200;
}

function getSemStyle() {
  var s = document.getElementById('semPrintStyle');
  return s ? s.value : 'stick';
}

function qSpeed(q) {
  return (q && Number.isFinite(Number(q.speed))) ? Number(q.speed) : 1200;
}
function qSemStyle(q) {
  return (q && (q.semStyle === 'doll' || q.semStyle === 'stick')) ? q.semStyle : 'stick';
}
function qDirection(q) {
  return (q && q.direction === 'decode') ? 'decode' : 'encode';
}

// ===================== RENDERERS =====================
function renderStickFigure(c, color, size) {
  color=color||"white"; size=size||80;
  const a = SEM_ANGLES[c.toUpperCase()];
  if(!a) return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:2rem">${escapeHTML(c)}</div>`;
  var h = `<svg width="${size}" height="${size*1.2}" viewBox="0 0 100 120"><circle cx="50" cy="25" r="10" fill="none" stroke="${color}" stroke-width="4"/><line x1="50" y1="35" x2="50" y2="75" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="35" y2="110" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="65" y2="110" stroke="${color}" stroke-width="4"/>`;
  a.forEach((ang,i)=>{ var rad=(ang-90)*Math.PI/180; h+=`<line x1="50" y1="45" x2="${50+Math.cos(rad)*45}" y2="${45+Math.sin(rad)*45}" stroke="${color==='white'?(i===0?'#ffcc00':'#00d2ff'):'black'}" stroke-width="6" stroke-linecap="round"/>`; });
  return h+'</svg>';
}

function renderDoll(c, size) {
  size=size||100; const src=SEMAPHORE_MAP[c.toUpperCase()];
  return src ? `<img src="images/${src}" alt="旗號 ${escapeHTML(c.toUpperCase())}" style="width:${size}px;height:${size}px;object-fit:contain;">` : renderStickFigure(c,"white",size);
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
  var data=maps[c.toUpperCase()]; if(!data) return `<span>${escapeHTML(c)}</span>`;
  var path=Array.isArray(data)?data[0]:data, dot=Array.isArray(data)&&data[1], dp=(Array.isArray(data)&&data[2])||{x:22.5,y:22.5};
  return `<svg width="40" height="40" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${dp.x}" cy="${dp.y}" r="${dot?3:0}" fill="${color}"/></svg>`;
}

function encodeChinese(text) { return text.split('').map(c=>CHINESE_DICTIONARY[c]||c).join(' ').toUpperCase(); }

function getEncoded(text, type, key, shift) {
  key=normalizeGridKey(key); shift=Number.isFinite(Number(shift))?Number(shift):3; const t=text.toUpperCase();
  switch(type) {
    case 'Morse': return t.split('').map(c=>MORSE_CODE[c]||c).join(' ');
    case 'Grid': return t.split('').map(c=>{if(c===' ')return '/';var i="ABCDEFGHIKLMNOPQRSTUVWXY".indexOf(c);return i===-1?c:key[i%5]+key[Math.floor(i/5)];}).join(' ');
    case 'Phone': return t.split('').map(c=>{var i=PHONE_LOOKUP[c];return i?i.key+i.presses:c;}).join('  ');
    case 'Caesar': return t.replace(/[A-Z]/g,c=>String.fromCharCode(65+(((c.charCodeAt(0)-65+shift)%26)+26)%26));
    case 'Atbash': return t.replace(/[A-Z]/g,c=>String.fromCharCode(90-(c.charCodeAt(0)-65)));
    case 'Reverse': return text.split('').reverse().join('').toUpperCase();
    case 'NATO': return t.split('').map(c=>NATO_MAP[c]||c).join(' ');
    case 'Cangjie': case 'Quick': return encodeChinese(text);
    default: return t;
  }
}

// ===== REVEAL MODE (Kahoot-style answer reveal in the projection flow) =====
//   none  — leader runs the show verbally, no answer shown by the app
//   perQ  — the projection displays the correct answer after each question
//           has been answered; the leader advances manually
//   end   — answers stay hidden until the very last question; then the
//           entire answer key is shown on the projection overlay
const REVEAL_MODES = ['none', 'perQ', 'end'];
const REVEAL_MODE_LABELS = { none: '不揭示', perQ: '每題揭示', end: '總揭示' };
function getRevealMode() {
  var s = document.getElementById('revealMode');
  return (s && REVEAL_MODES.indexOf(s.value) >= 0) ? s.value : 'none';
}

// ===================== PROJECTION =====================
let projRevealed = false;  // Tracks whether the current question's answer
                           // is being shown on the projection overlay. The
                           // next-question button clears it again.
function clearProj() {
  clearInterval(projTimer); projTimer=null;
  if(audioCtx){audioCtx.close();audioCtx=null;}
  if(natoTimer){clearInterval(natoTimer);natoTimer=null;window.speechSynthesis&&window.speechSynthesis.cancel();}
  var pb=$('btnProjPlay'); if(pb) pb.classList.add('hidden');
  var rb=$('btnProjReveal'); if(rb) rb.classList.add('hidden');
}

function showProjection() {
  clearProj(); var q=testQuestions[currentProjIdx]; if(!q)return;
  $('projectionOverlay').style.display='flex';
  $('projCounter').textContent=(currentProjIdx+1)+' / '+testQuestions.length;
  var hasCarousel=(q.type==='Morse'||q.type==='Semaphore'||q.type==='NATO')&&q.display==='carousel';
  var hasAudio=(q.type==='Morse'||q.type==='NATO')&&q.display==='audio';
  var pb=$('btnProjPlay');
  if(hasCarousel||hasAudio){if(pb)pb.classList.remove('hidden');if(pb)pb.textContent=q.display==='audio'?'🔊 播放音訊':'▶ 開始輪播';}
  // Reset the per-question reveal flag every time we land on a new
  // question; the leader has to press the reveal button again to show
  // the answer for this one.
  projRevealed=false;
  // The reveal button only appears when the leader opted into per-Q or
  // "end" mode in the test-paper toolbar. "none" hides it entirely so
  // the show stays leader-driven.
  var rb=$('btnProjReveal');
  var mode=getRevealMode();
  if(mode==='perQ'){if(rb)rb.classList.remove('hidden');if(rb)rb.textContent='💡 揭示答案';}
  else if(rb)rb.classList.add('hidden');
  renderProjStatic(q);
}

function renderProjStatic(q) {
  var c=$('projectionContent'), u=q.text.toUpperCase(), h='', semStyle=qSemStyle(q), dir=qDirection(q);
  // Decode direction: show the original English and ask the audience to
  // write the cipher down, instead of flashing the encoded symbol.
  if(dir==='decode' && q.type!=='Morse' && q.type!=='NATO' && q.type!=='Semaphore') {
    h=`<div class="text-[9vw] font-black text-white text-center">${escapeHTML(u)}</div><div class="mt-6 text-sky-300 text-2xl font-black">↑ 請用 ${escapeHTML(q.type)} 表示 ↑</div>`;
  } else if(q.display==='static'||(q.type!=='Morse'&&q.type!=='Semaphore'&&q.type!=='NATO')) {
    if(q.type==='Morse') h=`<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${escapeHTML(getEncoded(q.text,'Morse'))}</div>`;
    else if(q.type==='Semaphore'){h=`<div class="flex flex-wrap justify-center gap-6">${u.split('').map(c=>c===' '?'<div class="w-16"></div>':(semStyle==='doll'?renderDoll(c,120):renderStickFigure(c,"white",120))).join('')}</div>`;}
    else if(q.type==='Braille') h=`<div class="flex flex-wrap justify-center gap-10 scale-[2.5]">${u.split('').map(c=>c===' '?'<div class="w-10"></div>':renderBraille(c)).join('')}</div>`;
    else if(q.type==='Pigpen') h=`<div class="flex flex-wrap justify-center gap-10 scale-[3]">${u.split('').map(c=>c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
    else if(q.type==='NATO') h=`<div class="text-[5vw] font-black text-white text-center leading-relaxed">${getEncoded(q.text,'NATO').split(' ').map(w=>`<span class="inline-block mx-2 px-6 py-2 bg-white/5 rounded-2xl">${escapeHTML(w)}</span>`).join('')}</div>`;
    else h=`<div class="text-[9vw] font-black text-white text-center">${escapeHTML(getEncoded(q.text,q.type))}</div>`;
  } else { h=`<div class="text-slate-600 text-3xl font-black">${q.display==='audio'?'聽力考核項目':'點擊下方開始輪播'}</div>`; }
  c.innerHTML=`<div class="animate-in w-full text-center">${h}</div>`;
}

// Render just the answer for a single question, used by the per-Q reveal
// and the final full-key screen. Reuses the same per-question style and
// direction flags so the reveal matches the question's own settings.
function renderProjAnswer(q) {
  var c=$('projectionContent'), u=q.text.toUpperCase(), semStyle=qSemStyle(q), dir=qDirection(q);
  var labelMap={"Morse":"摩斯","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高","Grid":"座標","Phone":"電話","Caesar":"凱撒","Atbash":"反射","Reverse":"倒序","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
  var label=labelMap[q.type]||q.type;
  var symbol;
  // Audio questions can't show a static symbol — show a stylised card
  // pointing the leader at the audio playback button instead.
  if((q.type==='Morse'||q.type==='NATO') && q.display==='audio') {
    symbol='<div class="text-[5vw] text-amber-300 font-black">🔊 聲音播放（請按下方「開始輪播」）</div>';
  } else if(dir==='decode') {
    // For decode questions the answer is the encoded cipher of the
    // original text — reuse the same renderer as the static question
    // but bound to the encoded output, not the English.
    var encodedText=getEncoded(q.text, q.type);
    if(q.type==='Semaphore') symbol=`<div class="flex flex-wrap justify-center gap-6">${u.split('').map(function(ch){return ch===' '?'<div class="w-16"></div>':(semStyle==='doll'?renderDoll(ch,140):renderStickFigure(ch,"#00ff88",140));}).join('')}</div>`;
    else if(q.type==='Braille') symbol=`<div class="flex flex-wrap justify-center gap-10 scale-[2.5]">${u.split('').map(function(ch){return ch===' '?'<div class="w-10"></div>':renderBraille(ch);}).join('')}</div>`;
    else if(q.type==='Pigpen') symbol=`<div class="flex flex-wrap justify-center gap-10 scale-[3]">${u.split('').map(function(ch){return ch===' '?'<div class="w-10"></div>':renderPigpenSVG(ch,'#00ff88');}).join('')}</div>`;
    else symbol=`<div class="text-[7vw] font-mono text-[var(--skw-gold)] text-center">${escapeHTML(encodedText)}</div>`;
  } else {
    // Encode direction: the answer is the encoded text the members
    // were asked to write down.
    if(q.type==='Morse') symbol=`<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${escapeHTML(getEncoded(q.text,'Morse'))}</div>`;
    else if(q.type==='Semaphore') symbol=`<div class="flex flex-wrap justify-center gap-6">${u.split('').map(function(ch){return ch===' '?'<div class="w-16"></div>':(semStyle==='doll'?renderDoll(ch,140):renderStickFigure(ch,"#00ff88",140));}).join('')}</div>`;
    else if(q.type==='Braille') symbol=`<div class="flex flex-wrap justify-center gap-10 scale-[2.5]">${u.split('').map(function(ch){return ch===' '?'<div class="w-10"></div>':renderBraille(ch);}).join('')}</div>`;
    else if(q.type==='Pigpen') symbol=`<div class="flex flex-wrap justify-center gap-10 scale-[3]">${u.split('').map(function(ch){return ch===' '?'<div class="w-10"></div>':renderPigpenSVG(ch,'#00ff88');}).join('')}</div>`;
    else if(q.type==='NATO') symbol=`<div class="text-[5vw] font-black text-white text-center leading-relaxed">${getEncoded(q.text,'NATO').split(' ').map(function(w){return `<span class="inline-block mx-2 px-6 py-2 bg-emerald-500/20 border border-emerald-400 rounded-2xl text-emerald-300">${escapeHTML(w)}</span>`}).join('')}</div>`;
    else symbol=`<div class="text-[7vw] font-mono text-[var(--skw-gold)] text-center">${escapeHTML(getEncoded(q.text,q.type))}</div>`;
  }
  c.innerHTML='<div class="animate-in w-full text-center"><div class="text-amber-300 text-3xl font-black tracking-widest mb-4">✓ 參考答案</div><div class="text-2xl text-slate-300 mb-6">題目: '+escapeHTML(u)+' <span class="text-slate-500">('+escapeHTML(label)+')</span></div>'+symbol+'</div>';
}

// Render the full answer key on the projection overlay. Used at the
// end of the test when the leader chose the "總揭示" mode.
function renderProjAnswerKey() {
  var c=$('projectionContent');
  var labelMap={"Morse":"摩斯","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高","Grid":"座標","Phone":"電話","Caesar":"凱撒","Atbash":"反射","Reverse":"倒序","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
  var rows=testQuestions.map(function(q,idx){
    var u=q.text.toUpperCase();
    var label=labelMap[q.type]||q.type;
    var encoded;
    if((q.type==='Morse'||q.type==='NATO')&&q.display==='audio') encoded='（聲音播放）';
    else encoded=getEncoded(q.text,q.type);
    var dirTag=q.direction==='decode'?'<span class="text-rose-300 ml-2 text-base">[倒轉]</span>':'';
    return '<tr class="border-b border-white/10">'
      + '<td class="text-amber-300 font-black py-3 pr-4 text-2xl align-top">Q'+(idx+1)+'</td>'
      + '<td class="py-3 pr-4"><div class="text-white font-bold text-xl">'+escapeHTML(u)+dirTag+'</div><div class="text-slate-500 text-sm">'+escapeHTML(label)+'</div></td>'
      + '<td class="py-3 font-mono text-emerald-300 text-lg">'+escapeHTML(encoded)+'</td>'
      + '</tr>';
  }).join('');
  c.innerHTML='<div class="animate-in w-full max-w-5xl mx-auto">'
    + '<div class="text-amber-300 text-5xl font-black tracking-widest mb-2 text-center">🏆 試卷參考答案</div>'
    + '<div class="text-slate-400 text-center mb-8">總共 '+testQuestions.length+' 題 · 領袖專用 · 投影結束後可關閉</div>'
    + '<table class="w-full">'+rows+'</table>'
    + '</div>';
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
  var key=normalizeGridKey($('gridKey').value),alpha="ABCDEFGHIKLMNOPQRSTUVWXY";
  // Use an explicit <colgroup> so every column (incl. the row-label column)
  // is the same width. Without this the first cell in each row is squeezed
  // by the browser while the rest of the table gets stretched, which made
  // the column under the last key letter look dramatically wider.
  h='<colgroup><col><col><col><col><col><col></colgroup>';
  h+=`<tr><th></th>${key.split('').map(function(k){return `<th>${k}</th>`;}).join('')}</tr>`;
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
  var v=$('inputText').value,t=v.toUpperCase(),key=normalizeGridKey($('gridKey').value);
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
  var used=new Set(t.split(''));
  document.querySelectorAll('[data-ch]').forEach(function(cell){cell.classList.toggle('highlight',used.has(cell.dataset.ch));});
  if($('inputCount'))$('inputCount').textContent=v.length+' / 200';
  document.querySelectorAll('.output-box').forEach(function(output){output.classList.toggle('has-no-value',!v);});
  localStorage.setItem('skw_message_draft',v);
  ensureCopyButtons();
}

const COPY_OUTPUTS = {
  outMorse:function(v){return getEncoded(v,'Morse');},
  outPhone:function(v){return getEncoded(v,'Phone');},
  outGrid:function(v){return getEncoded(v,'Grid',normalizeGridKey($('gridKey').value));},
  outCaesar:function(v){return getEncoded(v,'Caesar','',parseInt($('caesarShift').value));},
  outAtbash:function(v){return getEncoded(v,'Atbash');},
  outReverse:function(v){return getEncoded(v,'Reverse');},
  outNato:function(v){return getEncoded(v,'NATO');},
  outCangjie:function(v){return getEncoded(v,'Cangjie');},
  outPinyin:function(v){return v.toUpperCase().split('').map(function(c){return PINYIN_MAP[c]||c;}).join(' ');},
  outJyutping:function(v){return v.toUpperCase().split('').map(function(c){return JYUTPING_MAP[c]||c;}).join(' ');}
};

function copyText(text) {
  if(!text)return showToast('請先輸入訊息');
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(text).then(function(){showToast('已複製密碼');}).catch(function(){fallbackCopy(text);});
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  var area=document.createElement('textarea');
  area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
  try{document.execCommand('copy');showToast('已複製密碼');}catch(e){showToast('無法自動複製');}
  area.remove();
}
function ensureCopyButtons() {
  Object.keys(COPY_OUTPUTS).forEach(function(id){
    var output=$(id);if(!output||output.querySelector('.copy-output-btn'))return;
    var button=document.createElement('button');button.type='button';button.className='copy-output-btn';button.textContent='⧉';button.setAttribute('aria-label','複製這項密碼結果');
    button.onclick=function(event){event.stopPropagation();copyText(COPY_OUTPUTS[id]($('inputText').value));};
    output.appendChild(button);
  });
}

// ===================== PEERJS / BUZZER =====================
function initGameHost() {
  if(peer)return;
  if(typeof Peer==='undefined'){showToast('搶答服務未能載入，請檢查網絡');return;}
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
        if(!data||typeof data!=='object')return;
        var safeName=typeof data.name==='string'?data.name.trim().slice(0,24):'';
        if(data.type==='join'&&safeName){if(!Object.prototype.hasOwnProperty.call(players,safeName)){players[safeName]={name:safeName,score:0,joinedAt:Date.now()};updatePlayerList();}}
        else if(data.type==='buzz'&&safeName){if(gameMode==='open'&&!buzzQueue.find(function(p){return p.name===safeName;})){buzzQueue.push({name:safeName,time:Date.now()});updateBuzzList();connections.forEach(function(c){c.send({type:'buzz_order',queue:buzzQueue.map(function(p){return p.name;})});});}}
      });
      conn.on('close',function(){connections=connections.filter(function(c){return c!==conn;});$('playerCount').textContent=connections.length+' 人連線';});
      conn.send({type:'state',gameMode:gameMode,players:Object.values(players),queue:buzzQueue.map(function(p){return p.name;})});
    });
  }catch(e){showToast('搶答系統初始化失敗');}
}

function updatePlayerList() {
  $('buzzList').innerHTML=Object.values(players).sort(function(a,b){return b.score-a.score;}).map(function(p){return `<div class="skw-card text-center p-6 mb-0"><div class="text-3xl font-black text-[var(--skw-gold)]">${escapeHTML(p.name)}</div><div class="text-slate-500 text-xs mt-2 font-bold">${Number(p.score)||0} 分</div></div>`;}).join('');
  $('playerCount').textContent=Object.keys(players).length+' 人連線';
}

function updateBuzzList() {
  $('buzzList').innerHTML=buzzQueue.map(function(p,i){return `<div class="skw-card text-center p-6 mb-0 ${i===0?'ring-2 ring-emerald-500':''}"><div class="text-3xl font-black ${i===0?'text-emerald-400':'text-white'}">${i===0?'🔔 ':''}${escapeHTML(p.name)}</div><div class="text-slate-500 text-xs mt-2">搶答 #${i+1}</div></div>`;}).join('');
  $('playerCount').textContent=Object.keys(players).length+' 人連線';
}

function startShakeWatcher() {
  if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'){DeviceMotionEvent.requestPermission().then(function(s){if(s==='granted')startShakeListener();}).catch(function(){startShakeListener();});}
  else{startShakeListener();}
}
function startShakeListener() {
  if(shakeWatcher)return; var lx=0,ly=0,lz=0,lt=0;
  shakeWatcher=function(e){
    var a=e.accelerationIncludingGravity; if(!a)return;
    var x=a.x,y=a.y,z=a.z,now=Date.now();
    if(lt===0){lx=x;ly=y;lz=z;lt=now;return;}
    if(now-lt>120&&Math.abs(x-lx)+Math.abs(y-ly)+Math.abs(z-lz)>25&&gameMode==='open'){sendBuzz();lt=now;}
    lx=x;ly=y;lz=z;
  };
  window.addEventListener('devicemotion',shakeWatcher);
}
function stopShakeWatcher(){if(shakeWatcher){window.removeEventListener('devicemotion',shakeWatcher);shakeWatcher=null;}}
function sendBuzz(){if(hostConn&&gameMode==='open'&&myPlayerName){hostConn.send({type:'buzz',name:myPlayerName});$('buzzStatus').textContent='已搶答！';$('btnBuzzer').classList.add('disabled');if(navigator.vibrate)navigator.vibrate(60);}}

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
  var draft=localStorage.getItem('skw_message_draft');
  if(draft)$('inputText').value=draft.slice(0,200);
  buildReferenceTables(); buildPigpenGrid(); updateAll();

  var urlParams=new URLSearchParams(window.location.search), joinId=urlParams.get('join');
  var modeTitles={editor:'編碼工具',testpaper:'試卷生成',game:'互動搶答'};

  function closeSidebar(){
    $('sidebar').classList.remove('open');
    document.body.classList.remove('menu-open');
    $('mobileMenuBtn').setAttribute('aria-expanded','false');
    $('mobileMenuBtn').setAttribute('aria-label','開啟密碼導覽');
  }
  function setSidebar(open){
    $('sidebar').classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open);
    $('mobileMenuBtn').setAttribute('aria-expanded',String(open));
    $('mobileMenuBtn').setAttribute('aria-label',open?'關閉密碼導覽':'開啟密碼導覽');
  }
  function activateMode(mode){
    document.querySelectorAll('.mode-btn[data-mode]').forEach(function(button){button.classList.toggle('active',button.dataset.mode===mode);});
    $('editorView').classList.toggle('hidden',mode!=='editor');
    $('testPaperView').classList.toggle('hidden',mode!=='testpaper');
    $('gameView').classList.toggle('hidden',mode!=='game');
    $('currentModeTitle').textContent=modeTitles[mode]||'密碼旗號助手';
    // The "Print answer key" button only makes sense once a leader is
    // editing a test paper. Hide it everywhere else to avoid accidental
    // presses on an empty test.
    var answerBtn=$('btnPrintAnswers');
    if(answerBtn)answerBtn.classList.toggle('hidden',mode!=='testpaper');
    if(mode==='testpaper')renderTestList();
    if(mode==='game')initGameHost();
    closeSidebar();
    window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }

  if(joinId){
    document.querySelectorAll('.mode-btn.active').forEach(function(button){button.classList.remove('active');});
    $('editorView').classList.add('hidden');$('testPaperView').classList.add('hidden');$('gameView').classList.add('hidden');
    $('memberView').classList.remove('hidden');$('memberView').style.display='flex';myPeerId=joinId;
  }

  document.querySelectorAll('.mode-btn[data-mode]').forEach(function(btn){btn.onclick=function(){activateMode(this.dataset.mode);};});
  $('mobileMenuBtn').onclick=function(){setSidebar(!$('sidebar').classList.contains('open'));};
  $('sidebarBackdrop').onclick=closeSidebar;
  document.addEventListener('keydown',function(event){if(event.key==='Escape'){closeSidebar();if($('projectionOverlay').style.display==='flex'){$('projectionOverlay').style.display='none';clearProj();}}});
  document.querySelectorAll('.nav-item').forEach(function(link){link.addEventListener('click',function(){activateMode('editor');closeSidebar();});});
  window.addEventListener('resize',function(){if(window.innerWidth>1024)closeSidebar();});

  $('inputText').oninput=updateAll;
  document.querySelectorAll('[data-sample]').forEach(function(button){button.onclick=function(){$('inputText').value=this.dataset.sample;updateAll();$('inputText').focus();};});
  var scrollBtn=document.querySelector('[data-scroll-to-input]');if(scrollBtn){scrollBtn.onclick=function(){$('messageComposer').scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){$('inputText').focus();},350);};}
  $('btnClearInput').onclick=function(){$('inputText').value='';updateAll();$('inputText').focus();};
  $('btnAddToTest').onclick=function(){
    var value=$('inputText').value.trim();
    if(!value)return showToast('請先輸入訊息');
    testQuestions.push({id:Date.now(),text:value,type:'Morse',display:'static'});
    localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));
    showToast('已加入試卷');
  };
  $('btnPlayMorse').onclick=function(){var t=$('inputText').value.toUpperCase();if(t)playMorse(t,getSpeed());else showToast('請先輸入訊息');};
  $('gridKey').oninput=function(){this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);buildReferenceTables();updateAll();};
  $('gridKey').onblur=function(){this.value=normalizeGridKey(this.value);buildReferenceTables();updateAll();};
  $('caesarShift').oninput=updateAll;

  // SPEED SYNC
  syncSpeed();

  // PROJECTION
  $('btnProjectTest').onclick=function(){if(testQuestions.length){currentProjIdx=0;showProjection();}};
  $('btnProjNext').onclick=function(){
    if(currentProjIdx<testQuestions.length-1){
      currentProjIdx++;
      showProjection();
    } else if(getRevealMode()==='end'){
      // End-of-test: when "總揭示" is on, the next button after the
      // last question replaces the question view with the full key.
      var rb=$('btnProjReveal'); if(rb) rb.classList.add('hidden');
      renderProjAnswerKey();
    } else {
      showToast('已是最後一題');
    }
  };
  $('btnProjPrev').onclick=function(){if(currentProjIdx>0){currentProjIdx--;showProjection();}};
  $('btnExitProjection').onclick=function(){$('projectionOverlay').style.display='none';clearProj();};

  // Per-question reveal button. Pressing it swaps the projection content
  // from the question to the answer; the button text changes so the
  // leader can press it again to go back to the question if they want
  // to quiz the audience first.
  $('btnProjReveal').onclick=function(){
    var q=testQuestions[currentProjIdx]; if(!q)return;
    projRevealed=!projRevealed;
    if(projRevealed){renderProjAnswer(q);this.textContent='↩ 回到題目';}
    else {renderProjStatic(q);this.textContent='💡 揭示答案';}
  };

  // PLAY BUTTON
  $('btnProjPlay').onclick=function(){
    var q=testQuestions[currentProjIdx]; if(!q)return;
    var text=q.text.toUpperCase(), speed=qSpeed(q), semStyle=qSemStyle(q);
    if(q.display==='audio'){
      if(q.type==='Morse'){playMorse(text,speed);return;}
      if(q.type==='NATO'){playNatoAudio(text,speed);return;}
      return;
    }
    var i=0;
    clearInterval(projTimer);
    projTimer=setInterval(function(){
      if(i>=text.length){clearInterval(projTimer);return;}
      var c=text[i],h='';
      if(q.type==='Morse') h=`<div class="text-[25vw] font-mono text-[var(--skw-gold)]">${escapeHTML(MORSE_CODE[c]||c)}</div>`;
      else if(q.type==='NATO') h=`<div class="text-[12vw] font-black text-white">${escapeHTML(NATO_MAP[c]||c)}</div>`;
      else h=(semStyle==='doll'?renderDoll(c,450):renderStickFigure(c,"white",450));
      $('projectionContent').innerHTML=`<div class="animate-in flex flex-col items-center">${h}<div class="mt-16 text-slate-500 font-bold text-2xl">字母 ${i+1} / ${text.length}</div></div>`;
      i++;
    },speed);
  };

  // ===== PRINT =====
  $('btnExportPDF').onclick=function(){
    if(!testQuestions.length)return alert('請先加入題目');
    var defaultStyle=getSemStyle();
    $('printQuestions').innerHTML=testQuestions.map(function(q,idx){
      var upper=q.text.toUpperCase();
      var semStyle=qSemStyle(q);
      var style=semStyle||defaultStyle;
      var dir=qDirection(q);
      var encoded='';
      var promptLine='';
      // Reverse direction: show the English on the page and ask the
      // member to write the cipher symbols down.
      if(dir==='decode') {
        var labelMap={"Morse":"摩斯密碼","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高密碼","Grid":"座標密碼","Phone":"電話密碼","Caesar":"凱撒位移","Atbash":"反射密碼","Reverse":"倒序密碼","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
        var label=labelMap[q.type]||q.type;
        encoded=`<span class="text-2xl font-mono">${escapeHTML(upper)}</span>`;
        promptLine='<div class="text-base text-gray-600 mt-1">↑ 請用 ' + escapeHTML(label) + ' 表示 ↑</div>';
        var heading='<b>Q' + (idx+1) + '. 將以下文字寫成 ' + escapeHTML(q.type) + '：</b>';
        return `<div class="print-question">${heading}${promptLine}<div class="mt-6 flex items-center justify-center">${encoded}</div><div class="mt-10 border-b border-black w-full h-8"></div></div>`;
      }
      if(q.type==='Semaphore') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':(style==='doll'?`<img src="images/${SEMAPHORE_MAP[c]}" class="w-16 h-16 border border-black p-0.5">`:renderStickFigure(c,"black",60));}).join('')}</div>`;
      else if(q.type==='Braille') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':renderBraille(c);}).join('')}</div>`;
      else if(q.type==='Pigpen') encoded=`<div class="flex flex-wrap gap-4 justify-center">${upper.split('').map(function(c){return c===' '?'<div class="w-8"></div>':renderPigpenSVG(c,"#000");}).join('')}</div>`;
      else if(q.type==='NATO') encoded=q.display==='audio'?'<span class="text-xl italic">（聽力考核項目）</span>':`<div class="text-lg font-bold text-center">${escapeHTML(upper.split('').map(function(c){return c===' '?'  ':NATO_MAP[c]||c;}).join(' '))}</div>`;
      else if(q.type==='Morse'&&q.display==='audio') encoded='<span class="text-xl italic">（聽力考核項目）</span>';
      else encoded=`<span class="text-2xl font-mono">${escapeHTML(getEncoded(q.text,q.type))}</span>`;
      return `<div class="print-question"><b>Q${idx+1}. 翻譯以下密碼 (${q.type})：</b><div class="mt-6 flex items-center justify-center">${encoded}</div><div class="mt-10 border-b border-black w-full h-8"></div></div>`;
    }).join('');
    // Print the exam sheet only — the answer sheet is hidden by default
    // and only shown when its own button fires.
    document.body.removeAttribute('data-print-mode');
    setTimeout(function(){window.print();},200);
  };

  // Render the answer key contents into #printAnswers and trigger the
  // print dialog. We tag the body so the print CSS knows to swap which
  // sub-sheet of #printView is shown — the exam sheet stays hidden.
  $('btnPrintAnswers').onclick=function(){
    if(!testQuestions.length)return alert('請先加入題目');
    var labelMap={"Morse":"摩斯密碼","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高密碼","Grid":"座標密碼","Phone":"電話密碼","Caesar":"凱撒位移","Atbash":"反射密碼","Reverse":"倒序密碼","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
    $('printAnswerCount').textContent=testQuestions.length;
    $('printAnswerDate').textContent=new Date().toLocaleDateString('zh-Hant');
    $('printAnswers').innerHTML=testQuestions.map(function(q,idx){
      var upper=q.text.toUpperCase();
      var dir=qDirection(q);
      var label=labelMap[q.type]||q.type;
      // For decode questions the answer is the original ciphertext; for
      // encode questions the answer is the encoded text the member is
      // expected to write. Either way we show "original text <-> answer".
      var cipherValue;
      if(q.type==='Morse'&&q.display==='audio') cipherValue='（聲音播放）';
      else if(q.type==='NATO'&&q.display==='audio') cipherValue='（聲音播放）';
      else cipherValue=getEncoded(q.text,q.type);
      var directionBadge=dir==='decode'?'<span class="answer-direction">倒轉題</span>':'';
      return '<div class="print-answer-item">'
        + '<div class="answer-head">'
        + '<span class="answer-q">Q'+(idx+1)+'.'+directionBadge+'</span>'
        + '<span class="answer-meta">'+escapeHTML(label)+' · 速度 '+(q.speed?(q.speed/1000).toFixed(1)+'s':'-')+(q.type==='Semaphore'?' · '+(q.semStyle==='doll'?'貝登堡公仔':'火柴人'):'')+'</span>'
        + '</div>'
        + '<div class="answer-pair"><span class="answer-label">'+(dir==='decode'?'原文字':'原文字')+'</span><span class="answer-value">'+escapeHTML(upper)+'</span></div>'
        + '<div class="answer-pair"><span class="answer-label">參考答案</span><span class="answer-value">'+escapeHTML(cipherValue)+'</span></div>'
        + '</div>';
    }).join('');
    document.body.setAttribute('data-print-mode','answers');
    setTimeout(function(){window.print();},200);
  };

  // After the print dialog closes, reset the body attribute so the next
  // regular print goes back to the exam sheet by default.
  window.addEventListener('afterprint',function(){
    document.body.removeAttribute('data-print-mode');
  });

  // ===== BUZZER =====
  $('btnStartGame').onclick=function(){
    gameMode=(gameMode==='open')?'idle':'open';
    $('btnStartGame').textContent=gameMode==='open'?'🔴 關閉搶答':'🟢 開放搶答 (RESET)';
    $('btnStartGame').className=gameMode==='open'?'w-full py-5 bg-red-600 rounded-3xl font-black text-white text-xl shadow-lg':'w-full py-5 bg-emerald-600 rounded-3xl font-black text-white text-xl shadow-lg';
    if(gameMode==='open'){buzzQueue=[];updateBuzzList();connections.forEach(function(c){c.send({type:'game_open'});});}
    else{connections.forEach(function(c){c.send({type:'game_close'});});}
  };

  $('btnJoinConfirm').onclick=function(){
    var name=$('playerName').value.trim().slice(0,24); if(!name)return alert('請輸入姓名');
    myPlayerName=name;
    if(!joinId&&!myPeerId)return alert('無遊戲 ID');
    try{
      if(typeof Peer==='undefined'){alert('PeerJS 未載入');return;}
      var mp=new Peer();
      mp.on('open',function(){
        var conn=mp.connect(joinId||myPeerId); hostConn=conn;
        conn.on('open',function(){conn.send({type:'join',name:name});$('memberJoinForm').classList.add('hidden');$('memberBuzzer').classList.remove('hidden');$('displayMyName').textContent=name;});
        conn.on('data',function(data){
          if(data.type==='game_open'||(data.type==='state'&&data.gameMode==='open')){gameMode='open';$('buzzStatus').textContent='領袖已開放搶答！快按 BUZZ!';$('btnBuzzer').classList.remove('disabled');$('btnBuzzer').textContent='BUZZ!';}
          else if(data.type==='game_close'||data.type==='state'){gameMode='idle';$('buzzStatus').textContent='等待領袖開放...';$('btnBuzzer').classList.add('disabled');}
          else if(data.type==='buzz_order'&&Array.isArray(data.queue)){var i=data.queue.indexOf(name);$('buzzStatus').textContent=i===0?'你是第 1 名！':(i>=0?(i+1)+' 名':'等待結果...');}
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
  if(!testQuestions.length){
    list.innerHTML='<div class="empty-state"><strong>試卷還未有題目</strong><br>返回「編碼工具」輸入訊息，再按「加入試卷題目」。</div>';
    return;
  }
  list.innerHTML=testQuestions.map(function(q,idx){
    var hasDisplay=q.type==='Morse'||q.type==='Semaphore'||q.type==='NATO';
    var hasAudio=q.type==='Morse'||q.type==='NATO';
    var typeOptions=Object.entries(labels).map(function(v){return '<option value="'+v[0]+'"'+(q.type===v[0]?' selected':'')+'>'+v[1]+'</option>';}).join('');
    var displayOptions=hasDisplay?`<select data-question-index="${idx}" data-question-field="display" aria-label="第 ${idx+1} 題顯示方式" class="bg-sky-900/40 text-sky-200 text-xs p-3 rounded-lg min-h-11"><option value="static" ${q.display==='static'?'selected':''}>整條顯示</option><option value="carousel" ${q.display==='carousel'?'selected':''}>逐字輪播</option>${hasAudio?'<option value="audio" '+(q.display==='audio'?'selected':'')+'>聲音播放</option>':''}</select>`:'';
    // Per-question toggle group: encode (show cipher) vs decode (show
    // English, member writes the cipher). Applies to both projection and
    // the printed test paper.
    // Per-question settings shown only when they actually apply. The
    // Semaphore style picker and the carousel/audio speed slider are
    // specific to Semaphore / carousel-or-audio displays, so they
    // stay hidden on other cipher types to avoid confusing members.
    var direction=q.direction||'encode';
    var semStyle=q.semStyle||'stick';
    var speed=q.speed||1200;
    var speedLabel=(speed/1000).toFixed(1)+'s';
    var directionBlock=`<div class="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden text-xs font-bold" role="group" aria-label="第 ${idx+1} 題方向">
      <button type="button" data-question-index="${idx}" data-question-field="direction" data-value="encode" class="px-3 py-2 min-h-11 ${direction==='encode'?'bg-[var(--skw-gold)] text-black':'text-slate-400 hover:text-white'}" title="出密碼符號，要成員翻譯">翻譯</button>
      <button type="button" data-question-index="${idx}" data-question-field="direction" data-value="decode" class="px-3 py-2 min-h-11 ${direction==='decode'?'bg-[var(--skw-gold)] text-black':'text-slate-400 hover:text-white'}" title="出英文，要成員寫出密碼符號">倒轉</button>
    </div>`;
    var semStyleOptions=q.type==='Semaphore' ? `<select data-question-index="${idx}" data-question-field="semStyle" aria-label="第 ${idx+1} 題旗號樣式" class="bg-black/60 text-white text-xs p-3 rounded-lg min-h-11">
      <option value="stick" ${semStyle==='stick'?'selected':''}>火柴人</option>
      <option value="doll" ${semStyle==='doll'?'selected':''}>貝登堡公仔</option>
    </select>` : '';
    var speedControl=hasDisplay ? `<div class="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-2 min-h-11">
      <span class="text-[10px] text-slate-500 font-bold">⏱</span>
      <input type="range" min="100" max="5000" step="100" value="${speed}" data-question-index="${idx}" data-question-field="speed" aria-label="第 ${idx+1} 題輪播速度" class="w-24 accent-[var(--skw-gold)]">
      <span class="text-[11px] text-[var(--skw-gold)] font-black w-9 text-right" data-speed-label-for="${idx}">${speedLabel}</span>
    </div>` : '';
    var semLabel=q.type==='Semaphore'?'<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">旗號</span>':'';
    var speedLabel2=hasDisplay?'<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">速度</span>':'';
    return `<article class="skw-card flex flex-col gap-3 mb-0 p-5">
      <div class="flex items-center gap-3 flex-wrap min-w-0">
        <span class="text-[var(--skw-gold)] font-black text-lg shrink-0">Q${idx+1}</span>
        <span class="font-bold break-words flex-1 min-w-[180px] text-base">${escapeHTML(q.text)}</span>
        <button type="button" data-delete-question="${idx}" class="text-red-300 border border-red-400/20 bg-red-500/10 rounded-lg px-4 min-h-11 text-xs font-bold ml-auto">刪除</button>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">密碼</span>
        <select data-question-index="${idx}" data-question-field="type" aria-label="第 ${idx+1} 題密碼類型" class="bg-black/60 text-white text-xs p-3 rounded-lg min-h-11">${typeOptions}</select>
        ${displayOptions}
        ${directionBlock}
      </div>
      ${(semStyleOptions || speedControl) ? `<div class="flex items-center gap-2 flex-wrap">
        ${semLabel}${semStyleOptions}
        ${speedLabel2}${speedControl}
      </div>` : ''}
    </article>`;
  }).join('');
  list.querySelectorAll('select[data-question-field]').forEach(function(select){
    select.onchange=function(){
      var index=parseInt(this.dataset.questionIndex),field=this.dataset.questionField;
      if(!testQuestions[index])return;
      testQuestions[index][field]=this.value;
      if(field==='type'){testQuestions[index].display='static';}
      localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));
      renderTestList();
    };
  });
  // Per-question speed slider — update the live label and the stored value
  // on every input tick so the user sees the chosen tempo immediately.
  list.querySelectorAll('input[data-question-field="speed"]').forEach(function(input){
    input.oninput=function(){
      var index=parseInt(this.dataset.questionIndex);
      if(!testQuestions[index])return;
      var v=parseInt(this.value);
      testQuestions[index].speed=v;
      var label=list.querySelector('[data-speed-label-for="'+index+'"]');
      if(label)label.textContent=(v/1000).toFixed(1)+'s';
      localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));
    };
  });
  // Direction toggle (encode / decode).
  list.querySelectorAll('button[data-question-field="direction"]').forEach(function(button){
    button.onclick=function(){
      var index=parseInt(this.dataset.questionIndex);
      if(!testQuestions[index])return;
      testQuestions[index].direction=this.dataset.value;
      localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));
      renderTestList();
    };
  });
  list.querySelectorAll('[data-delete-question]').forEach(function(button){
    button.onclick=function(){
      testQuestions.splice(parseInt(this.dataset.deleteQuestion),1);
      localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));
      renderTestList();showToast('題目已刪除');
    };
  });
}