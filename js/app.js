// ===================== DATA & MAPPINGS =====================
const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
const SEMAPHORE_MAP = {'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png','I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png','Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png','Y':'y.png','Z':'z.png','!':'error.png','@':'endof.png','#':'answering.png','$':'attention.png','%':'numbers.png'};
const BRAILLE_MAP = {'A':[1],'B':[1,2],'C':[1,4],'D':[1,4,5],'E':[1,5],'F':[1,2,4],'G':[1,2,4,5],'H':[1,2,5],'I':[2,4],'J':[2,4,5],'K':[1,3],'L':[1,2,3],'M':[1,3,4],'N':[1,3,4,5],'O':[1,3,5],'P':[1,2,3,4],'Q':[1,2,3,4,5],'R':[1,2,3,5],'S':[2,3,4],'T':[2,3,4,5],'U':[1,3,6],'V':[1,2,3,6],'W':[2,4,5,6],'X':[1,3,4,6],'Y':[1,3,4,5,6],'Z':[1,3,5,6]};
const CANGJIE_MAP = {'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈','J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口','S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'};
const JYUTPING_MAP = {'A':'ei1','B':'bi1','C':'si1','D':'di1','E':'i1','F':'ef1','G':'ji1','H':'eich1','I':'ai1','J':'jei1','K':'kei1','L':'el1','M':'em1','N':'en1','O':'ou1','P':'pi1','Q':'kiu1','R':'aa1','S':'es1','T':'ti1','U':'ju1','V':'wi1','W':'dël-bü-liu-ju1','X':'ik-si1','Y':'wai1','Z':'zet1'};
const PINYIN_MAP = {'A':'ēi','B':'bì','C':'sēi','D':'dì','E':'yì','F':'ài-fū','G':'jì','H':'ēi-chǔ','I':'ài','J':'jiè','K':'kèi','L':'ài-ōu','M':'ài-mǔ','N':'ēn','O':'ōu','P':'pī','Q':'kiŭ','R':'á','S':'ài-sǐ','T':'tì','U':'yōu','V':'wēi','W':'dá-bù-liù-yōu','X':'ài-kè-sī','Y':'wài','Z':'zèi'};
const PHONE_LOOKUP = {};
const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });

// ===================== STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0;
let peer = null;
let hostConn = null;
let connections = [];
let players = {};
let buzzQueue = [];
let gameMode = 'idle';

const $ = (id) => document.getElementById(id);
const showToast = (msg) => { const t = $('toast'); if(t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); } };

// ===================== CORE CIPHER LOGIC =====================
function renderBrailleChar(c) {
    const dots = BRAILLE_MAP[c.toUpperCase()] || [];
    let h = '<div class="braille-char">';
    for(let i=1; i<=6; i++) h += `<div class="braille-dot ${dots.includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function renderPigpenSVG(c, color = "#ffcc00") {
    const maps = {'A':"M35,10 L35,35 L10,35",'B':"M10,10 L10,35 L35,35 L35,10",'C':"M10,10 L10,35 L35,35",'D':"M10,10 L35,10 L35,35 L10,35",'E':"M10,10 L35,10 L35,35 L10,35 Z",'F':"M35,10 L10,10 L10,35 L35,35",'G':"M35,35 L35,10 L10,10",'H':"M10,35 L10,10 L35,10 L35,35",'I':"M10,35 L10,10 L35,10",'J':["M35,10 L35,35 L10,35",true],'K':["M10,10 L10,35 L35,35 L35,10",true],'L':["M10,10 L10,35 L35,35",true],'M':["M10,10 L35,10 L35,35 L10,35",true],'N':["M10,10 L35,10 L35,35 L10,35 Z",true],'O':["M35,10 L10,10 L10,35 L35,35",true],'P':["M35,35 L35,10 L10,10",true],'Q':["M10,35 L10,10 L35,10 L35,35",true],'R':["M10,35 L10,10 L35,10",true],'S':"M10,10 L22.5,22.5 L35,10",'T':"M35,10 L22.5,22.5 L35,35",'U':"M10,35 L22.5,22.5 L35,35",'V':"M10,10 L22.5,22.5 L10,35",'W':["M10,10 L22.5,22.5 L35,10",true,{x:22.5,y:15}],'X':["M35,10 L22.5,22.5 L35,35",true,{x:30,y:22.5}],'Y':["M10,35 L22.5,22.5 L35,35",true,{x:22.5,y:30}],'Z':["M10,10 L22.5,22.5 L10,35",true,{x:15,y:22.5}]};
    let data = maps[c.toUpperCase()];
    if(!data) return `<span>${c}</span>`;
    let path = Array.isArray(data) ? data[0] : data;
    let dot = Array.isArray(data) && data[1];
    let dotPos = (Array.isArray(data) && data[2]) || {x:22.5,y:22.5};
    return `<svg class="pigpen-svg" width="40" height="40" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><circle cx="${dotPos.x}" cy="${dotPos.y}" r="${dot?3:0}" fill="${color}"/></svg>`;
}

function encodeGrid(text, key) {
    const alpha = "ABCDEFGHIKLMNOPQRSTUVWXY";
    return text.toUpperCase().split('').map(c => {
        if(c===' ') return '/'; if(c==='Z') return 'Z';
        let idx = alpha.indexOf(c);
        if(idx===-1) return c;
        return key[idx % 5] + key[Math.floor(idx / 5)];
    }).join(' ');
}

function getEncoded(text, type, key = 'SCOUT', shift = 3) {
    const upper = text.toUpperCase();
    switch(type) {
        case 'Morse': return upper.split('').map(c => MORSE_CODE[c] || c).join(' ');
        case 'Grid': return encodeGrid(upper, key);
        case 'Caesar': return upper.replace(/[A-Z]/g, c => String.fromCharCode(65 + (c.charCodeAt(0) - 65 + shift) % 26));
        case 'Atbash': return upper.replace(/[A-Z]/g, c => String.fromCharCode(90 - (c.charCodeAt(0) - 65)));
        case 'Cangjie': return upper.split('').map(c => c===' '?'/':(CANGJIE_MAP[c] || c)).join(' ');
        case 'Pinyin': return upper.split('').map(c => c===' '?'/':(PINYIN_MAP[c] || c)).join(' ');
        case 'Jyutping': return upper.split('').map(c => c===' '?'/':(JYUTPING_MAP[c] || c)).join(' ');
        case 'Phone': return upper.split('').map(c => c===' '?'0':(PHONE_LOOKUP[c] ? PHONE_LOOKUP[c].key + PHONE_LOOKUP[c].presses : c)).join(' ');
        default: return upper;
    }
}

// ===================== UPDATE VIEW =====================
function updateAll() {
    const text = $('inputText').value;
    const upper = text.toUpperCase();
    const key = ($('gridKey').value || 'SCOUT').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);
    const shift = parseInt($('caesarShift').value) || 3;

    if($('outMorse')) $('outMorse').textContent = getEncoded(text, 'Morse');
    if($('outSemaphore')) {
        $('outSemaphore').innerHTML = upper.split('').map(c => {
            if(c === ' ') return '<span class="w-8"></span>';
            const src = SEMAPHORE_MAP[c];
            return src ? `<img src="images/${src}" class="semaphore-img">` : `<div class="semaphore-img flex items-center justify-center font-bold text-2xl">${c}</div>`;
        }).join('');
    }
    if($('outBraille')) $('outBraille').innerHTML = upper.split('').map(c => c===' '?'<span class="w-8"></span>':renderBrailleChar(c)).join('');
    if($('outPigpen')) $('outPigpen').innerHTML = upper.split('').map(c => c===' '?'<span class="mx-4 text-amber-500 font-bold">/</span>':renderPigpenSVG(c)).join('');
    if($('outGrid')) $('outGrid').textContent = getEncoded(text, 'Grid', key);
    if($('outCaesar')) $('outCaesar').textContent = getEncoded(text, 'Caesar', '', shift);
    if($('outAtbash')) $('outAtbash').textContent = getEncoded(text, 'Atbash');
    if($('outCangjie')) $('outCangjie').textContent = getEncoded(text, 'Cangjie');
    if($('outPinyin')) $('outPinyin').textContent = getEncoded(text, 'Pinyin');
    if($('outJyutping')) $('outJyutping').textContent = getEncoded(text, 'Jyutping');

    highlightTables(upper);
}

function buildReferenceTables() {
    let h = '';
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');
    for(let i=0; i<chars.length; i+=6) {
        h += '<tr>';
        for(let j=0; j<6 && (i+j)<chars.length; j++) {
            let c = chars[i+j];
            h += `<td data-ch="${c}" class="border border-white/5 p-2 text-center text-xs"><b>${c}</b><br>${MORSE_CODE[c]}</td>`;
        }
        h += '</tr>';
    }
    if($('morseTable')) $('morseTable').innerHTML = h;

    h = '';
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => {
        h += `<div class="flex flex-col items-center gap-1 p-2 bg-black/20 rounded border border-white/5">
            <span class="text-[9px] font-bold text-slate-500">${c}</span>
            <img src="images/${SEMAPHORE_MAP[c]}" class="w-10 h-10 grayscale opacity-40">
        </div>`;
    });
    if($('semaphoreGrid')) $('semaphoreGrid').innerHTML = h;

    const brailleWrap = $('brailleTableWrap');
    if(brailleWrap) {
        h = '<div class="grid grid-cols-6 md:grid-cols-9 gap-2">';
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => {
            h += `<div class="flex flex-col items-center gap-1">${renderBrailleChar(c)}<span class="text-[10px] text-slate-500">${c}</span></div>`;
        });
        brailleWrap.innerHTML = h + '</div>';
    }

    const key = ($('gridKey').value || 'SCOUT').toUpperCase();
    if($('gridTable')) {
        h = `<tr><th class="p-2"></th>${key.split('').map(k => `<th class="p-2 text-[var(--skw-gold)]">${k}</th>`).join('')}</tr>`;
        const alpha = "ABCDEFGHIKLMNOPQRSTUVWXY";
        for(let r=0; r<5; r++) {
            h += `<tr><th class="p-2 text-[var(--skw-gold)]">${key[r]}</th>`;
            for(let c=0; c<5; c++) {
                let char = alpha[r*5 + c] || '';
                h += `<td data-ch="${char}" class="p-2 border border-white/5 text-center">${char}</td>`;
            }
            h += '</tr>';
        }
        $('gridTable').innerHTML = h;
    }

    const cjWrap = $('cangjieTableWrap');
    if(cjWrap) {
        h = '<div class="grid grid-cols-5 md:grid-cols-10 gap-2">';
        Object.entries(CANGJIE_MAP).forEach(([k,v]) => {
            h += `<div class="p-2 bg-black/20 rounded border border-white/5 text-center"><span class="block text-[10px] text-slate-500">${k}</span><span class="text-lg font-bold text-[var(--skw-gold)]">${v}</span></div>`;
        });
        cjWrap.innerHTML = h + '</div>';
    }
}

function highlightTables(text) {
    const chars = new Set(text.split(''));
    document.querySelectorAll('td[data-ch]').forEach(td => td.classList.toggle('bg-sky-500/20', chars.has(td.dataset.ch)));
}

// ===================== PROJECTION & PRINT =====================
function showProjection() {
    const q = testQuestions[currentProjIdx];
    const overlay = $('projectionOverlay');
    overlay.style.display = 'flex';
    $('projCounter').textContent = `${currentProjIdx + 1} / ${testQuestions.length}`;
    
    let html = '';
    const upper = q.text.toUpperCase();
    
    if(q.type==='Morse') html = `<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${getEncoded(q.text, 'Morse')}</div>`;
    else if(q.type==='Semaphore') html = `<div class="flex flex-wrap justify-center gap-10">${upper.split('').map(c=>c===' '?'<div class="w-20"></div>':`<img src="images/${SEMAPHORE_MAP[c]}" class="w-48 h-48 bg-white p-4 rounded-3xl">`).join('')}</div>`;
    else if(q.type==='Braille') html = `<div class="flex flex-wrap justify-center gap-10 scale-[2]">${upper.split('').map(c=>c===' '?'<div class="w-10"></div>':renderBrailleChar(c)).join('')}</div>`;
    else if(q.type==='Pigpen') html = `<div class="flex flex-wrap justify-center gap-10 scale-[3]">${upper.split('').map(c=>c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
    else if(q.type==='Grid') html = `<div class="text-[10vw] font-mono tracking-[0.5em] text-[var(--skw-gold)]">${getEncoded(q.text, 'Grid')}</div>`;
    else if(q.type==='Caesar') html = `<div class="text-[10vw] font-mono text-[var(--skw-gold)]">${getEncoded(q.text, 'Caesar')}</div>`;
    else if(q.type==='Atbash') html = `<div class="text-[10vw] font-mono text-[var(--skw-gold)]">${getEncoded(q.text, 'Atbash')}</div>`;
    else if(q.type==='Cangjie') html = `<div class="text-[8vw] font-bold text-[var(--skw-gold)]">${getEncoded(q.text, 'Cangjie')}</div>`;
    else if(q.type==='Pinyin') html = `<div class="text-[8vw] font-bold text-[var(--skw-gold)]">${getEncoded(q.text, 'Pinyin')}</div>`;
    else if(q.type==='Jyutping') html = `<div class="text-[8vw] font-bold text-[var(--skw-gold)]">${getEncoded(q.text, 'Jyutping')}</div>`;
    else html = `<div class="text-[10vw] font-black text-white">${upper}</div>`;
    
    $('projectionContent').innerHTML = `<div class="text-center w-full px-10">${html}<div class="mt-24 text-slate-700 font-bold text-2xl tracking-[1em] opacity-40 uppercase">SKWSCOUT ASSESSMENT</div></div>`;
}

window.onbeforeprint = () => {
    $('printQuestions').innerHTML = testQuestions.map((q, idx) => {
        let encoded = '';
        const upper = q.text.toUpperCase();
        if(q.type === 'Morse') encoded = `<span class="text-2xl font-mono">${getEncoded(q.text, 'Morse')}</span>`;
        else if(q.type === 'Semaphore') encoded = `<div class="flex flex-wrap gap-2">${upper.split('').map(c => c===' '?'<div class="w-8"></div>':`<img src="images/${SEMAPHORE_MAP[c]}" class="w-12 h-12 grayscale border border-black p-0.5">`).join('')}</div>`;
        else if(q.type === 'Braille') encoded = `<div class="flex flex-wrap gap-4">${upper.split('').map(c => c===' '?'<div class="w-8"></div>':renderBrailleChar(c)).join('')}</div>`;
        else if(q.type === 'Pigpen') encoded = `<div class="flex flex-wrap gap-4">${upper.split('').map(c => c===' '?'<div class="w-8"></div>':renderPigpenSVG(c, "#000")).join('')}</div>`;
        else if(q.type === 'Grid' || q.type === 'Caesar' || q.type === 'Atbash') encoded = `<span class="text-2xl font-mono">${getEncoded(q.text, q.type)}</span>`;
        else if(q.type === 'Cangjie' || q.type === 'Pinyin' || q.type === 'Jyutping') encoded = `<span class="text-2xl font-bold">${getEncoded(q.text, q.type)}</span>`;
        else encoded = `<span class="text-2xl font-mono">${upper}</span>`;

        return `<div class="mb-12 break-inside-avoid">
            <p class="text-lg font-bold mb-4">Q${idx+1}. 翻譯以下密碼 (${q.type}):</p>
            <div class="p-8 border-2 border-black rounded flex items-center justify-center min-h-[120px]">${encoded}</div>
            <div class="mt-4 border-b border-black h-8"></div>
            <p class="text-xs text-gray-500 mt-1">答案 Ans: ____________________________________________________</p>
        </div>`;
    }).join('');
};

// ===================== TEST QUESTION LIST =====================
function renderTestQuestionList() {
    const list = $('testQuestionList');
    if(testQuestions.length === 0) return list.innerHTML = '<p class="text-center text-slate-500 italic py-10">清單為空</p>';
    
    const types = ["Morse", "Semaphore", "Braille", "Pigpen", "Grid", "Caesar", "Atbash", "Cangjie", "Pinyin", "Jyutping", "Phone", "Text"];
    
    list.innerHTML = testQuestions.map((q,idx)=>`
        <div class="skw-card p-4 flex justify-between items-center mb-0">
            <div class="flex items-center gap-4">
                <span class="font-black text-[var(--skw-gold)]">Q${idx+1}</span>
                <span class="text-white font-bold">${q.text}</span>
                <select onchange="testQuestions[${idx}].type=this.value;localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions))" class="bg-black/60 text-white text-xs border border-white/20 rounded px-2 py-1 outline-none">
                    ${types.map(t => `<option value="${t}" ${q.type===t?'selected':''}>${t}</option>`).join('')}
                </select>
            </div>
            <button onclick="testQuestions.splice(${idx},1);localStorage.setItem('skw_test_questions',JSON.stringify(testQuestions));renderTestQuestionList();" class="text-red-400 text-xs font-bold hover:text-red-300">刪除</button>
        </div>`).join('');
}

// ===================== PEERJS GAME FUNCTIONS =====================
function initHost() {
    peer = new Peer();
    peer.on('open', (id) => { $('gameIdDisplay').textContent = `房號: ${id}`; generateJoinQR(id); });
    peer.on('connection', (conn) => {
        conn.on('data', (data) => {
            if(data.type==='join') { players[conn.peer]={name:data.name,buzzTime:null}; connections.push(conn); updateHostUI(); }
            if(data.type==='buzz' && gameMode==='open' && !players[conn.peer].buzzTime) {
                players[conn.peer].buzzTime=Date.now(); buzzQueue.push({id:conn.peer, name:players[conn.peer].name, time:players[conn.peer].buzzTime});
                buzzQueue.sort((a,b)=>a.time-b.time); updateHostUI(); broadcast({type:'buzzUpdate',queue:buzzQueue});
            }
        });
    });
}
function generateJoinQR(id) {
    $('joinQr').innerHTML = ''; new QRCode($('joinQr'), { text: `${window.location.origin}${window.location.pathname}?join=${id}`, width:150, height:150 });
}
function broadcast(data) { connections.forEach(c => c.send(data)); }
function updateHostUI() {
    $('playerCount').textContent = `${Object.keys(players).length} 人在線`;
    $('buzzList').innerHTML = buzzQueue.map((p,idx)=>`<div class="skw-card p-4 bg-[var(--skw-gold)] text-black text-center font-bold shadow-xl animate-in"><span class="text-3xl block">#${idx+1}</span>${p.name}</div>`).join('');
}
function initMember(hostId) {
    peer = new Peer();
    peer.on('open', () => {
        hostConn = peer.connect(hostId);
        hostConn.on('data', (data) => {
            if(data.type==='modeUpdate') { 
                gameMode=data.mode; 
                $('btnBuzzer').classList.toggle('disabled', gameMode!=='open'); 
                $('buzzStatus').textContent = gameMode==='open'?'開放搶答中！':'請等待領袖...'; 
            }
            if(data.type==='buzzUpdate') { 
                if(data.queue.find(p=>p.id===peer.id)) { 
                    $('btnBuzzer').classList.add('disabled'); 
                    $('buzzStatus').textContent='已搶答！'; 
                    if(navigator.vibrate) navigator.vibrate(200); 
                } 
            }
        });
    });
}
function handleBuzz() { if(gameMode==='open' && hostConn) hostConn.send({type:'buzz'}); }

// ===================== APP INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const mode = this.dataset.mode;
            $('editorView').style.display = mode === 'editor' ? 'block' : 'none';
            $('testPaperView').style.display = mode === 'testpaper' ? 'block' : 'none';
            $('gameView').style.display = mode === 'game' ? 'block' : 'none';
            $('currentModeTitle').textContent = mode.toUpperCase() + ' MODE';
            if(mode === 'game' && !peer) initHost();
            if(mode === 'testpaper') renderTestQuestionList();
        };
    });

    $('mobileMenuBtn').onclick = () => $('sidebar').classList.toggle('open');
    $('inputText').oninput = updateAll;
    $('gridKey').oninput = () => { buildReferenceTables(); updateAll(); };
    $('caesarShift').oninput = updateAll;
    $('caesarDir').onchange = updateAll;
    $('btnDemo').onclick = () => { $('inputText').value = 'BRAVO SCOUTS'; updateAll(); };
    
    $('btnAddToTest').onclick = () => {
        const text = $('inputText').value.trim();
        if(!text) return showToast('請輸入文字');
        testQuestions.push({ id: Date.now(), text, type: 'Morse' });
        localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions));
        showToast('已加入試題');
    };

    $('btnClearTest').onclick = () => { if(confirm('清空試卷？')) { testQuestions=[]; localStorage.setItem('skw_test_questions','[]'); renderTestQuestionList(); } };
    $('btnProjectTest').onclick = () => { if(testQuestions.length) { currentProjIdx=0; showProjection(); } };
    $('btnExportPDF').onclick = () => { if(testQuestions.length) window.print(); else alert('請先加入題目'); };
    
    $('btnExitProjection').onclick = () => $('projectionOverlay').style.display='none';
    $('btnProjNext').onclick = () => { if(currentProjIdx < testQuestions.length-1) { currentProjIdx++; showProjection(); } };
    $('btnProjPrev').onclick = () => { if(currentProjIdx > 0) { currentProjIdx--; showProjection(); } };

    $('btnPlayMorse').onclick = () => {
        const text=$('inputText').value.toUpperCase(); if(!text) return;
        const ctx=new (window.AudioContext||window.webkitAudioContext)(); let t=ctx.currentTime;
        text.split('').forEach(c=>{
            const code=MORSE_CODE[c]; if(code) { code.split('').forEach(s=>{
                const d=s==='.'?0.1:0.3; const o=ctx.createOscillator(); const g=ctx.createGain();
                o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.1,t); o.start(t); o.stop(t+d); t+=d+0.1;
            }); t+=0.2; } else if(c===' ') t+=0.4;
        });
    };

    buildReferenceTables();
    updateAll();
});
