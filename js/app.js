// ===================== DATA & MAPPINGS =====================
const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
const SEMAPHORE_MAP = {'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png','I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png','Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png','Y':'y.png','Z':'z.png','!':'error.png','@':'endof.png','#':'answering.png','$':'attention.png','%':'numbers.png'};
const SEM_ANGLES = {'A':[180,225],'B':[180,270],'C':[180,315],'D':[180,0],'E':[0,45],'F':[0,90],'G':[0,135],'H':[225,270],'I':[225,315],'J':[90,0],'K':[225,0],'L':[225,45],'M':[225,90],'N':[225,135],'O':[270,315],'P':[270,0],'Q':[270,45],'R':[270,90],'S':[270,135],'T':[315,0],'U':[315,45],'V':[0,90],'W':[45,90],'X':[45,135],'Y':[315,90],'Z':[135,90]};
const BRAILLE_MAP = {'A':[1],'B':[1,2],'C':[1,4],'D':[1,4,5],'E':[1,5],'F':[1,2,4],'G':[1,2,4,5],'H':[1,2,5],'I':[2,4],'J':[2,4,5],'K':[1,3],'L':[1,2,3],'M':[1,3,4],'N':[1,3,4,5],'O':[1,3,5],'P':[1,2,3,4],'Q':[1,2,3,4,5],'R':[1,2,3,5],'S':[2,3,4],'T':[2,3,4,5],'U':[1,3,6],'V':[1,2,3,6],'W':[2,4,5,6],'X':[1,3,4,6],'Y':[1,3,4,5,6],'Z':[1,3,5,6]};
const CANGJIE_MAP = {'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈','J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口','S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'};
const PINYIN_MAP = {'A':'ēi','B':'bì','C':'sēi','D':'dì','E':'yì','F':'ài-fū','G':'jì','H':'ēi-chǔ','I':'ài','J':'jiè','K':'kèi','L':'ài-ōu','M':'ài-mǔ','N':'ēn','O':'ōu','P':'pī','Q':'kiŭ','R':'á','S':'ài-sǐ','T':'tì','U':'yōu','V':'wēi','W':'dá-bù-liù-yōu','X':'ài-kè-sī','Y':'wài','Z':'zèi'};
const JYUTPING_MAP = {'A':'ei1','B':'bi1','C':'si1','D':'di1','E':'i1','F':'ef1','G':'ji1','H':'eich1','I':'ai1','J':'jei1','K':'kei1','L':'el1','M':'em1','N':'en1','O':'ou1','P':'pi1','Q':'kiu1','R':'aa1','S':'es1','T':'ti1','U':'ju1','V':'wi1','W':'dël-bü-liu-ju1','X':'ik-si1','Y':'wai1','Z':'zet1'};
const NATO_MAP = {'A':'Alpha','B':'Bravo','C':'Charlie','D':'Delta','E':'Echo','F':'Foxtrot','G':'Golf','H':'Hotel','I':'India','J':'Juliett','K':'Kilo','L':'Lima','M':'Mike','N':'November','O':'Oscar','P':'Papa','Q':'Quebec','R':'Romeo','S':'Sierra','T':'Tango','U':'Uniform','V':'Victor','W':'Whiskey','X':'X-ray','Y':'Yankee','Z':'Zulu'};
const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
const PHONE_LOOKUP = {};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });

// ===================== APP STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0, projTimer = null, peer = null, hostConn = null, connections = [], players = {}, buzzQueue = [], gameMode = 'idle';

const $ = (id) => document.getElementById(id);
const showToast = (msg) => { const t = $('toast'); if(t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); } };

// ===================== CORE LOGIC =====================
function renderStickFigure(c, color = "white", size = 80) {
    const a = SEM_ANGLES[c.toUpperCase()]; if(!a) return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:2rem">${c}</div>`;
    let h = `<svg width="${size}" height="${size*1.2}" viewBox="0 0 100 120">`;
    h += `<circle cx="50" cy="25" r="10" fill="none" stroke="${color}" stroke-width="3"/><line x1="50" y1="35" x2="50" y2="75" stroke="${color}" stroke-width="3"/><line x1="50" y1="75" x2="35" y2="105" stroke="${color}" stroke-width="3"/><line x1="50" y1="75" x2="65" y2="105" stroke="${color}" stroke-width="3"/>`;
    a.forEach((ang, i) => { const r=(ang-90)*Math.PI/180; h+=`<line x1="50" y1="45" x2="${50+Math.cos(r)*45}" y2="${45+Math.sin(r)*45}" stroke="${color==='white'?(i===0?'#ffcc00':'#00d2ff'):'black'}" stroke-width="5" stroke-linecap="round"/>`; });
    return h + `</svg>`;
}

function renderBraille(c) {
    const d = BRAILLE_MAP[c.toUpperCase()] || [];
    let h = '<div class="braille-char">';
    for(let i=1; i<=6; i++) h += `<div class="braille-dot ${d.includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function renderPigpenSVG(c, color = "#ffcc00") {
    const maps = {'A':"M35,10 L35,35 L10,35",'B':"M10,10 L10,35 L35,35 L35,10",'C':"M10,10 L10,35 L35,35",'D':"M10,10 L35,10 L35,35 L10,35",'E':"M10,10 L35,10 L35,35 L10,35 Z",'F':"M35,10 L10,10 L10,35 L35,35",'G':"M35,35 L35,10 L10,10",'H':"M10,35 L10,10 L35,10 L35,35",'I':"M10,35 L10,10 L35,10",'J':["M35,10 L35,35 L10,35",true],'K':["M10,10 L10,35 L35,35 L35,10",true],'L':["M10,10 L10,35 L35,35",true],'M':["M10,10 L35,10 L35,35 L10,35",true],'N':["M10,10 L35,10 L35,35 L10,35 Z",true],'O':["M35,10 L10,10 L10,35 L35,35",true],'P':["M35,35 L35,10 L10,10",true],'Q':["M10,35 L10,10 L35,10 L35,35",true],'R':["M10,35 L10,10 L35,10",true],'S':"M10,10 L22.5,22.5 L35,10",'T':"M35,10 L22.5,22.5 L35,35",'U':"M10,35 L22.5,22.5 L35,35",'V':"M10,10 L22.5,22.5 L10,35",'W':["M10,10 L22.5,22.5 L35,10",true,{x:22.5,y:15}],'X':["M35,10 L22.5,22.5 L35,35",true,{x:30,y:22.5}],'Y':["M10,35 L22.5,22.5 L35,35",true,{x:22.5,y:30}],'Z':["M10,10 L22.5,22.5 L10,35",true,{x:15,y:22.5}]};
    let data = maps[c.toUpperCase()]; if(!data) return `<span>${c}</span>`;
    let path = Array.isArray(data) ? data[0] : data, dot = Array.isArray(data) && data[1], dotPos = (Array.isArray(data) && data[2]) || {x:22.5,y:22.5};
    return `<svg class="pigpen-svg" width="40" height="40" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><circle cx="${dotPos.x}" cy="${dotPos.y}" r="${dot?3:0}" fill="${color}"/></svg>`;
}

function getEncoded(text, type, key = 'SCOUT', shift = 3) {
    const t = text.toUpperCase();
    switch(type) {
        case 'Morse': return t.split('').map(c => MORSE_CODE[c] || c).join(' ');
        case 'Grid': return t.split('').map(c => { if(c===' ') return '/'; let idx="ABCDEFGHIKLMNOPQRSTUVWXY".indexOf(c); return idx===-1?c:key[idx%5]+key[Math.floor(idx/5)]; }).join(' ');
        case 'Phone': return t.split('').map(c => { const i=PHONE_LOOKUP[c]; return i?`${i.key}${i.presses}`:c; }).join('  ');
        case 'Caesar': return t.replace(/[A-Z]/g, c => String.fromCharCode(65+(c.charCodeAt(0)-65+shift)%26));
        case 'Atbash': return t.replace(/[A-Z]/g, c => String.fromCharCode(90-(c.charCodeAt(0)-65)));
        case 'Reverse': return text.split('').reverse().join('').toUpperCase();
        case 'NATO': return t.split('').map(c => NATO_MAP[c] || c).join(' ');
        case 'Cangjie': return t.split('').map(c => c===' '?'/':(CANGJIE_MAP[c] || c)).join(' ');
        case 'Pinyin': return t.split('').map(c => PINYIN_MAP[c] || c).join(' ');
        case 'Jyutping': return t.split('').map(c => JYUTPING_MAP[c] || c).join(' ');
        default: return t;
    }
}

function updateAll() {
    const v = $('inputText').value, t = v.toUpperCase(), key = $('gridKey').value.toUpperCase(), s = parseInt($('caesarShift').value);
    $('outMorse').textContent = getEncoded(v, 'Morse');
    $('outSemaphore').innerHTML = t.split('').map(c => c===' '?'<span class="w-8"></span>':renderStickFigure(c, "#ffcc00", 60)).join('');
    $('outPigpen').innerHTML = t.split('').map(c => c===' '?'<span class="mx-2">/</span>':renderPigpenSVG(c)).join('');
    $('outBraille').innerHTML = t.split('').map(c => c===' '?'<span class="w-8"></span>':renderBraille(c)).join('');
    $('outGrid').textContent = getEncoded(v, 'Grid', key);
    $('outPhone').textContent = getEncoded(v, 'Phone');
    $('outCaesar').textContent = getEncoded(v, 'Caesar', '', s);
    $('outAtbash').textContent = getEncoded(v, 'Atbash');
    $('outReverse').textContent = getEncoded(v, 'Reverse');
    $('outNato').textContent = getEncoded(v, 'NATO');
    $('outCangjie').textContent = getEncoded(v, 'Cangjie');
    $('outPinyin').textContent = getEncoded(v, 'Pinyin');
    $('outJyutping').textContent = getEncoded(v, 'Jyutping');
    highlightTables(t);
}

// ===================== PROJECTION =====================
function showProjection() {
    const q = testQuestions[currentProjIdx]; if(!q) return;
    $('projectionOverlay').style.display = 'flex';
    $('projCounter').textContent = `${currentProjIdx+1} / ${testQuestions.length}`;
    clearInterval(projTimer);
    const isDynamic = (q.type === 'Morse' || q.type === 'Semaphore') && q.display === 'carousel';
    $('btnProjPlay').style.display = isDynamic ? 'block' : 'none';
    renderProjStatic(q);
}

function renderProjStatic(q) {
    const content = $('projectionContent'), t = q.text.toUpperCase();
    let html = '';
    if(q.type === 'Morse' && q.display !== 'carousel') html = `<div class="text-[8vw] font-mono tracking-widest text-[var(--skw-gold)]">${getEncoded(q.text, 'Morse')}</div>`;
    else if(q.type === 'Semaphore' && q.display !== 'carousel') {
        const style = $('semPrintStyle').value;
        html = `<div class="flex flex-wrap justify-center gap-8">${t.split('').map(c => c===' '?'<div class="w-20"></div>':(style==='stick'?renderStickFigure(c, "white", 140):`<img src="images/${SEMAPHORE_MAP[c]}" class="w-40 h-40 bg-white rounded-2xl p-2 shadow-2xl">`)).join('')}</div>`;
    }
    else if(q.type === 'Braille') html = `<div class="flex flex-wrap justify-center gap-12 scale-[2.5]">${t.split('').map(c => c===' '?'<div class="w-10"></div>':renderBraille(c)).join('')}</div>`;
    else if(q.type === 'Pigpen') html = `<div class="flex flex-wrap justify-center gap-12 scale-[3]">${t.split('').map(c => c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
    else if(q.display === 'carousel') html = `<div class="text-[var(--skw-gold)] text-4xl font-black animate-pulse">準備播放...</div>`;
    else html = `<div class="text-[9vw] font-black text-white text-center leading-tight">${getEncoded(q.text, q.type)}</div>`;
    content.innerHTML = html;
}

$('btnProjPlay').onclick = () => {
    const q = testQuestions[currentProjIdx], t = q.text.toUpperCase(), speed = parseInt($('projSpeed').value), content = $('projectionContent');
    let i = 0; clearInterval(projTimer);
    projTimer = setInterval(() => {
        if(i >= t.length) { clearInterval(projTimer); return; }
        const c = t[i];
        content.innerHTML = `<div class="animate-in flex flex-col items-center">${q.type==='Morse'?`<div class="text-[25vw] font-mono text-[var(--skw-gold)]">${MORSE_CODE[c]||c}</div>`:renderStickFigure(c, "white", 450)}<div class="mt-16 text-slate-500 font-black text-2xl uppercase tracking-widest">字母 ${i+1} / ${t.length}</div></div>`;
        i++;
    }, speed);
};

// ===================== TEST LIST & TABLES =====================
function renderTestList() {
    const list = $('testQuestionList'), labels = {"Morse":"摩斯密碼","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高密碼","Grid":"座標密碼","Phone":"電話密碼","Caesar":"凱撒位移","Atbash":"反射密碼","Reverse":"倒序密碼","NATO":"NATO 音標","Cangjie":"倉頡密碼","Pinyin":"拼音密碼","Jyutping":"粵拼密碼"};
    list.innerHTML = testQuestions.map((q,idx) => `
        <div class="skw-card flex flex-col md:flex-row justify-between items-center mb-0 p-5 gap-4">
            <div class="flex items-center gap-4 flex-wrap">
                <span class="text-[var(--skw-gold)] font-black text-xl">Q${idx+1}</span>
                <span class="font-bold text-white">${q.text}</span>
                <select onchange="testQuestions[${idx}].type=this.value; save(); renderTestList();" class="bg-black/60 text-white text-xs p-2 rounded-lg font-bold">
                    ${Object.entries(labels).map(([v,l]) => `<option value="${v}" ${q.type===v?'selected':''}>${l}</option>`).join('')}
                </select>
                ${(q.type==='Morse'||q.type==='Semaphore')?`<select onchange="testQuestions[${idx}].display=this.value; save();" class="bg-sky-900/40 text-sky-200 text-xs p-2 rounded-lg font-bold"><option value="static" ${q.display==='static'?'selected':''}>整條</option><option value="carousel" ${q.display==='carousel'?'selected':''}>輪播</option></select>`:''}
            </div>
            <button onclick="testQuestions.splice(${idx},1); save(); renderTestList();" class="text-red-400 text-xs font-black">刪除</button>
        </div>`).join('');
}

function buildReferenceTables() {
    let h = ''; const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');
    for(let i=0; i<chars.length; i+=6) { h += '<tr>'; for(let j=0; j<6 && (i+j)<chars.length; j++) { let c = chars[i+j]; h += `<td data-ch="${c}"><b>${c}</b><br>${MORSE_CODE[c]}</td>`; } h += '</tr>'; }
    if($('morseTable')) $('morseTable').innerHTML = h;
    h = ''; "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => { h += `<div class="flex flex-col items-center gap-1 p-2 bg-black/20 rounded border border-white/5"><span class="text-[9px] font-black text-slate-500">${c}</span><img src="images/${SEMAPHORE_MAP[c]}" class="w-10 h-10 grayscale opacity-40"></div>`; });
    if($('semaphoreGrid')) $('semaphoreGrid').innerHTML = h;
    const key = $('gridKey').value.toUpperCase(), alpha = "ABCDEFGHIKLMNOPQRSTUVWXY";
    h = `<tr><th></th>${key.split('').map(k => `<th>${k}</th>`).join('')}</tr>`;
    for(let r=0; r<5; r++) { h += `<tr><th>${key[r]}</th>`; for(let c=0; c<5; c++) { let char = alpha[r*5 + c]; h += `<td data-ch="${char}">${char}</td>`; } h += '</tr>'; }
    if($('gridTable')) $('gridTable').innerHTML = h;
}

function highlightTables(t) { const s = new Set(t.split('')); document.querySelectorAll('td[data-ch]').forEach(td => td.classList.toggle('highlight', s.has(td.dataset.ch))); }
const save = () => localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions));

// ===================== PEERJS GAME =====================
function initHost() {
    peer = new Peer();
    peer.on('open', (id) => { $('gameIdDisplay').textContent = `Room ID: ${id}`; generateJoinQR(id); });
    peer.on('connection', (conn) => {
        conn.on('data', (d) => {
            if(d.type==='join') { players[conn.peer]={name:d.name,time:null}; connections.push(conn); updateHostUI(); }
            if(d.type==='buzz' && gameMode==='open' && !players[conn.peer].time) {
                players[conn.peer].time=Date.now(); buzzQueue.push({id:conn.peer, name:players[conn.peer].name, time:players[conn.peer].time});
                buzzQueue.sort((a,b)=>a.time-b.time); updateHostUI(); broadcast({type:'buzzUpdate',queue:buzzQueue});
            }
        });
    });
}
function generateJoinQR(id) { $('joinQr').innerHTML = ''; new QRCode($('joinQr'), { text: `${window.location.origin}${window.location.pathname}?join=${id}`, width:150, height:150 }); }
function broadcast(d) { connections.forEach(c => c.send(d)); }
function updateHostUI() {
    $('playerCount').textContent = `${Object.keys(players).length} 人在線`;
    $('buzzList').innerHTML = buzzQueue.map((p,idx)=>`<div class="skw-card p-6 bg-[var(--skw-gold)] text-black text-center font-black animate-in shadow-2xl"><span class="text-4xl block mb-2">#${idx+1}</span>${p.name}</div>`).join('');
}
function initMember(hostId) {
    peer = new Peer(); peer.on('open', () => {
        hostConn = peer.connect(hostId);
        hostConn.on('data', (d) => {
            if(d.type==='modeUpdate') { gameMode=d.mode; $('btnBuzzer').classList.toggle('disabled', gameMode!=='open'); $('buzzStatus').textContent = gameMode==='open'?'開放中！快搶！':'請等待領袖...'; }
            if(d.type==='buzzUpdate') { if(d.queue.find(p=>p.id===peer.id)) { $('btnBuzzer').classList.add('disabled'); $('buzzStatus').textContent='搶答成功！'; if(navigator.vibrate) navigator.vibrate(200); } }
        });
    });
}
function handleBuzz() { if(gameMode==='open' && hostConn) hostConn.send({type:'buzz'}); }

// ===================== MAIN INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active'); const m = this.dataset.mode;
            $('editorView').classList.toggle('hidden', m!=='editor');
            $('testPaperView').classList.toggle('hidden', m!=='testpaper');
            $('gameView').classList.toggle('hidden', m!=='game');
            $('currentModeTitle').textContent = m.toUpperCase() + ' MODE';
            if(m === 'game' && !peer) initHost();
            if(m === 'testpaper') renderTestList();
        };
    });

    $('mobileMenuBtn').onclick = () => $('sidebar').classList.toggle('open');
    $('inputText').oninput = updateAll;
    $('gridKey').oninput = () => { buildReferenceTables(); updateAll(); };
    $('projSpeed').oninput = function() { $('projSpeedVal').textContent = (this.value/1000).toFixed(1) + 's'; };

    $('btnAddToTest').onclick = () => { const v=$('inputText').value; if(v){ testQuestions.push({id:Date.now(), text:v, type:'Morse', display:'static'}); save(); showToast('已加入試卷'); } };
    $('btnProjectTest').onclick = () => { if(testQuestions.length) { currentProjIdx=0; showProjection(); } };
    $('btnProjNext').onclick = () => { if(currentProjIdx < testQuestions.length-1) { currentProjIdx++; showProjection(); } };
    $('btnProjPrev').onclick = () => { if(currentProjIdx > 0) { currentProjIdx--; showProjection(); } };
    $('btnExitProjection').onclick = () => { $('projectionOverlay').style.display='none'; clearInterval(projTimer); };
    
    $('btnJoinConfirm').onclick = () => { const n=$('playerName').value.trim(); if(n){ hostConn.send({type:'join',name:n}); $('memberJoinForm').classList.add('hidden'); $('memberBuzzer').classList.remove('hidden'); $('displayMyName').textContent=n; } };
    $('btnBuzzer').onclick = handleBuzz;
    $('btnStartGame').onclick = () => { gameMode='open'; buzzQueue=[]; broadcast({type:'modeUpdate',mode:'open'}); updateHostUI(); };

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('join')) { $('mainContent').classList.add('hidden'); $('sidebar').classList.add('hidden'); $('memberView').classList.remove('hidden'); $('memberView').style.display='flex'; initMember(urlParams.get('join')); }

    window.onbeforeprint = () => {
        const style = $('semPrintStyle').value;
        $('printQuestions').innerHTML = testQuestions.map((q, idx) => {
            let encoded = ''; const t = q.text.toUpperCase();
            if(q.type==='Semaphore') encoded = `<div class="flex flex-wrap gap-4">${t.split('').map(c => c===' '?'<div class="w-8"></div>':(style==='stick'?renderStickFigure(c, "black", 60):`<img src="images/${SEMAPHORE_MAP[c]}" class="w-16 h-16 grayscale border border-black p-0.5">`)).join('')}</div>`;
            else if(q.type==='Braille') encoded = `<div class="flex flex-wrap gap-4">${t.split('').map(c => c===' '?'<div class="w-8"></div>':renderBraille(c)).join('')}</div>`;
            else if(q.type==='Pigpen') encoded = `<div class="flex flex-wrap gap-4">${t.split('').map(c => c===' '?'<div class="w-8"></div>':renderPigpenSVG(c, "black")).join('')}</div>`;
            else encoded = `<span class="text-2xl font-mono">${getEncoded(q.text, q.type)}</span>`;
            return `<div class="mb-12 border-2 border-black p-8 rounded-xl break-inside-avoid"><b>Q${idx+1}. (${q.type})</b><div class="mt-4 flex items-center justify-center">${encoded}</div><div class="mt-8 border-b border-black h-8 w-full"></div><p class="text-xs text-gray-400 mt-2">ANSWER: __________________________________________________________________</p></div>`;
        }).join('');
    };

    $('btnPlayMorse').onclick = () => {
        const text=$('inputText').value.toUpperCase(); if(!text) return;
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); let t = ctx.currentTime;
        text.split('').forEach(c => {
            const code = MORSE_CODE[c]; if(code) { code.split('').forEach(s => {
                const d=s==='.'?0.1:0.3; const o=ctx.createOscillator(); const g=ctx.createGain();
                o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.1,t); o.start(t); o.stop(t+d); t+=d+0.1;
            }); t+=0.2; } else if(c===' ') t+=0.4;
        });
    };

    buildReferenceTables();
    updateAll();
});
