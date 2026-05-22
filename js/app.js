// ===================== DATA & CONSTANTS =====================
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

const BRAILLE_MAP = {
    'A': [1], 'B': [1,2], 'C': [1,4], 'D': [1,4,5], 'E': [1,5], 'F': [1,2,4], 'G': [1,2,4,5], 'H': [1,2,5], 'I': [2,4], 'J': [2,4,5],
    'K': [1,3], 'L': [1,2,3], 'M': [1,3,4], 'N': [1,3,4,5], 'O': [1,3,5], 'P': [1,2,3,4], 'Q': [1,2,3,4,5], 'R': [1,2,3,5], 'S': [2,3,4], 'T': [2,3,4,5],
    'U': [1,3,6], 'V': [1,2,3,6], 'W': [2,4,5,6], 'X': [1,3,4,6], 'Y': [1,3,4,5,6], 'Z': [1,3,5,6]
};

const PHONE_LOOKUP = {};
const PHONE_GROUPS = {'2':['A','B','C'],'3':['D','E','F'],'4':['G','H','I'],'5':['J','K','L'],'6':['M','N','O'],'7':['P','Q','R','S'],'8':['T','U','V'],'9':['W','X','Y','Z']};
for(const [key, letters] of Object.entries(PHONE_GROUPS)) letters.forEach((ch, idx)=>{ PHONE_LOOKUP[ch] = {key, presses: idx+1}; });

// ===================== STATE =====================
let testQuestions = JSON.parse(localStorage.getItem('skw_test_questions') || '[]');
let currentProjIdx = 0;

// Game State
let peer = null;
let hostConn = null; // Only for members
let connections = []; // Only for host
let players = {};
let buzzQueue = [];
let gameMode = 'idle'; // idle, open, locked
let gameId = '';

// ===================== HELPERS =====================
const $ = (id) => document.getElementById(id);
const showToast = (msg) => {
    const t = $('toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
};

// ===================== CORE LOGIC =====================
function updateAll() {
    const text = $('inputText').value;
    const upper = text.toUpperCase();

    // Outputs
    if($('outMorse')) $('outMorse').textContent = upper.split('').map(c => MORSE_CODE[c] || c).join(' ');
    if($('outSemaphore')) $('outSemaphore').innerHTML = upper.split('').map(c => {
        if(c === ' ') return '<span class="w-8"></span>';
        const src = SEMAPHORE_MAP[c];
        return src ? `<img src="images/${src}" class="semaphore-img">` : `<div class="semaphore-img flex items-center justify-center text-2xl font-bold">${c}</div>`;
    }).join('');
    
    // Highlight Ref Tables
    const chars = new Set(upper.split(''));
    document.querySelectorAll('td[data-ch]').forEach(td => {
        td.classList.toggle('highlight', chars.has(td.dataset.ch));
    });
}

function renderBrailleChar(c) {
    const dots = BRAILLE_MAP[c.toUpperCase()] || [];
    let h = '<div class="braille-char">';
    for(let i=1; i<=6; i++) h += `<div class="braille-dot ${dots.includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function renderPigpenSVG(c) {
    // ... existing pigpen logic from previous message ...
    const maps = {'A':"M35,10 L35,35 L10,35",'B':"M10,10 L10,35 L35,35 L35,10",'C':"M10,10 L10,35 L35,35",'D':"M10,10 L35,10 L35,35 L10,35",'E':"M10,10 L35,10 L35,35 L10,35 Z",'F':"M35,10 L10,10 L10,35 L35,35",'G':"M35,35 L35,10 L10,10",'H':"M10,35 L10,10 L35,10 L35,35",'I':"M10,35 L10,10 L35,10",'J':["M35,10 L35,35 L10,35",true],'K':["M10,10 L10,35 L35,35 L35,10",true],'L':["M10,10 L10,35 L35,35",true],'M':["M10,10 L35,10 L35,35 L10,35",true],'N':["M10,10 L35,10 L35,35 L10,35 Z",true],'O':["M35,10 L10,10 L10,35 L35,35",true],'P':["M35,35 L35,10 L10,10",true],'Q':["M10,35 L10,10 L35,10 L35,35",true],'R':["M10,35 L10,10 L35,10",true],'S':"M10,10 L22.5,22.5 L35,10",'T':"M35,10 L22.5,22.5 L35,35",'U':"M10,35 L22.5,22.5 L35,35",'V':"M10,10 L22.5,22.5 L10,35",'W':["M10,10 L22.5,22.5 L35,10",true,{x:22.5,y:15}],'X':["M35,10 L22.5,22.5 L35,35",true,{x:30,y:22.5}],'Y':["M10,35 L22.5,22.5 L35,35",true,{x:22.5,y:30}],'Z':["M10,10 L22.5,22.5 L10,35",true,{x:15,y:22.5}]};
    let data = maps[c.toUpperCase()];
    if(!data) return `<span>${c}</span>`;
    let path = Array.isArray(data) ? data[0] : data;
    let dot = Array.isArray(data) && data[1];
    let dotPos = (Array.isArray(data) && data[2]) || {x:22.5,y:22.5};
    return `<svg class="pigpen-svg" width="30" height="30" viewBox="0 0 45 45"><path d="${path}" fill="none" stroke="#ffcc00" stroke-width="3"/><circle cx="${dotPos.x}" cy="${dotPos.y}" r="${dot?3:0}" fill="#ffcc00"/></svg>`;
}

// ===================== INTERACTIVE GAME LOGIC (PEERJS) =====================

function initHost() {
    peer = new Peer();
    peer.on('open', (id) => {
        gameId = id;
        $('gameIdDisplay').textContent = `Room ID: ${id}`;
        generateJoinQR(id);
    });
    
    peer.on('connection', (conn) => {
        conn.on('data', (data) => handleHostData(conn, data));
        conn.on('close', () => {
            connections = connections.filter(c => c !== conn);
            delete players[conn.peer];
            updateHostUI();
        });
    });
}

function generateJoinQR(id) {
    const url = `${window.location.origin}${window.location.pathname}?join=${id}`;
    $('joinQr').innerHTML = '';
    new QRCode($('joinQr'), {
        text: url,
        width: 150,
        height: 150,
        colorDark : "#02133e",
        colorLight : "#ffffff"
    });
}

function handleHostData(conn, data) {
    if (data.type === 'join') {
        players[conn.peer] = { name: data.name, buzzTime: null };
        connections.push(conn);
        conn.send({ type: 'welcome', gameMode });
        updateHostUI();
    } else if (data.type === 'buzz') {
        if (gameMode === 'open' && !players[conn.peer].buzzTime) {
            players[conn.peer].buzzTime = Date.now();
            buzzQueue.push({ id: conn.peer, name: players[conn.peer].name, time: players[conn.peer].buzzTime });
            buzzQueue.sort((a, b) => a.time - b.time);
            updateHostUI();
            broadcast({ type: 'buzzUpdate', queue: buzzQueue });
        }
    }
}

function updateHostUI() {
    $('playerCount').textContent = `${Object.keys(players).length} 人在線`;
    const list = $('buzzList');
    list.innerHTML = buzzQueue.map((p, idx) => `
        <div class="player-card buzzed animate-in">
            <span class="rank-badge">${idx + 1}</span>
            <div class="font-bold">${p.name}</div>
            <div class="text-[10px] opacity-50">+${((p.time - buzzQueue[0].time)/1000).toFixed(3)}s</div>
        </div>
    `).join('');
    
    // Add non-buzzed players
    const buzzedIds = new Set(buzzQueue.map(p => p.id));
    Object.keys(players).forEach(id => {
        if(!buzzedIds.has(id)) {
            list.innerHTML += `<div class="player-card">
                <div class="text-slate-500 text-xs">Waiting...</div>
                <div class="font-bold text-white">${players[id].name}</div>
            </div>`;
        }
    });
}

function broadcast(data) {
    connections.forEach(conn => conn.send(data));
}

// ===================== MEMBER LOGIC =====================

function initMember(hostId) {
    peer = new Peer();
    peer.on('open', () => {
        hostConn = peer.connect(hostId);
        hostConn.on('open', () => {
            $('memberJoinForm').style.display = 'block';
        });
        hostConn.on('data', (data) => {
            if(data.type === 'welcome' || data.type === 'modeUpdate') {
                gameMode = data.gameMode || data.mode;
                updateBuzzerUI();
            }
            if(data.type === 'buzzUpdate') {
                const myRank = data.queue.findIndex(p => p.id === peer.id);
                if(myRank !== -1) {
                    $('buzzStatus').textContent = `你排名第 ${myRank + 1}！`;
                    $('btnBuzzer').classList.add('disabled');
                    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
                }
            }
        });
    });
}

function updateBuzzerUI() {
    const btn = $('btnBuzzer');
    if(gameMode === 'open') {
        btn.classList.remove('disabled');
        $('buzzStatus').textContent = '快搶答！';
        $('memberView').classList.add('shaking-bg'); // subtle hint
    } else {
        btn.classList.add('disabled');
        $('buzzStatus').textContent = gameMode === 'locked' ? '搶答已結束' : '等待領袖開放...';
    }
}

// Shake Detection
let lastX, lastY, lastZ;
let shakeThreshold = 25;
window.addEventListener('devicemotion', (e) => {
    if(!$('shakeToggle').checked || gameMode !== 'open') return;
    let acc = e.accelerationIncludingGravity;
    if(!acc.x) return;
    
    let delta = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ);
    if(delta > shakeThreshold) {
        handleBuzz();
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
});

function handleBuzz() {
    if(gameMode === 'open' && hostConn) {
        hostConn.send({ type: 'buzz' });
        $('btnBuzzer').classList.add('disabled');
    }
}

// ===================== INITIALIZATION & UI =====================

document.addEventListener('DOMContentLoaded', () => {
    // Check if joining
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if(joinId) {
        $('mainContent').style.display = 'none';
        $('sidebar').style.display = 'none';
        $('memberView').style.display = 'flex';
        initMember(joinId);
    }

    // Sidebar & Mode Switching
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

    // Editor
    $('inputText').oninput = updateAll;
    $('btnJoinConfirm').onclick = () => {
        const name = $('playerName').value.trim();
        if(!name) return alert('請輸入名稱');
        hostConn.send({ type: 'join', name });
        $('memberJoinForm').style.display = 'none';
        $('memberBuzzer').style.display = 'flex';
        $('displayMyName').textContent = name;
    };

    $('btnBuzzer').onclick = handleBuzz;

    // Host Game Controls
    $('btnStartGame').onclick = () => {
        gameMode = 'open';
        buzzQueue = [];
        Object.keys(players).forEach(id => players[id].buzzTime = null);
        broadcast({ type: 'modeUpdate', mode: 'open' });
        updateHostUI();
    };

    $('btnLockGame').onclick = () => {
        gameMode = 'locked';
        broadcast({ type: 'modeUpdate', mode: 'locked' });
    };

    $('btnMemberLeave').onclick = () => window.location.href = window.location.origin + window.location.pathname;

    updateAll();
});

// Reuse test paper & print functions from previous stable version...
function renderTestQuestionList() {
    const list = $('testQuestionList');
    if(testQuestions.length === 0) return list.innerHTML = '<p class="text-center text-slate-500 italic py-10">清單為空</p>';
    list.innerHTML = testQuestions.map((q, idx) => `
        <div class="question-list-item">
            <div class="flex items-center gap-4">
                <span class="text-[var(--skw-gold)] font-black">Q${idx+1}</span>
                <span class="text-white">${q.text}</span>
            </div>
            <button onclick="removeQuestion(${q.id})" class="text-red-400 text-xs">刪除</button>
        </div>
    `).join('');
}
window.removeQuestion = (id) => {
    testQuestions = testQuestions.filter(q => q.id !== id);
    localStorage.setItem('skw_test_questions', JSON.stringify(testQuestions));
    renderTestQuestionList();
};
