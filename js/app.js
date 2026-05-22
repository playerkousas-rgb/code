// ===================== DATA =====================
const MORSE_CODE = {'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',' ':'/'};
const SEMAPHORE_MAP = {'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png','I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png','Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png','Y':'y.png','Z':'z.png'};
const semaphoreAngles = {'A':[180,225],'B':[180,270],'C':[180,315],'D':[180,0],'E':[0,45],'F':[0,90],'G':[0,135],'H':[225,270],'I':[225,315],'J':[90,0],'K':[225,0],'L':[225,45],'M':[225,90],'N':[225,135],'O':[270,315],'P':[270,0],'Q':[270,45],'R':[270,90],'S':[270,135],'T':[315,0],'U':[315,45],'V':[0,90],'W':[45,90],'X':[45,135],'Y':[315,90],'Z':[135,90]};
const BRAILLE_MAP = {'A':[1],'B':[1,2],'C':[1,4],'D':[1,4,5],'E':[1,5],'F':[1,2,4],'G':[1,2,4,5],'H':[1,2,5],'I':[2,4],'J':[2,4,5],'K':[1,3],'L':[1,2,3],'M':[1,3,4],'N':[1,3,4,5],'O':[1,3,5],'P':[1,2,3,4],'Q':[1,2,3,4,5],'R':[1,2,3,5],'S':[2,3,4],'T':[2,3,4,5],'U':[1,3,6],'V':[1,2,3,6],'W':[2,4,5,6],'X':[1,3,4,6],'Y':[1,3,4,5,6],'Z':[1,3,5,6]};
const CANGJIE_MAP = {'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈','J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口','S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'};
const NATO_MAP = {'A':'Alpha','B':'Bravo','C':'Charlie','D':'Delta','E':'Echo','F':'Foxtrot','G':'Golf','H':'Hotel','I':'India','J':'Juliett','K':'Kilo','L':'Lima','M':'Mike','N':'November','O':'Oscar','P':'Papa','Q':'Quebec','R':'Romeo','S':'Sierra','T':'Tango','U':'Uniform','V':'Victor','W':'Whiskey','X':'X-ray','Y':'Yankee','Z':'Zulu'};
const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
const PHONE_LOOKUP = {};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });

// ===================== STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0;
let carouselTimer = null;
let peer = null, hostConn = null, connections = [], players = {}, buzzQueue = [], gameMode = 'idle';

const $ = (id) => document.getElementById(id);
const showToast = (msg) => { const t = $('toast'); if(t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2000); } };

// ===================== RENDERERS =====================
function renderBrailleChar(c) {
    const dots = BRAILLE_MAP[c.toUpperCase()] || [];
    let h = '<div class="braille-char">';
    for(let i=1; i<=6; i++) h += `<div class="braille-dot ${dots.includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function renderStickFigure(c, color = "black", size = 80) {
    const angles = semaphoreAngles[c.toUpperCase()];
    if(!angles) return `<div class="font-bold flex items-center justify-center" style="width:${size}px; height:${size}px; font-size: ${size/2}px">${c}</div>`;
    const cx = 50, cy = 50;
    let h = `<svg width="${size}" height="${size*1.2}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">`;
    h += `<circle cx="50" cy="25" r="10" fill="none" stroke="${color}" stroke-width="3"/>`;
    h += `<line x1="50" y1="35" x2="50" y2="75" stroke="${color}" stroke-width="3"/>`;
    h += `<line x1="50" y1="75" x2="35" y2="105" stroke="${color}" stroke-width="3"/>`;
    h += `<line x1="50" y1="75" x2="65" y2="105" stroke="${color}" stroke-width="3"/>`;
    angles.forEach((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        const x2 = 50 + Math.cos(rad) * 45;
        const y2 = 45 + Math.sin(rad) * 45;
        const stroke = (color === "black") ? "black" : (i === 0 ? "#ffcc00" : "#00d2ff");
        h += `<line x1="50" y1="45" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`;
    });
    return h + `</svg>`;
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

// ===================== CORE ENCODER =====================
function getEncoded(text, type, key = 'SCOUT', shift = 3) {
    const upper = text.toUpperCase();
    const alpha = "ABCDEFGHIKLMNOPQRSTUVWXY";
    switch(type) {
        case 'Morse': return upper.split('').map(c => MORSE_CODE[c] || c).join(' ');
        case 'Grid': return upper.split('').map(c => {
            if(c===' ') return '/'; if(c==='Z') return 'Z';
            let idx = alpha.indexOf(c); return idx===-1 ? c : key[idx % 5] + key[Math.floor(idx / 5)];
        }).join(' ');
        case 'Phone': return upper.split('').map(c => {
            if(c === ' ') return '/';
            const info = PHONE_LOOKUP[c];
            return info ? `${info.key}${info.presses}` : c;
        }).join(' '); // 字母間空格
        case 'Caesar': return upper.replace(/[A-Z]/g, c => String.fromCharCode(65 + (c.charCodeAt(0) - 65 + shift) % 26));
        case 'Atbash': return upper.replace(/[A-Z]/g, c => String.fromCharCode(90 - (c.charCodeAt(0) - 65)));
        case 'Reverse': return text.split('').reverse().join('').toUpperCase();
        case 'NATO': return upper.split('').map(c => NATO_MAP[c] || c).join(' ');
        case 'Cangjie': return upper.split('').map(c => c===' '?'/':(CANGJIE_MAP[c] || c)).join(' ');
        default: return upper;
    }
}

function updateAll() {
    const text = $('inputText').value;
    const upper = text.toUpperCase();
    const key = ($('gridKey').value || 'SCOUT').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);
    const shift = parseInt($('caesarShift').value) || 3;

    if($('outMorse')) $('outMorse').textContent = getEncoded(text, 'Morse');
    if($('outSemaphore')) $('outSemaphore').innerHTML = upper.split('').map(c => c === ' ' ? '<span class="w-8"></span>' : renderStickFigure(c, "#ffcc00", 60)).join('');
    if($('outBraille')) $('outBraille').innerHTML = upper.split('').map(c => c===' '?'<span class="w-8"></span>':renderBrailleChar(c)).join('');
    if($('outPigpen')) $('outPigpen').innerHTML = upper.split('').map(c => c===' '?'<span class="mx-4 text-amber-500 font-bold">/</span>':renderPigpenSVG(c)).join('');
    if($('outGrid')) $('outGrid').textContent = getEncoded(text, 'Grid', key);
    if($('outPhone')) $('outPhone').textContent = getEncoded(text, 'Phone');
    if($('outCaesar')) $('outCaesar').textContent = getEncoded(text, 'Caesar', '', shift);
    if($('outAtbash')) $('outAtbash').textContent = getEncoded(text, 'Atbash');
    if($('outReverse')) $('outReverse').textContent = getEncoded(text, 'Reverse');
    if($('outNato')) $('outNato').textContent = getEncoded(text, 'NATO');
    if($('outCangjie')) $('outCangjie').textContent = getEncoded(text, 'Cangjie');
    if($('outPinyin')) $('outPinyin').textContent = upper.split('').map(c => PINYIN_MAP[c] || c).join(' ');
    if($('outJyutping')) $('outJyutping').textContent = upper.split('').map(c => JYUTPING_MAP[c] || c).join(' ');
}

// ===================== PROJECTION =====================
function showProjection() {
    const q = testQuestions[currentProjIdx];
    const overlay = $('projectionOverlay');
    overlay.style.display = 'flex';
    $('projCounter').textContent = `${currentProjIdx + 1} / ${testQuestions.length}`;
    clearInterval(carouselTimer);

    const isCarousel = (q.type === 'Morse' || q.type === 'Semaphore') && q.display === 'carousel';
    $('btnProjPlay').style.display = isCarousel ? 'block' : 'none';
    renderProjContent(q);
}

function renderProjContent(q) {
    const content = $('projectionContent');
    const upper = q.text.toUpperCase();
    let html = '';
    
    if (q.display === 'static' || (q.type !== 'Morse' && q.type !== 'Semaphore')) {
        if(q.type==='Morse') html = `<div class="text-[7vw] font-mono tracking-widest text-[var(--skw-gold)]">${getEncoded(q.text, 'Morse')}</div>`;
        else if(q.type==='Semaphore') html = `<div class="flex flex-wrap justify-center gap-6">${upper.split('').map(c=>c===' '?'<div class="w-20"></div>':renderStickFigure(c, "white", 100)).join('')}</div>`;
        else if(q.type==='Braille') html = `<div class="flex flex-wrap justify-center gap-10 scale-[2]">${upper.split('').map(c=>c===' '?'<div class="w-10"></div>':renderBrailleChar(c)).join('')}</div>`;
        else if(q.type==='Pigpen') html = `<div class="flex flex-wrap justify-center gap-10 scale-[3]">${upper.split('').map(c=>c===' '?'<div class="w-10"></div>':renderPigpenSVG(c)).join('')}</div>`;
        else html = `<div class="text-[8vw] font-black text-[var(--skw-gold)]">${getEncoded(q.text, q.type)}</div>`;
        content.innerHTML = `<div class="text-center w-full px-10 animate-in">${html}</div>`;
    } else {
        // Carousel Initial State
        content.innerHTML = `<div class="text-[var(--skw-gold)] text-3xl font-black">準備播放...</div>`;
    }
}

$('btnProjPlay').onclick = () => {
    const q = testQuestions[currentProjIdx];
    const text = q.text.toUpperCase();
    const speed = parseInt($('projSpeed').value);
    const content = $('projectionContent');
    let idx = 0;
    
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
        if(idx >= text.length) { clearInterval(carouselTimer); return; }
        const c = text[idx];
        let h = '';
        if(q.type === 'Morse') h = `<div class="text-[20vw] font-mono text-[var(--skw-gold)]">${MORSE_CODE[c] || c}</div>`;
        else h = renderStickFigure(c, "white", 400);
        content.innerHTML = `<div class="animate-in flex flex-col items-center">
            ${h}
            <div class="mt-10 text-white/20 text-xl font-bold">字母 ${idx+1} / ${text.length}</div>
        </div>`;
        idx++;
    }, speed);
};

// ===================== LIST & STORAGE =====================
function renderTestQuestionList() {
    const list = $('testQuestionList');
    if(testQuestions.length === 0) return list.innerHTML = '<p class="text-center text-slate-500 italic py-10">清單為空</p>';
    
    const typeLabels = {"Morse":"摩斯","Semaphore":"旗號","Braille":"點字","Pigpen":"朱高","Grid":"座標","Phone":"電話","Caesar":"凱撒","Atbash":"反射","Reverse":"倒序","NATO":"NATO","Cangjie":"倉頡","Pinyin":"拼音","Jyutping":"粵拼"};
    
    list.innerHTML = testQuestions.map((q,idx)=>`
        <div class="skw-card p-4 flex flex-col md:flex-row justify-between items-center mb-0 gap-4">
            <div class="flex items-center gap-4">
                <span class="font-black text-[var(--skw-gold)]">Q${idx+1}</span>
                <span class="text-white font-bold">${q.text}</span>
                <select onchange="testQuestions[${idx}].type=this.value; updateStorage(); renderTestQuestionList();" class="bg-black/60 text-white text-xs border border-white/20 rounded px-2 py-1">
                    ${Object.entries(typeLabels).map(([v,l])=>`<option value="${v}" ${q.type===v?'selected':''}>${l}</option>`).join('')}
                </select>
                ${(q.type==='Morse'||q.type==='Semaphore') ? `
                <select onchange="testQuestions[${idx}].display=this.value; updateStorage();" class="bg-sky-900/40 text-sky-200 text-xs border border-sky-900 rounded px-2 py-1">
                    <option value="static" ${q.display==='static'?'selected':''}>整條形式</option>
                    <option value="carousel" ${q.display==='carousel'?'selected':''}>輪播形式</option>
                </select>` : ''}
            </div>
            <button onclick="testQuestions.splice(${idx},1); updateStorage(); renderTestQuestionList();" class="text-red-400 text-xs font-bold">刪除</button>
        </div>`).join('');
}

function updateStorage() { localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions)); }

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const mode = this.dataset.mode;
            $('editorView').style.display = mode === 'editor' ? 'block' : 'none';
            $('testPaperView').style.display = mode === 'testpaper' ? 'block' : 'none';
            $('gameView').style.display = mode === 'game' ? 'block' : 'none';
            if(mode === 'testpaper') renderTestQuestionList();
        };
    });

    $('mobileMenuBtn').onclick = () => $('sidebar').classList.toggle('open');
    $('inputText').oninput = updateAll;
    $('gridKey').oninput = updateAll;
    $('caesarShift').oninput = updateAll;
    $('projSpeed').oninput = function() { $('projSpeedVal').textContent = (this.value/1000).toFixed(1) + 's'; };
    
    $('btnAddToTest').onclick = () => {
        const text = $('inputText').value.trim();
        if(!text) return;
        testQuestions.push({ id: Date.now(), text, type: 'Morse', display: 'static' });
        updateStorage();
        showToast('已加入試卷');
    };

    $('btnExportPDF').onclick = () => {
        const style = $('semPrintStyle').value;
        $('printQuestions').innerHTML = testQuestions.map((q, idx) => {
            const encoded = (q.type==='Semaphore' && style==='stick') ? `<div class="flex flex-wrap gap-4">${q.text.toUpperCase().split('').map(c=>renderStickFigure(c, "black", 50)).join('')}</div>` : getEncoded(q.text, q.type);
            // More print logic here... (omitted for brevity, follows pattern)
            return `<div class="mb-10 p-4 border-2 border-black rounded">Q${idx+1}. (${q.type})<br>${encoded}</div>`;
        }).join('');
        window.print();
    };

    $('btnExitProjection').onclick = () => { $('projectionOverlay').style.display='none'; clearInterval(carouselTimer); };
    $('btnProjNext').onclick = () => { if(currentProjIdx < testQuestions.length-1) { currentProjIdx++; showProjection(); } };
    $('btnProjPrev').onclick = () => { if(currentProjIdx > 0) { currentProjIdx--; showProjection(); } };

    updateAll();
});
