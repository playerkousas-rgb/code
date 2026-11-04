const morse = ['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..'];
const sem = [[4,5],[4,6],[4,7],[4,0],[4,1],[4,2],[4,3],[5,6],[5,7],[2,0],[5,0],[5,1],[5,2],[5,3],[6,7],[6,0],[6,1],[6,2],[6,3],[7,0],[7,1],[0,3],[1,2],[1,3],[7,2],[3,2]];
const braille = [[1],[1,2],[1,4],[1,4,5],[1,5],[1,2,4],[1,2,4,5],[1,2,5],[2,4],[2,4,5],[1,3],[1,2,3],[1,3,4],[1,3,4,5],[1,3,5],[1,2,3,4],[1,2,3,4,5],[1,2,3,5],[2,3,4],[2,3,4,5],[1,3,6],[1,2,3,6],[2,4,5,6],[1,3,4,6],[1,3,4,5,6],[1,3,5,6]];
const nato=['Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliett','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'];
const digitMorse=['-----','.----','..---','...--','....-','.....','-....','--...','---..','----.'];
export const types={Morse:'摩斯密碼',Semaphore:'旗號',Braille:'點字',Pigpen:'朱高密碼',Grid:'座標密碼（SCOUT）',Phone:'電話密碼',Caesar:'凱撒位移（3）',Atbash:'反射密碼',Reverse:'倒序密碼',NATO:'NATO 音標'};
const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const pigPaths=['M35,10 L35,35 L10,35','M10,10 L10,35 L35,35 L35,10','M10,10 L10,35 L35,35','M10,10 L35,10 L35,35 L10,35','M10,10 L35,10 L35,35 L10,35 Z','M35,10 L10,10 L10,35 L35,35','M35,35 L35,10 L10,10','M10,35 L10,10 L35,10 L35,35','M10,35 L10,10 L35,10','M10,10 L22.5,22.5 L35,10','M35,10 L22.5,22.5 L35,35','M10,35 L22.5,22.5 L35,35','M10,10 L22.5,22.5 L10,35'];
export function encoded(text,type) {
  const clean=text.trim().toUpperCase().replace(/\s+/g,' ');
  if(!/^[A-Z0-9 ]+$/.test(clean)) throw Error('訊息只可使用英文字母、數字及空格。');
  if(['Semaphore','Braille','Pigpen'].includes(type) && /[^A-Z ]/.test(clean)) throw Error('旗號、點字及朱高密碼只支援英文字母和空格。');
  if(type==='Grid' && /[^A-Y ]|J/.test(clean)) throw Error('座標密碼表沒有 J 和 Z，請使用其他字母。');
  const chars=[...clean];
  if(type==='Semaphore') return {kind:'semaphore',prompt:chars.map(c=>c===' '?'/' : sem[abc.indexOf(c)].join(',')).join(' ')};
  if(type==='Pigpen') return {kind:'pigpen',prompt:chars.map(c=>c===' '?'/' : String(abc.indexOf(c))).join(' ')};
  if(type==='Braille') return {kind:'text',prompt:chars.map(c=>c===' '?'　':String.fromCodePoint(0x2800+braille[abc.indexOf(c)].reduce((a,n)=>a+(1<<(n-1)),0))).join(' ')};
  if(type==='Morse') return {kind:'text',prompt:chars.map(c=>c===' '?'/' : /[0-9]/.test(c)?digitMorse[Number(c)]:morse[abc.indexOf(c)]).join(' ')};
  if(type==='NATO') return {kind:'text',prompt:chars.map(c=>c===' '?'/' : /[0-9]/.test(c)?c:nato[abc.indexOf(c)]).join(' ')};
  if(type==='Reverse') return {kind:'text',prompt:chars.reverse().join('')};
  if(type==='Atbash') return {kind:'text',prompt:chars.map(c=>/[A-Z]/.test(c)?abc[25-abc.indexOf(c)]:c).join('')};
  if(type==='Caesar') return {kind:'text',prompt:chars.map(c=>/[A-Z]/.test(c)?abc[(abc.indexOf(c)+3)%26]:c).join('')};
  if(type==='Phone') return {kind:'text',prompt:chars.map(c=>{if(c===' ')return '/';if(/[0-9]/.test(c))return c;const groups=['ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ']; const n=groups.findIndex(g=>g.includes(c));return `${n+2}${groups[n].indexOf(c)+1}`}).join(' ')};
  if(type==='Grid') {const alphabet='ABCDEFGHIKLMNOPQRSTUVWXY', key='SCOUT';return {kind:'text',prompt:chars.map(c=>{if(c===' ')return '/';const n=alphabet.indexOf(c);return key[n%5]+key[Math.floor(n/5)]}).join(' ')}}
  throw Error('不支援的密碼種類');
}
export function compileQuestion(q) {
  if(!types[q.type]) throw Error('不支援的密碼種類');
  const plain=q.text.trim().toUpperCase().replace(/\s+/g,' '), cipher=encoded(plain,q.type);
  // For symbol answers, use an explicit position/token key for manual checking.
  const answer=cipher.kind==='semaphore'?'旗號位置（數字 0–7 由上方開始順時針，每格 45°）：'+cipher.prompt:cipher.kind==='pigpen'?'朱高符號編號（A=0，B=1，如此類推）：'+cipher.prompt:cipher.prompt;
  return q.direction==='encode'
    ? {id:q.id,label:`用${types[q.type]}表示`,kind:'text',prompt:plain,answer}
    : {id:q.id,label:`翻譯${types[q.type]}`,kind:cipher.kind,prompt:cipher.prompt,answer:plain};
}
export function symbolSvg(kind, token) {
  if(kind==='semaphore') {
    if(!/^[0-7],[0-7]$/.test(token)) return '';
    const lines=token.split(',').map((n,i)=>{const rad=(Number(n)*45-90)*Math.PI/180;const x=50+Math.cos(rad)*40,y=44+Math.sin(rad)*40;return `<line x1="50" y1="44" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#fff" stroke-width="6"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="7" fill="${i?'#35d5e5':'#fb7185'}"/>`}).join('');
    return `<svg viewBox="0 0 100 120" role="img" aria-label="一個旗號符號"><circle cx="50" cy="22" r="10" fill="none" stroke="white" stroke-width="4"/><path d="M50 32 V75 M50 75 L33 108 M50 75 L67 108" stroke="white" stroke-width="5"/>${lines}</svg>`;
  }
  if(kind==='pigpen' && /^(?:[0-9]|1[0-9]|2[0-5])$/.test(token)) {
    const n=Number(token), idx=n<18?n%9:9+(n-18)%4, dot=(n>=9&&n<18)||n>=22;
    const pos=n>=22?[[22.5,15],[30,22.5],[22.5,30],[15,22.5]][n-22]:[22.5,22.5];
    return `<svg viewBox="0 0 45 45" role="img" aria-label="一個朱高密碼符號"><path d="${pigPaths[idx]}" fill="none" stroke="#fcd34d" stroke-width="3"/>${dot?`<circle cx="${pos[0]}" cy="${pos[1]}" r="3" fill="#fcd34d"/>`:''}</svg>`;
  }
  return '';
}
