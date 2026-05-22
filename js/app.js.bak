// ===================== DATA =====================
const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
const SEMAPHORE_MAP = {'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png','I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png','Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png','Y':'y.png','Z':'z.png'};
const SEM_ANGLES = {'A':[180,225],'B':[180,270],'C':[180,315],'D':[180,0],'E':[0,45],'F':[0,90],'G':[0,135],'H':[225,270],'I':[225,315],'J':[90,0],'K':[225,0],'L':[225,45],'M':[225,90],'N':[225,135],'O':[270,315],'P':[270,0],'Q':[270,45],'R':[270,90],'S':[270,135],'T':[315,0],'U':[315,45],'V':[0,90],'W':[45,90],'X':[45,135],'Y':[315,90],'Z':[135,90]};
const BRAILLE_MAP = {'A':[1],'B':[1,2],'C':[1,4],'D':[1,4,5],'E':[1,5],'F':[1,2,4],'G':[1,2,4,5],'H':[1,2,5],'I':[2,4],'J':[2,4,5],'K':[1,3],'L':[1,2,3],'M':[1,3,4],'N':[1,3,4,5],'O':[1,3,5],'P':[1,2,3,4],'Q':[1,2,3,4,5],'R':[1,2,3,5],'S':[2,3,4],'T':[2,3,4,5],'U':[1,3,6],'V':[1,2,3,6],'W':[2,4,5,6],'X':[1,3,4,6],'Y':[1,3,4,5,6],'Z':[1,3,5,6]};
const CANGJIE_ROOTS = {'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈','J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口','S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'};
const NATO_MAP = {'A':'Alpha','B':'Bravo','C':'Charlie','D':'Delta','E':'Echo','F':'Foxtrot','G':'Golf','H':'Hotel','I':'India','J':'Juliett','K':'Kilo','L':'Lima','M':'Mike','N':'November','O':'Oscar','P':'Papa','Q':'Quebec','R':'Romeo','S':'Sierra','T':'Tango','U':'Uniform','V':'Victor','W':'Whiskey','X':'X-ray','Y':'Yankee','Z':'Zulu'};
const PHONE_LOOKUP = {}; const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });

// 中文 -> 倉頡/速成解碼 (範例擴充庫)
const CHINESE_DICTIONARY = {
    '昌':'AA','明':'AB','童':'YT','軍':'BW','海':'EY','山':'U','天':'MK','地':'GP','人':'O'
};

// ===================== STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0, projTimer = null, audioCtx = null, peer = null, hostConn = null, connections = [], players = {}, buzzQueue = [], gameMode = 'idle';

const $ = (id) => document.getElementById(id);
const showToast = (msg) => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); };

// ===================== RENDERERS =====================
function renderStickFigure(c, color = "white", size = 80) {
    const a = SEM_ANGLES[c.toUpperCase()]; if(!a) return `<div style="width:${size}px; height:${size}px; display:flex; align-items:center; justify-content:center; font-size:2rem">${c}</div>`;
    let h = `<svg width="${size}" height="${size*1.2}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">`;
    h += `<circle cx="50" cy="25" r="10" fill="none" stroke="${color}" stroke-width="4"/><line x1="50" y1="35" x2="50" y2="75" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="35" y2="110" stroke="${color}" stroke-width="4"/><line x1="50" y1="75" x2="65" y2="110" stroke="${color}" stroke-width="4"/>`;
    a.forEach((ang, i) => { const rad=(ang-90)*Math.PI/180; h+=`<line x1="50" y1="45" x2="${50+Math.cos(rad)*45}" y2="${45+Math.sin(rad)*45}" stroke="${color==='white'?(i===0?'#ffcc00':'#00d2ff'):'black'}" stroke-width="6" stroke-linecap="round"/>`; });
    return h + `</svg>`;
}

function renderDoll(c, size = 100) {
    const src = SEMAPHORE_MAP[c.toUpperCase()];
    return src ? `<img src="images/${src}" style="width:${size}px; height:${size}px; object-fit:contain; background:white; border-radius:10px; padding:4px;">` : renderStickFigure(c, "white", size);
}

function renderBraille(c) {
    const d = BRAILLE_MAP[c.toUpperCase()] || [];
    let h = '<div class="braille-char">';
    for(let i=1; i<=6; i++) h += `<div class="braille-dot ${d.includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function encodeChinese(text) {
    return text.split('').map(char => CHINESE_DICTIONARY[char] || char).join(' ').toUpperCase();
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
        case 'Cangjie': case 'Quick': return encodeChinese(text);
        default: return t;
    }
}

// ===================== PROJECTION ENGINE =====================
function clearProj() { clearInterval(projTimer); projTimer = null; if(audioCtx) { audioCtx.close(); audioCtx = null; } $('btnProjPlay').classList.add('hidden'); }

function showProjection() {
    clearProj(); const q = testQuestions[currentProjIdx]; if(!q) return;
    $('projectionOverlay').style.display = 'flex';
    $('projCounter').textContent = `${currentProjIdx + 1} / ${testQuestions.length}`;
    if((q.type==='Morse' && (q.display==='carousel'||q.display==='audio')) || (q.type==='Semaphore' && q.display==='carousel')) {
        $('btnProjPlay').classList.remove('hidden');
        $('btnProjPlay').textContent = q.display === 'audio' ? '🔊 播放音訊' : '▶ 開始輪播';
    }
    renderProjStatic(q);
}

function renderProjStatic(q) {
    const content = $('projectionContent'), upper = q.text.toUpperCase(); let html = '';
    if(q.display === 'static' || (q.type !== 'Morse' && q.type !== 'Semaphore')) {
        if(q.type==='Morse') html = `<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${getEncoded(q.text, 'Morse')}</div>`;
        else if(q.type==='Semaphore') {
            const style = $('semPrintStyle').value;
            html = `<div class="flex flex-wrap justify-center gap-6">${upper.split('').map(c => c===' '?'<div class="w-16"></div>':(style==='doll'?renderDoll(c,120):renderStickFigure(c,"white",120))).join('')}</div>`;
        }
        else if(q.type==='Braille') html = `<div class="flex flex-wrap justify-center gap-10 scale-[2.5]">${upper.split('').map(c => c===' '?'<div class="w-10"></div>':renderBraille(c)).join('')}</div>`;
        else if(q.type==='Pigpen') html = `<div class="flex flex-wrap justify-center gap-10 scale-[3]">${upper.split('').map(c => c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
        else html = `<div class="text-[9vw] font-black text-white text-center">${getEncoded(q.text, q.type)}</div>`;
    } else {
        html = `<div class="text-slate-600 text-3xl font-black">${q.display==='audio'?'聽力考核項目':'點擊下方開始輪播'}</div>`;
    }
    content.innerHTML = `<div class="animate-in w-full text-center">${html}</div>`;
}

$('btnProjPlay').onclick = () => {
    const q = testQuestions[currentProjIdx], text = q.text.toUpperCase(), speed = parseInt($('projSpeed').value);
    if(q.display === 'audio') { playMorse(text); return; }
    let i = 0; const style = $('semPrintStyle').value;
    clearInterval(projTimer);
    projTimer = setInterval(() => {
        if(i >= text.length) { clearInterval(projTimer); return; }
        const c = text[i]; let h = '';
        if(q.type === 'Morse') h = `<div class="text-[25vw] font-mono text-[var(--skw-gold)]">${MORSE_CODE[c]||c}</div>`;
        else h = (style==='doll' ? renderDoll(c, 450) : renderStickFigure(c, "white", 450));
        $('projectionContent').innerHTML = `<div class="animate-in flex flex-col items-center">${h}<div class="mt-16 text-slate-500 font-bold text-2xl">字母 ${i+1} / ${text.length}</div></div>`;
        i++;
    }, speed);
};

// ===================== INTERFACE & TABLES =====================
function buildReferenceTables() {
    // Morse
    let h = ''; const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split('');
    for(let i=0; i<chars.length; i+=6) { h += '<tr>'; for(let j=0; j<6 && (i+j)<chars.length; j++) { let c = chars[i+j]; h += `<td data-ch="${c}"><b>${c}</b><br>${MORSE_CODE[c]}</td>`; } h += '</tr>'; }
    $('morseTable').innerHTML = h;
    // Semaphore
    h = ''; "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => { h += `<div class="flex flex-col items-center gap-1 p-2 bg-black/20 rounded border border-white/5"><span class="text-[9px] font-black text-slate-500">${c}</span><img src="images/${SEMAPHORE_MAP[c]}" class="w-10 h-10 grayscale opacity-40"></div>`; });
    $('semaphoreGrid').innerHTML = h;
    // Phone
    h = '<div class="grid grid-cols-3 gap-2 w-48">';
    ['1','2:ABC','3:DEF','4:GHI','5:JKL','6:MNO','7:PQRS','8:TUV','9:WXYZ'].forEach(k => { h += `<div class="bg-black/40 p-2 rounded text-center"><div class="text-[var(--skw-gold)] font-bold text-sm">${k.split(':')[0]}</div><div class="text-[9px] text-slate-500">${k.split(':')[1]||''}</div></div>`; });
    $('phoneTableWrap').innerHTML = h + '</div>';
    // Grid
    const key = $('gridKey').value.toUpperCase(), alpha = "ABCDEFGHIKLMNOPQRSTUVWXY";
    h = `<tr><th></th>${key.split('').map(k => `<th>${k}</th>`).join('')}</tr>`;
    for(let r=0; r<5; r++) { h += `<tr><th>${key[r]}</th>`; for(let c=0; c<5; c++) { let ch = alpha[r*5 + c]; h += `<td data-ch="${ch}">${ch}</td>`; } h += '</tr>'; }
    $('gridTable').innerHTML = h;
    // Braille
    h = '<div class="grid grid-cols-9 gap-2">';
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(c => { h += `<div class="flex flex-col items-center gap-1">${renderBraille(c)}<span class="text-[9px] font-bold text-slate-500">${c}</span></div>`; });
    $('brailleTableWrap').innerHTML = h + '</div>';
}

function updateAll() {
    const v = $('inputText').value, t = v.toUpperCase(), key = $('gridKey').value.toUpperCase();
    $('outMorse').textContent = getEncoded(v, 'Morse');
    $('outSemaphore').innerHTML = t.split('').map(c => c === ' ' ? '<span class="w-8"></span>' : renderStickFigure(c, "#ffcc00", 60)).join('');
    $('outPhone').textContent = getEncoded(v, 'Phone');
    $('outBraille').innerHTML = t.split('').map(c => c===' '?'<span class="w-8"></span>':renderBraille(c)).join('');
    $('outPigpen').innerHTML = t.split('').map(c => c===' '?'<span class="mx-2">/</span>':renderPigpenSVG(c)).join('');
    $('outGrid').textContent = getEncoded(v, 'Grid', key);
    $('outCaesar').textContent = getEncoded(v, 'Caesar', '', parseInt($('caesarShift').value));
    $('outAtbash').textContent = getEncoded(v, 'Atbash');
    $('outReverse').textContent = getEncoded(v, 'Reverse');
    $('outNato').textContent = getEncoded(v, 'NATO');
    $('outCangjie').textContent = getEncoded(v, 'Cangjie');
    $('outPinyin').textContent = t.split('').map(c => PINYIN_MAP[c] || c).join(' ');
    $('outJyutping').textContent = t.split('').map(c => JYUTPING_MAP[c] || c).join(' ');
}

// ===================== APP INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    buildReferenceTables(); updateAll();
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active')); this.classList.add('active');
            const m = this.dataset.mode;
            $('editorView').classList.toggle('hidden', m!=='editor');
            $('testPaperView').classList.toggle('hidden', m!=='testpaper');
            $('gameView').classList.toggle('hidden', m!=='game');
            if(m==='testpaper') renderTestList();
        };
    });

    $('mobileMenuBtn').onclick = () => $('sidebar').classList.toggle('open');
    $('inputText').oninput = updateAll;
    $('btnAddToTest').onclick = () => { if($('inputText').value) { testQuestions.push({id:Date.now(), text:$('inputText').value, type:'Morse', display:'static'}); localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions)); showToast('已加入'); } };
    
    // Projection Nav
    $('btnProjectTest').onclick = () => { if(testQuestions.length) { currentProjIdx = 0; showProjection(); } };
    $('btnProjNext').onclick = () => { if(currentProjIdx < testQuestions.length-1) { currentProjIdx++; showProjection(); } };
    $('btnProjPrev').onclick = () => { if(currentProjIdx > 0) { currentProjIdx--; showProjection(); } };
    $('btnExitProjection').onclick = () => { $('projectionOverlay').style.display='none'; clearProj(); };

    // Print
    $('btnExportPDF').onclick = () => {
        if(!testQuestions.length) return alert('請先加入題目');
        const style = $('semPrintStyle').value;
        $('printQuestions').innerHTML = testQuestions.map((q, idx) => {
            let encoded = '';
            if(q.type==='Semaphore') encoded = `<div class="flex flex-wrap gap-4">${q.text.toUpperCase().split('').map(c => c===' '?'<div class="w-8"></div>':(style==='doll'?`<img src="images/${SEMAPHORE_MAP[c]}" class="w-16 h-16 grayscale border border-black p-0.5">`:renderStickFigure(c, "black", 60))).join('')}</div>`;
            else if(q.type==='Braille') encoded = `<div class="flex flex-wrap gap-4">${q.text.toUpperCase().split('').map(c => c===' '?'<div class="w-8"></div>':renderBraille(c)).join('')}</div>`;
            else if(q.type==='Morse' && q.display === 'audio') encoded = `<span class="text-xl italic">（聽力考核項目）</span>`;
            else encoded = `<span class="text-2xl font-mono">${getEncoded(q.text, q.type)}</span>`;
            return `<div class="mb-12 border-2 border-black p-8 rounded-xl break-inside-avoid"><b>Q${idx+1}. 翻譯以下密碼 (${q.type}):</b><div class="mt-6 flex items-center justify-center">${encoded}</div><div class="mt-10 border-b border-black w-full h-8"></div></div>`;
        }).join('');
        window.print();
    };
});

function renderTestList() {
    const list = $('testQuestionList'), labels = {"Morse":"摩斯密碼","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高密碼","Grid":"座標密碼","Phone":"電話密碼","Caesar":"凱撒位移","Atbash":"反射密碼","Reverse":"倒序密碼","NATO":"NATO","Cangjie":"倉頡","Quick":"速成"};
    list.innerHTML = testQuestions.map((q,idx) => `
        <div class="skw-card flex flex-col md:flex-row justify-between items-center mb-0 p-5 gap-4">
            <div class="flex items-center gap-4 flex-wrap">
                <span class="text-[var(--skw-gold)] font-black">Q${idx+1}</span><span class="font-bold">${q.text}</span>
                <select onchange="testQuestions[${idx}].type=this.value; localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions)); renderTestList();" class="bg-black/60 text-white text-xs p-2 rounded">
                    ${Object.entries(labels).map(([v,l]) => `<option value="${v}" ${q.type===v?'selected':''}>${l}</option>`).join('')}
                </select>
                ${(q.type==='Morse'||q.type==='Semaphore') ? `<select onchange="testQuestions[${idx}].display=this.value; localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions)); renderTestList();" class="bg-sky-900/40 text-sky-200 text-xs p-2 rounded">
                    <option value="static" ${q.display==='static'?'selected':''}>整條</option><option value="carousel" ${q.display==='carousel'?'selected':''}>輪播</option>${q.type==='Morse'?'<option value="audio" '+(q.display==='audio'?'selected':'')+'>聲音</option>':''}
                </select>` : ''}
            </div>
            <button onclick="testQuestions.splice(${idx},1); localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions)); renderTestList();" class="text-red-400 text-xs">刪除</button>
        </div>`).join('');
}

function playMorse(text) {
    if(audioCtx) audioCtx.close(); audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let t = audioCtx.currentTime;
    text.split('').forEach(c => {
        const code = MORSE_CODE[c];
        if(code) {
            code.split('').forEach(s => {
                const d = s==='.'?0.1:0.3; const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
                o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(0.1, t); o.start(t); o.stop(t+d); t += d + 0.1;
            }); t += 0.2;
        } else t += 0.4;
    });
}
function renderPigpenSVG(c, color="#ffcc00") {
    const maps = {'A':"M35,10 L35,35 L10,35",'B':"M10,10 L10,35 L35,35 L35,10",'C':"M10,10 L10,35 L35,35",'D':"M10,10 L35,10 L35,35 L10,35",'E':"M10,10 L35,10 L35,35 L10,35 Z",'F':"M35,10 L10,10 L10,35 L35,35",'G':"M35,35 L35,10 L10,10",'H':"M10,35 L10,10 L35,10 L35,35",'I':"M10,35 L10,10 L35,10",'J':["M35,10 L35,35 L10,35",true],'K':["M10,10 L10,35 L35,35 L35,10",true],'L':["M10,10 L10,35 L35,35",true],'M':["M10,10 L35,10 L35,35 L10,35",true],'N':["M10,10 L35,10 L35,35 L10,35 Z",true],'O':["M35,10 L10,10 L10,35 L35,35",true],'P':["M35,35 L35,10 L10,10",true],'Q':["M10,35 L10,10 L35,10 L35,35",true],'R':["M10,35 L10,10 L35,10",true],'S':"M10,10 L22.5,22.5 L35,10",'T':"M35,10 L22.5,22.5 L35,35",'U':"M10,35 L22.5,22.5 L35,35",'V':"M10,10 L22.5,22.5 L10,35",'W':["M10,10 L22.5,22.5 L35,10",true,{x:22.5,y:15}],'X':["M35,10 L22.5,22.5 L35,35",true,{x:30,y:22.5}],'Y':["M10,35 L22.5,22.5 L35,35",true,{x:22.5,y:30}],'Z':["M10,10 L22.5,22.5 L10,35",true,{x:15,y:22.5}]};
    let data = maps[c.toUpperCase()]; if(!data) return `<span>${c}</span>`;
    let path = Array.isArray(data)?data[0]:data, dot=Array.isArray(data)&&data[1], dp=(Array.isArray(data)&&data[2])||{x:22.5,y:22.5};
    return `<svg width="40" height="40" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${dp.x}" cy="${dp.y}" r="${dot?3:0}" fill="${color}"/></svg>`;
}
