// ===================== DATA =====================
const MORSE_CODE = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---',
  'K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-',
  'U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
  '1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',
  ' ':'/'
};

const SEMAPHORE_MAP = {
  'A':'a.png','B':'b.png','C':'c.png','D':'d.png','E':'e.png','F':'f.png','G':'g.png','H':'h.png',
  'I':'i.png','J':'j.png','K':'k.png','L':'l.png','M':'m.png','N':'n.png','O':'o.png','P':'p.png',
  'Q':'q.png','R':'r.png','S':'s.png','T':'t.png','U':'u.png','V':'v.png','W':'w.png','X':'x.png',
  'Y':'y.png','Z':'z.png',
  '!':'error.png','@':'endof.png','#':'answering.png','$':'attention.png','%':'numbers.png'
};

const semaphoreAngles = { 
    'A': [180, 225], 'B': [180, 270], 'C': [180, 315], 'D': [180, 0], 
    'E': [0, 45], 'F': [0, 90], 'G': [0, 135], 'H': [225, 270], 
    'I': [225, 315], 'J': [90, 0], 'K': [225, 0], 'L': [225, 45], 
    'M': [225, 90], 'N': [225, 135], 'O': [270, 315], 'P': [270, 0], 
    'Q': [270, 45], 'R': [270, 90], 'S': [270, 135], 'T': [315, 0], 
    'U': [315, 45], 'V': [0, 90], 'W': [45, 90], 'X': [45, 135], 
    'Y': [315, 90], 'Z': [135, 90],
    '!': [225, 225], // Error (雙手斜下)
    '@': [0, 0],     // End (雙手平伸) - 依需求調整角度
    '#': [135, 225], // Answering
    '$': [90, 90],   // Attention
    '%': [45, 135]   // Numbers
};
// Phone keypad: key -> [letters]
const PHONE_GROUPS = {
  '2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],
  '6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']
};

// Build reverse lookup: letter -> {key, presses}
const PHONE_LOOKUP = {};
for(const [key, letters] of Object.entries(PHONE_GROUPS)){
  letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });
}

const CANGJIE_MAP = {
  'A':'日','B':'月','C':'金','D':'木','E':'水','F':'火','G':'土','H':'竹','I':'戈',
  'J':'十','K':'大','L':'中','M':'一','N':'弓','O':'人','P':'心','Q':'手','R':'口',
  'S':'屍','T':'廿','U':'山','V':'女','W':'田','X':'難','Y':'卜','Z':'重'
};

const QUICK_MAP = {...CANGJIE_MAP};

const JYUTPING_MAP = {
  'A':'ei1','B':'bi1','C':'si1','D':'di1','E':'i1','F':'ef1','G':'ji1','H':'eich1','I':'ai1',
  'J':'jei1','K':'kei1','L':'el1','M':'em1','N':'en1','O':'ou1','P':'pi1','Q':'kiu1','R':'aa1',
  'S':'es1','T':'ti1','U':'ju1','V':'wi1','W':'dël-bü-liu-ju1','X':'ik-si1','Y':'wai1','Z':'zet1'
};

const PINYIN_MAP = {
  'A':'ēi','B':'bì','C':'sēi','D':'dì','E':'yì','F':'ài-fū','G':'jì','H':'ēi-chǔ','I':'ài',
  'J':'jiè','K':'kèi','L':'ài-ōu','M':'ài-mǔ','N':'ēn','O':'ōu','P':'pī','Q':'kiŭ',
  'R':'á','S':'ài-sǐ','T':'tì','U':'yōu','V':'wēi','W':'dá-bù-liù-yōu','X':'ài-kè-sī','Y':'wài','Z':'zèi'
};

const NATO_MAP = {
  'A':'Alpha','B':'Bravo','C':'Charlie','D':'Delta','E':'Echo','F':'Foxtrot','G':'Golf','H':'Hotel',
  'I':'India','J':'Juliett','K':'Kilo','L':'Lima','M':'Mike','N':'November','O':'Oscar','P':'Papa',
  'Q':'Quebec','R':'Romeo','S':'Sierra','T':'Tango','U':'Uniform','V':'Victor','W':'Whiskey','X':'X-ray',
  'Y':'Yankee','Z':'Zulu'
};

// Keyboard layout for Cangjie/Quick
const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

// ===================== HELPERS =====================
function $(id){ return document.getElementById(id); }

function showToast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}

function copyText(text){
  if(!text) return;
  navigator.clipboard.writeText(text).then(()=>showToast('已複製到剪貼簿'));
}

// ===================== EVENT BINDING =====================
document.addEventListener('DOMContentLoaded', function(){

  $('inputText').addEventListener('input', updateAll);
  $('gridKey').addEventListener('input', updateAll);
  $('caesarShift').addEventListener('input', updateAll);
  $('morseSpeed').addEventListener('input', function(){
    $('morseSpeedVal').textContent = this.value;
  });
  document.querySelectorAll('input[name="caesarDir"]').forEach(el=>{
    el.addEventListener('change', updateAll);
  });

  $('btnDemo').addEventListener('click', function(){
    $('inputText').value = 'I GO TO SCHOOL';
    updateAll();
  });
  $('btnClear').addEventListener('click', function(){
    $('inputText').value = '';
    updateAll();
  });
  $('btnCopyInput').addEventListener('click', function(){
    copyText($('inputText').value);
  });

  document.querySelectorAll('.btn-flag').forEach(btn=>{
    btn.addEventListener('click', function(){
      const ta = $('inputText');
      const ch = this.dataset.char;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.slice(0,start) + ch + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + 1;
      ta.focus();
      updateAll();
    });
  });

  document.querySelectorAll('.btn-fs').forEach(btn=>{
    btn.addEventListener('click', function(){
      const cardId = this.dataset.card;
      const card = $(cardId);
      if(!document.fullscreenElement){
        card.requestFullscreen?.() || card.webkitRequestFullscreen?.() || card.msRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.();
      }
    });
  });

  document.querySelectorAll('.btn-ref').forEach(btn=>{
    btn.addEventListener('click', function(){
      const refId = this.dataset.ref;
      const el = $(refId);
      el.classList.toggle('hidden-ref');
      this.textContent = el.classList.contains('hidden-ref') ? '👁 顯示對照表' : '👁 隱藏對照表';
    });
  });

  document.querySelectorAll('.btn-copy-out').forEach(btn=>{
    btn.addEventListener('click', function(){
      const outId = this.dataset.out;
      const el = $(outId);
      let text = el.textContent || el.innerText || '';
      if(!text.trim() || text.includes('輸入文字')) return;
      copyText(text.trim());
    });
  });

  $('btnPlayMorse').addEventListener('click', playMorse);
  $('btnShiftMinus').addEventListener('click', ()=>adjustShift(-1));
  $('btnShiftPlus').addEventListener('click', ()=>adjustShift(1));
  $('btnDlPigpen').addEventListener('click', downloadPigpenSVG);
  $('btnDlSemaphore').addEventListener('click', downloadSemaphoreSVG);
  $('btnDlSemGif').addEventListener('click', downloadSemaphoreGIF);
  $('btnPlaySemaphore').addEventListener('click', playSemaphoreAnim);
  $('btnPlayNato').addEventListener('click', playNatoAudio);

  updateAll();
});

function adjustShift(delta){
  const el = $('caesarShift');
  let v = parseInt(el.value||0) + delta;
  if(v<1) v=25; if(v>25) v=1;
  el.value = v;
  updateAll();
}

// ===================== GRID CIPHER (座標式密碼) =====================
function buildGridTable(){
  // 1. 取得金鑰，邏輯保持原樣
  const key = ($('gridKey').value || 'SCOUT').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);
  
  // 2. 建立 25 個字母的內容 (排除 Z)
  const alphabet = [];
  for(let i=65; i<=90; i++){
    const c = String.fromCharCode(i);
    if(c !== 'Z') alphabet.push(c);
  }

  // 3. 繪製表格 UI
  const tbl = $('gridTable');
  let html = '<tr><th></th>';
  for(let i=0; i<5; i++) html += '<th>' + key[i] + '</th>';
  html += '</tr>';

  for(let row=0; row<5; row++){
    html += '<tr><th>' + key[row] + '</th>';
    for(let col=0; col<5; col++){
      const c = alphabet[row*5 + col];
      html += '<td data-ch="'+c+'">' + c + '</td>';
    }
    html += '</tr>';
  }
  tbl.innerHTML = html;

  // 保持回傳原有的變數名稱，確保 updateAll 接收正常
  return {alphabet, key};
}

function encodeGrid(text, alphabet, key){
  let out = '';
  const t = text.toUpperCase();
  for(const ch of t){
    if (ch === ' ') { out += '/ '; continue; }
    if(ch === 'Z') { out += 'Z '; continue; } // 依照要求 Z 輸出為 Z

    const idx = alphabet.indexOf(ch);
    if(idx >= 0){
      // 核心修改：計算行號與列號
      const rowIdx = Math.floor(idx / 5);
      const colIdx = idx % 5;
      
      // 核心修改：[列標][行標]
      // 例如 B 的 idx 為 1 -> rowIdx = 0, colIdx = 1
      // 輸出 key[1] + key[0] -> C + S -> CS
      out += key[colIdx] + key[rowIdx] + ' ';
    } else {
      out += ch + ' ';
    }
  }
  return out.trim();
}
// ===================== MORSE =====================
function buildMorseTable(){
  const tbl = $('morseTable');
  const rows = [
    ['A','B','C','D','E','F'],['G','H','I','J','K','L'],
    ['M','N','O','P','Q','R'],['S','T','U','V','W','X'],['Y','Z','0','1','2','3'],['4','5','6','7','8','9']
  ];
  let html = '';
  for(const row of rows){
    html += '<tr>';
    for(const c of row){
      const code = MORSE_CODE[c]||'';
      html += '<td data-ch="'+c+'"><b>'+c+'</b><br>'+code+'</td>';
    }
    html += '</tr>';
  }
  tbl.innerHTML = html;
}

function encodeMorse(text){
  return text.toUpperCase().split('').map(c=>MORSE_CODE[c]||c).join(' ');
}

let morseAudioCtx = null;
let morsePlaying = false;
function playMorse(){
  const text = $('inputText').value.toUpperCase();
  if(!text || morsePlaying) return;
  morsePlaying = true;
  $('playText').textContent = '播放中...';
  $('playIcon').textContent = '⏸';

  const wpm = parseInt($('morseSpeed').value);
  const dot = 1.2 / wpm; // seconds per dot at given WPM

  if(!morseAudioCtx) morseAudioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const ctx = morseAudioCtx;
  
  // 僅調整間隔係數，結構完全不變
  const dash = dot*3, gap = dot, letterGap = dot*5, wordGap = dot*12;

  let t = ctx.currentTime + 0.1;
  for(const c of text){
    const code = MORSE_CODE[c];
    if(code){
      for(const sym of code){
        const dur = sym==='.'?dot:dash;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 700;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        gain.gain.setValueAtTime(0.15, t);
        // 增加此行以確保聲音不黏連，不影響時間軸
        gain.gain.exponentialRampToValueAtTime(0.001, t+dur-0.01);
        osc.stop(t+dur);
        t += dur + gap;
      }
      t += letterGap - gap;
    } else if(c===' '){
      t += wordGap - letterGap;
    }
  }
  setTimeout(()=>{
    morsePlaying = false;
    $('playText').textContent = '發送音訊';
    $('playIcon').textContent = '▶';
  }, (t - ctx.currentTime)*1000);
}

// ===================== CAESAR =====================
function buildCaesarTable(){
  const shift = parseInt($('caesarShift').value)||3;
  const dir = document.querySelector('input[name="caesarDir"]:checked').value;
  const s = dir==='forward'?shift:(26-shift);
  const tbl = $('caesarTable');
  let html = '<tr><th>原文</th>';
  for(let i=65;i<=90;i++) html += '<th>'+String.fromCharCode(i)+'</th>';
  html += '</tr><tr><th>密文</th>';
  for(let i=65;i<=90;i++){
    const enc = String.fromCharCode(65 + ((i-65+s)%26));
    html += '<td data-ch="'+String.fromCharCode(i)+'">'+enc+'</td>';
  }
  html += '</tr>';
  tbl.innerHTML = html;
}

function encodeCaesar(text){
  const shift = parseInt($('caesarShift').value)||3;
  const dir = document.querySelector('input[name="caesarDir"]:checked').value;
  const s = dir==='forward'?shift:(26-shift);
  return text.toUpperCase().split('').map(c=>{
    if(c>='A'&&c<='Z') return String.fromCharCode(65+((c.charCodeAt(0)-65+s)%26));
    return c;
  }).join('');
}

// ===================== PHONE KEYPAD =====================
function buildPhoneTable(){
  const wrap = $('phoneTableWrap');
  let html = '<div class="phone-grid">';
  const layout = [
    {k:'1',l:''},{k:'2',l:'ABC'},{k:'3',l:'DEF'},
    {k:'4',l:'GHI'},{k:'5',l:'JKL'},{k:'6',l:'MNO'},
    {k:'7',l:'PQRS'},{k:'8',l:'TUV'},{k:'9',l:'WXYZ'},
    {k:'*',l:''},{k:'0',l:'空格'},{k:'#',l:''}
  ];
  for(const item of layout){
    html += '<div class="phone-key'+(item.l?'':' phone-key-empty')+'">';
    html += '<div class="phone-key-num">'+item.k+'</div>';
    if(item.l) html += '<div class="phone-key-letters">'+item.l+'</div>';
    html += '</div>';
  }
  html += '</div>';
  wrap.innerHTML = html;
}

function encodePhone(text){
  return text.toUpperCase().split('').map(c=>{
    if(c===' ') return '0';
    const info = PHONE_LOOKUP[c];
    if(info) return info.key + info.presses;
    return c;
  }).join(' ');
}

// ===================== REVERSE =====================
function encodeReverse(text){
  return text.split('').reverse().join('');
}

// ===================== ATBASH =====================
function buildAtbashTable(){
  const tbl = $('atbashTable');
  let html = '<tr><th>原文</th>';
  for(let i=65;i<=90;i++) html += '<th>'+String.fromCharCode(i)+'</th>';
  html += '</tr><tr><th>密文</th>';
  for(let i=65;i<=90;i++){
    const enc = String.fromCharCode(90 - (i-65));
    html += '<td data-ch="'+String.fromCharCode(i)+'">'+enc+'</td>';
  }
  html += '</tr>';
  tbl.innerHTML = html;
}

function encodeAtbash(text){
  return text.toUpperCase().split('').map(c=>{
    if(c>='A'&&c<='Z') return String.fromCharCode(90 - (c.charCodeAt(0)-65));
    return c;
  }).join('');
}

// ===================== PIGPEN =====================
function drawPigpenSVG(char){
  const c = char.toUpperCase();
  if(!/^[A-Z]$/.test(c)) return '<span style="font-size:28px;font-weight:800;color:var(--skw-gold)">'+c+'</span>';
  let path="", dot=false, dotPos={x:22.5,y:22.5};
  const stroke="#ffcc00";
  switch(c){
    case 'A':path="M35,10 L35,35 L10,35";break;
    case 'B':path="M10,10 L10,35 L35,35 L35,10";break;
    case 'C':path="M10,10 L10,35 L35,35";break;
    case 'D':path="M10,10 L35,10 L35,35 L10,35";break;
    case 'E':path="M10,10 L35,10 L35,35 L10,35 Z";break;
    case 'F':path="M35,10 L10,10 L10,35 L35,35";break;
    case 'G':path="M35,35 L35,10 L10,10";break;
    case 'H':path="M10,35 L10,10 L35,10 L35,35";break;
    case 'I':path="M10,35 L10,10 L35,10";break;
    case 'J':path="M35,10 L35,35 L10,35";dot=true;break;
    case 'K':path="M10,10 L10,35 L35,35 L35,10";dot=true;break;
    case 'L':path="M10,10 L10,35 L35,35";dot=true;break;
    case 'M':path="M10,10 L35,10 L35,35 L10,35";dot=true;break;
    case 'N':path="M10,10 L35,10 L35,35 L10,35 Z";dot=true;break;
    case 'O':path="M35,10 L10,10 L10,35 L35,35";dot=true;break;
    case 'P':path="M35,35 L35,10 L10,10";dot=true;break;
    case 'Q':path="M10,35 L10,10 L35,10 L35,35";dot=true;break;
    case 'R':path="M10,35 L10,10 L35,10";dot=true;break;
    case 'S':path="M10,10 L22.5,22.5 L35,10";break;
    case 'T':path="M35,10 L22.5,22.5 L35,35";break;
    case 'U':path="M10,35 L22.5,22.5 L35,35";break;
    case 'V':path="M10,10 L22.5,22.5 L10,35";break;
    case 'W':path="M10,10 L22.5,22.5 L35,10";dot=true;dotPos={x:22.5,y:15};break;
    case 'X':path="M35,10 L22.5,22.5 L35,35";dot=true;dotPos={x:30,y:22.5};break;
    case 'Y':path="M10,35 L22.5,22.5 L35,35";dot=true;dotPos={x:22.5,y:30};break;
    case 'Z':path="M10,10 L22.5,22.5 L10,35";dot=true;dotPos={x:15,y:22.5};break;
  }
  return `<svg class="pigpen-svg" width="45" height="45" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${dot?`<circle cx="${dotPos.x}" cy="${dotPos.y}" r="2.5" fill="${stroke}"/>`:''}
  </svg>`;
}

function buildPigpenGrid() {
  const container = $('pigpenGrid');
  if (!container) return;

  const grids = [
    { name: "Grid 1", chars: ["A","B","C","D","E","F","G","H","I"], hasDot: false, type: "tic-tac-toe" },
    { name: "Grid 2", chars: ["J","K","L","M","N","O","P","Q","R"], hasDot: true,  type: "tic-tac-toe" },
    { name: "X 1",     chars: ["S","T","U","V"],                 hasDot: false, type: "x-shape" },
    { name: "X 2",     chars: ["W","X","Y","Z"],                 hasDot: true,  type: "x-shape" }
  ];

  let html = '<div class="flex flex-wrap gap-8 justify-center p-6 bg-black/10 rounded-2xl">';

  grids.forEach(g => {
    html += '<div class="flex flex-col items-center gap-4">';
    
    if (g.type === "tic-tac-toe") {
      // --- 井字格 (保持原本完美的寫法) ---
      html += '<div class="grid grid-cols-3 w-[150px] h-[150px]">';
      g.chars.forEach((c, idx) => {
        let borderStyle = "border-slate-500 ";
        if (idx < 6) borderStyle += "border-b-2 ";
        if (idx % 3 !== 2) borderStyle += "border-r-2 ";
        html += '<div class="relative flex items-center justify-center ' + borderStyle + ' w-[50px] h-[50px] text-amber-500 font-bold text-xl">';
        html += c;
        if (g.hasDot) html += '<span class="absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>';
        html += '</div>';
      });
      html += '</div>';
    } else {
      // --- X 叉字格 (改用 SVG 繪製背景線，確保絕對精準) ---
      html += '<div class="relative w-[150px] h-[150px]">';
      // SVG 畫交叉線
      html += '<svg class="absolute inset-0 w-full h-full" style="pointer-events: none;">';
      html += '<line x1="0" y1="0" x2="150" y2="150" stroke="#64748b" stroke-width="2" />';
      html += '<line x1="150" y1="0" x2="0" y2="150" stroke="#64748b" stroke-width="2" />';
      html += '</svg>';
      
      // 字母位置計算 (調整過後的坐標)
      const pos = [
        "top-2 left-1/2 -translate-x-1/2",    // 上 (S/W)
        "left-4 top-1/2 -translate-y-1/2",    // 左 (T/X)
        "right-4 top-1/2 -translate-y-1/2",   // 右 (U/Y)
        "bottom-2 left-1/2 -translate-x-1/2"  // 下 (V/Z)
      ];
      g.chars.forEach((c, idx) => {
        html += '<div class="absolute ' + pos[idx] + ' text-amber-500 font-bold text-xl flex flex-col items-center z-10">';
        html += c;
        if (g.hasDot) html += '<span class="w-1.5 h-1.5 bg-amber-500 rounded-full mt-0.5"></span>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    html += '<span class="text-[10px] font-bold text-slate-600 uppercase tracking-widest">' + g.name + '</span>';
    html += '</div>';
  });

  html += '</div>';
  container.innerHTML = html;
}
function encodePigpen(text){
  return text.toUpperCase().split('').map(c=>{
    if(/^[A-Z]$/.test(c)) return drawPigpenSVG(c);
    // 修改這裡：讓空白變成一個有間距的斜線
    if(c===' ') return '<span class="text-amber-500 font-bold mx-4" style="font-size:30px">/</span>';
    return '<span style="color:var(--skw-gold);font-weight:800;font-size:24px">'+c+'</span>';
  }).join('');
}

function downloadPigpenSVG(){
  const text = $('inputText').value.toUpperCase();
  if(!text) return;
  let svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" style="background:#001a33">';
  let x = 20;
  for(const c of text){
    if(x > 1100) break;
    if(c===' ') { x+=40; continue; }
    if(/^[A-Z]$/.test(c)){
      let path="", dot=false, dotPos={x:22.5,y:22.5};
      const stroke="#ffcc00";
      switch(c){
        case 'A':path="M35,10 L35,35 L10,35";break;
        case 'B':path="M10,10 L10,35 L35,35 L35,10";break;
        case 'C':path="M10,10 L10,35 L35,35";break;
        case 'D':path="M10,10 L35,10 L35,35 L10,35";break;
        case 'E':path="M10,10 L35,10 L35,35 L10,35 Z";break;
        case 'F':path="M35,10 L10,10 L10,35 L35,35";break;
        case 'G':path="M35,35 L35,10 L10,10";break;
        case 'H':path="M10,35 L10,10 L35,10 L35,35";break;
        case 'I':path="M10,35 L10,10 L35,10";break;
        case 'J':path="M35,10 L35,35 L10,35";dot=true;break;
        case 'K':path="M10,10 L10,35 L35,35 L35,10";dot=true;break;
        case 'L':path="M10,10 L10,35 L35,35";dot=true;break;
        case 'M':path="M10,10 L35,10 L35,35 L10,35";dot=true;break;
        case 'N':path="M10,10 L35,10 L35,35 L10,35 Z";dot=true;break;
        case 'O':path="M35,10 L10,10 L10,35 L35,35";dot=true;break;
        case 'P':path="M35,35 L35,10 L10,10";dot=true;break;
        case 'Q':path="M10,35 L10,10 L35,10 L35,35";dot=true;break;
        case 'R':path="M10,35 L10,10 L35,10";dot=true;break;
        case 'S':path="M10,10 L22.5,22.5 L35,10";break;
        case 'T':path="M35,10 L22.5,22.5 L35,35";break;
        case 'U':path="M10,35 L22.5,22.5 L35,35";break;
        case 'V':path="M10,10 L22.5,22.5 L10,35";break;
        case 'W':path="M10,10 L22.5,22.5 L35,10";dot=true;dotPos={x:22.5,y:15};break;
        case 'X':path="M35,10 L22.5,22.5 L35,35";dot=true;dotPos={x:30,y:22.5};break;
        case 'Y':path="M10,35 L22.5,22.5 L35,35";dot=true;dotPos={x:22.5,y:30};break;
        case 'Z':path="M10,10 L22.5,22.5 L10,35";dot=true;dotPos={x:15,y:22.5};break;
      }
      svgContent += '<g transform="translate('+x+',75)">';
      svgContent += '<path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
      if(dot) svgContent += '<circle cx="'+dotPos.x+'" cy="'+dotPos.y+'" r="2.5" fill="'+stroke+'"/>';
      svgContent += '<text x="22.5" y="55" text-anchor="middle" fill="#64748b" font-size="12" font-family="sans-serif">'+c+'</text>';
      svgContent += '</g>';
      x += 55;
    } else {
      svgContent += '<text x="'+x+'" y="110" fill="#ffcc00" font-size="32" font-weight="bold">'+c+'</text>';
      x += 40;
    }
  }
  svgContent += '</svg>';
  downloadFile('pigpen.svg', svgContent, 'image/svg+xml');
}

// ===================== SEMAPHORE =====================
function getSemaphoreSVGPath(angles, centerX, centerY) {
    // 1. 白色火柴人主體
    let html = `
        <circle cx="${centerX}" cy="${centerY - 20}" r="6" fill="none" stroke="white" stroke-width="2"/>
        <line x1="${centerX}" y1="${centerY - 14}" x2="${centerX}" y2="${centerY + 5}" stroke="white" stroke-width="2"/>
        <line x1="${centerX}" y1="${centerY + 5}" x2="${centerX - 8}" y2="${centerY + 18}" stroke="white" stroke-width="2"/>
        <line x1="${centerX}" y1="${centerY + 5}" x2="${centerX + 8}" y2="${centerY + 18}" stroke="white" stroke-width="2"/>
    `;

    // 2. 畫雙手 (右手黃色，左手藍色)
    // 根據你的 semaphoreAngles 定義：第一個角度通常是右手，第二個是左手
    angles.forEach((angle, index) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x2 = centerX + Math.cos(rad) * 25;
        const y2 = (centerY - 5) + Math.sin(rad) * 25;
        
        // index 0 為右手 (黃色 #facc15)，index 1 為左手 (藍色 #0ea5e9)
        const handColor = (index === 0) ? '#facc15' : '#0ea5e9';
        
        html += `<line x1="${centerX}" y1="${centerY - 5}" x2="${x2}" y2="${y2}" 
                  stroke="${handColor}" stroke-width="4" stroke-linecap="round" />`;
    });

    return html;
}
function getSemaphoreImage(ch){
  const file = SEMAPHORE_MAP[ch.toUpperCase()];
  if(file) return 'images/'+file;
  return null;
}

function buildSemaphoreGrid(){
  const container = $('semaphoreGrid');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%';
  let html = '';
  for(const c of chars){
    const src = getSemaphoreImage(c);
    const label = c==='!'?'Error':c==='@'?'End':c==='#'?'Answering':c==='$'?'Attention':c==='%'?'Numbers':c;
    html += '<div class="flex flex-col items-center gap-1 p-2 rounded-lg bg-black/20">';
    html += '<span class="text-[10px] font-bold text-slate-500">'+label+'</span>';
    if(src){
      html += '<img src="'+src+'" alt="'+c+'" class="semaphore-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">';
      html += '<div class="hidden text-2xl font-bold text-slate-600">'+c+'</div>';
    } else {
      html += '<div class="semaphore-img flex items-center justify-center text-2xl font-bold text-slate-600">'+c+'</div>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function encodeSemaphore(text){
  const t = text.toUpperCase();
  let html = '';
  for(const c of t){
    if(c===' ') { html += '<span class="w-6"></span>'; continue; }
    const src = getSemaphoreImage(c);
    // 這裡的 label 定義可以保留（不影響顯示），但下方的 HTML 標籤必須拿掉
    const label = c==='!'?'Error':c==='@'?'End':c==='#'?'Answering':c==='$'?'Attention':c==='%'?'Numbers':c;
    
    if(src){
      html += '<div class="flex flex-col items-center">';
      html += '<img src="'+src+'" alt="'+c+'" class="semaphore-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">';
      html += '<div class="hidden semaphore-img items-center justify-center text-3xl font-bold text-slate-600">'+c+'</div>';
      
      // 【修改處】刪除或註解掉下面這一行，就不會顯示 A, B, C, D
      // html += '<span class="semaphore-char">'+label+'</span></div>'; 
      html += '</div>'; // 直接閉合 div
    } else {
      // 這裡處理的是沒圖片時顯示文字，如果你也想隱藏，可以把中間的 {c} 刪掉或隱藏
      html += '<div class="flex flex-col items-center"><div class="semaphore-img flex items-center justify-center text-3xl font-bold text-slate-600">'+c+'</div></div>';
    }
  }
  return html;
}

let semAnimTimer = null;
let semAnimPlaying = false;
function playSemaphoreAnim(){
  // --- 新增暫停邏輯 ---
  if(semAnimPlaying) {
    clearTimeout(semAnimTimer); // 停止計時器
    semAnimPlaying = false;
    $('semPlayText').textContent = '動畫播放';
    $('semPlayIcon').textContent = '▶';
    return; // 結束函數，不往後執行
  }

  // --- 原有的播放邏輯 ---
  const text = $('inputText').value.toUpperCase().replace(/[^A-Z!@#$%\s]/g,'');
  if(!text) return;

  semAnimPlaying = true;
  $('semPlayText').textContent = '停止播放'; // 這裡改為「停止」或「暫停」更直覺
  $('semPlayIcon').textContent = '⏸';

  const speed = parseInt($('semSpeed').value);
  const chars = text.split('');
  const out = $('outSemaphore');
  let idx = 0;

  function showFrame(){
    if(idx >= chars.length){
      semAnimPlaying = false;
      $('semPlayText').textContent = '動畫播放';
      $('semPlayIcon').textContent = '▶';
      updateAll();
      return;
    }
    
    const c = chars[idx];
    
    // 空格處理
    if (c === ' ') {
      out.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="semaphore-img flex items-center justify-center text-6xl font-bold text-slate-500" style="width:120px;height:120px">/</div>
        </div>`;
    } else {
      const src = getSemaphoreImage(c);
      let html = '<div class="flex flex-col items-center">';
      if(src){
        html += '<img src="'+src+'" alt="'+c+'" class="semaphore-img" style="width:120px;height:120px">';
      } else {
        html += '<div class="semaphore-img flex items-center justify-center text-5xl font-bold text-slate-600" style="width:120px;height:120px">'+c+'</div>';
      }
      html += '</div>'; // 已移除答案 Label
      out.innerHTML = html;
    }

    idx++;
    semAnimTimer = setTimeout(showFrame, speed);
  }
  showFrame();
}
function downloadSemaphoreSVG() {
    const text = $('inputText').value.toUpperCase();
    if (!text) return;

    const charWidth = 100;
    const charHeight = 120;
    const padding = 50;
    const itemsPerRow = 10;
    const rows = Math.ceil(text.length / itemsPerRow);
    const width = Math.min(text.length, itemsPerRow) * charWidth + padding * 2;
    const height = rows * charHeight + padding * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svgContent += `<rect width="100%" height="100%" fill="#001a33" />`;

    text.split('').forEach((c, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = padding + col * charWidth + charWidth / 2;
        const y = padding + row * charHeight + charHeight / 2;

        if (c === ' ') {
            svgContent += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#64748b" font-size="50" font-family="Arial">/</text>`;
        } else if (semaphoreAngles[c]) {
            svgContent += getSemaphoreSVGPath(semaphoreAngles[c], x, y);
        } else {
            svgContent += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#facc15" font-size="30" font-family="Arial">${c}</text>`;
        }
    });

    svgContent += '</svg>';
    downloadFile('semaphore_lesson.svg', svgContent, 'image/svg+xml');
}
// ===================== PNG DOWNLOAD (固定 8 格換行版) =====================
function downloadSemaphorePNG() {
    // 1. 取得文字並保留空格
    const text = $('inputText').value.toUpperCase().replace(/[^A-Z!@#$%\s]/g, '');
    if (!text) return;
    showToast('正在生成 PNG...');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const chars = text.split('');
    const imgSize = 120; // 每一格的大小
    const padding = 40;  // 邊距
    
    // 2. 固定寬度邏輯：每行 8 個
    const maxCharsPerRow = 8; 
    const rowCount = Math.ceil(chars.length / maxCharsPerRow);
    
    // 畫布寬度固定 (8格)，高度根據行數變動
    canvas.width = (maxCharsPerRow * imgSize) + (padding * 2);
    canvas.height = (rowCount * imgSize) + (padding * 2);

    // 3. 背景
    ctx.fillStyle = '#001a33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;

    // 下載與檢查函數
    function checkDone() {
        loadedCount++;
        if (loadedCount === chars.length) {
            const link = document.createElement('a');
            link.download = 'semaphore_exercise.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('PNG 已成功換行並下載');
        }
    }

    // 4. 逐字繪製 (計算 X, Y 座標)
    chars.forEach((c, i) => {
        const col = i % maxCharsPerRow;   // 第幾列 (0~7)
        const row = Math.floor(i / maxCharsPerRow); // 第幾行
        
        const xPos = padding + col * imgSize;
        const yPos = padding + row * imgSize;
        
        if (c === ' ') {
            // 空格繪製斜線
            ctx.font = 'bold 60px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('/', xPos + imgSize / 2, yPos + imgSize / 2);
            checkDone();
        } else {
            const src = getSemaphoreImage(c);
            if (src) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function() {
                    ctx.drawImage(img, xPos + 10, yPos + 10, 100, 100);
                    checkDone();
                };
                img.onerror = function() {
                    drawFallbackText(ctx, c, xPos, yPos);
                    checkDone();
                };
                img.src = src;
            } else {
                drawFallbackText(ctx, c, xPos, yPos);
                checkDone();
            }
        }
    });

    function drawFallbackText(ctx, char, x, y) {
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, x + imgSize / 2, y + imgSize / 2);
    }
}
// ===================== NATO =====================
function buildNatoTable(){
  const tbl = $('natoTable');
  const rows = [
    ['A','B','C','D','E','F','G','H','I','J','K','L','M'],
    ['N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
  ];
  let html = '';
  for(const row of rows){
    html += '<tr>';
    for(const c of row){
      html += '<td data-ch="'+c+'"><b>'+c+'</b><br>'+NATO_MAP[c]+'</td>';
    }
    html += '</tr>';
  }
  tbl.innerHTML = html;
}

function encodeNato(text){
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/'; // 讓空格顯示為斜線
    return NATO_MAP[c] || c;
  }).join(' ');
}

let natoPlaying = false;
function playNatoAudio(){
  const text = $('inputText').value.toUpperCase();
  if(!text || natoPlaying) return;
  if(!window.speechSynthesis){
    showToast('浏覽器不支援語音播放');
    return;
  }
  natoPlaying = true;
  $('natoPlayText').textContent = '朗讀中...';
  $('natoPlayIcon').textContent = '⏸';

  const words = text.split('').map(c=>NATO_MAP[c]||c).filter(w=>w!==' ');
  let idx = 0;

  function speakNext(){
    if(idx >= words.length){
      natoPlaying = false;
      $('natoPlayText').textContent = '朗讀音訊';
      $('natoPlayIcon').textContent = '▶';
      return;
    }
    const u = new SpeechSynthesisUtterance(words[idx]);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.onend = function(){
      idx++;
      setTimeout(speakNext, 200);
    };
    window.speechSynthesis.speak(u);
  }
  speakNext();
}

// ===================== CANGJIE / QUICK KEYBOARD =====================
function buildKeyboardTable(containerId, map){
  const container = $(containerId);
  let html = '<div class="keyboard-layout">';
  for(const row of KEYBOARD_ROWS){
    html += '<div class="keyboard-row">';
    for(const key of row){
      const root = map[key];
      html += '<div class="keyboard-key" data-ch="'+key+'">';
      html += '<div class="keyboard-key-letter">'+key+'</div>';
      html += '<div class="keyboard-key-root">'+root+'</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function encodeCangjie(text){
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/'; // 空格轉換為斜線
    return CANGJIE_MAP[c] || c;
  }).join(' ');
}

function encodeQuick(text){
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/'; // 空格轉換為斜線
    return QUICK_MAP[c] || c;
  }).join(' ');
}

// ===================== JYUTPING =====================
function buildJyutpingTable(){
  const tbl = $('jyutpingTable');
  const rows = [
    ['A','B','C','D','E','F'],['G','H','I','J','K','L'],
    ['M','N','O','P','Q','R'],['S','T','U','V','W','X'],['Y','Z']
  ];
  let html = '';
  for(const row of rows){
    html += '<tr>';
    for(const c of row){
      html += '<td data-ch="'+c+'"><b>'+c+'</b><br>'+JYUTPING_MAP[c]+'</td>';
    }
    html += '</tr>';
  }
  tbl.innerHTML = html;
}

function encodeJyutping(text){
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/'; // 空格轉斜線
    return JYUTPING_MAP[c] || c;
  }).join(' ');
}

// ===================== PINYIN =====================
function buildPinyinTable(){
  const tbl = $('pinyinTable');
  const rows = [
    ['A','B','C','D','E','F'],['G','H','I','J','K','L'],
    ['M','N','O','P','Q','R'],['S','T','U','V','W','X'],['Y','Z']
  ];
  let html = '';
  for(const row of rows){
    html += '<tr>';
    for(const c of row){
      html += '<td data-ch="'+c+'"><b>'+c+'</b><br>'+PINYIN_MAP[c]+'</td>';
    }
    html += '</tr>';
  }
  tbl.innerHTML = html;
}

function encodePinyin(text){
  return text.toUpperCase().split('').map(c => {
    if (c === ' ') return '/'; // 空格轉斜線
    return PINYIN_MAP[c] || c;
  }).join(' ');
}
// ===================== DOWNLOAD =====================
function downloadFile(filename, content, mime){
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('已下載 '+filename);
}

// ===================== UPDATE ALL =====================
function updateAll(){
  const text = $('inputText').value;

  // Grid
  const gridData = buildGridTable();
  $('outGrid').textContent = text ? encodeGrid(text, gridData.alphabet, gridData.key) : '';
  highlightTable('gridTable', text);

  // Morse
  buildMorseTable();
  $('outMorse').textContent = text ? encodeMorse(text) : '';
  highlightTable('morseTable', text);

  // Caesar
  buildCaesarTable();
  $('outCaesar').textContent = text ? encodeCaesar(text) : '';
  highlightTable('caesarTable', text);

  // Phone
  buildPhoneTable();
  $('outPhone').textContent = text ? encodePhone(text) : '';

  // Reverse
  $('outReverse').textContent = text ? encodeReverse(text) : '';

  // Atbash
  buildAtbashTable();
  $('outAtbash').textContent = text ? encodeAtbash(text) : '';
  highlightTable('atbashTable', text);

  // Pigpen
  buildPigpenGrid();
  $('outPigpen').innerHTML = text ? encodePigpen(text) : '';

  // Semaphore
  buildSemaphoreGrid();
  if(!semAnimPlaying) $('outSemaphore').innerHTML = text ? encodeSemaphore(text) : '';

  // NATO
  buildNatoTable();
  $('outNato').textContent = text ? encodeNato(text) : '';
  highlightTable('natoTable', text);

  // Cangjie
  buildKeyboardTable('cangjieTableWrap', CANGJIE_MAP);
  $('outCangjie').textContent = text ? encodeCangjie(text) : '';
  highlightKeyboard('cangjieTableWrap', text);

  // Quick
  buildKeyboardTable('quickTableWrap', QUICK_MAP);
  $('outQuick').textContent = text ? encodeQuick(text) : '';
  highlightKeyboard('quickTableWrap', text);

  // Jyutping
  buildJyutpingTable();
  $('outJyutping').textContent = text ? encodeJyutping(text) : '';
  highlightTable('jyutpingTable', text);

  // Pinyin
  buildPinyinTable();
  $('outPinyin').textContent = text ? encodePinyin(text) : '';
  highlightTable('pinyinTable', text);
}

function highlightTable(tableId, text){
  const t = $(tableId);
  if(!t) return;
  const cells = t.querySelectorAll('td');
  cells.forEach(td=>td.classList.remove('highlight'));
  if(!text) return;
  const set = new Set(text.toUpperCase().split(''));
  cells.forEach(td=>{
    const ch = td.dataset.ch;
    if(ch && set.has(ch)) td.classList.add('highlight');
  });
}

function highlightKeyboard(containerId, text){
  const container = $(containerId);
  if(!container) return;
  const keys = container.querySelectorAll('.keyboard-key');
  keys.forEach(k=>k.classList.remove('highlight'));
  if(!text) return;
  const set = new Set(text.toUpperCase().split(''));
  keys.forEach(k=>{
    const ch = k.dataset.ch;
    if(ch && set.has(ch)) k.classList.add('highlight');
  });
}
