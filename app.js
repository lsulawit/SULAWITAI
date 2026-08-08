const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const languages = [
  {code:'auto', name:'ตรวจจับอัตโนมัติ', en:'Auto Detect', flag:'✨'},
  {code:'th', name:'ไทย', en:'Thai', flag:'🇹🇭'},
  {code:'en', name:'English', en:'English', flag:'🇬🇧'},
  {code:'zh', name:'中文', en:'Chinese', flag:'🇨🇳'},
  {code:'ja', name:'日本語', en:'Japanese', flag:'🇯🇵'},
  {code:'ko', name:'한국어', en:'Korean', flag:'🇰🇷'},
  {code:'fr', name:'Français', en:'French', flag:'🇫🇷'},
  {code:'de', name:'Deutsch', en:'German', flag:'🇩🇪'},
  {code:'es', name:'Español', en:'Spanish', flag:'🇪🇸'},
  {code:'it', name:'Italiano', en:'Italian', flag:'🇮🇹'},
  {code:'pt', name:'Português', en:'Portuguese', flag:'🇵🇹'},
  {code:'ru', name:'Русский', en:'Russian', flag:'🇷🇺'},
  {code:'ar', name:'العربية', en:'Arabic', flag:'🇸🇦'},
  {code:'vi', name:'Tiếng Việt', en:'Vietnamese', flag:'🇻🇳'},
  {code:'id', name:'Bahasa Indonesia', en:'Indonesian', flag:'🇮🇩'},
  {code:'ms', name:'Bahasa Melayu', en:'Malay', flag:'🇲🇾'},
  {code:'hi', name:'हिन्दी', en:'Hindi', flag:'🇮🇳'},
  {code:'nl', name:'Nederlands', en:'Dutch', flag:'🇳🇱'},
  {code:'tr', name:'Türkçe', en:'Turkish', flag:'🇹🇷'}
];

const state = {
  source:'auto',
  target:'en',
  tone:'natural',
  selecting:'source',
  isSending:false,
  sessionId: crypto.randomUUID?.() || String(Date.now()),
  messages: []
};

const input = $('#messageInput');
const chatArea = $('#chatArea');
const sendBtn = $('#sendBtn');
const drawer = $('#drawer');
const backdrop = $('#backdrop');
const modal = $('#languageModal');
const list = $('#languageList');
const historyList = $('#historyList');

function lang(code){ return languages.find(l=>l.code===code) || languages[0]; }
function escapeHTML(str=''){ return str.replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function timeNow(){ return new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit'}).format(new Date()); }
function scrollBottom(){ requestAnimationFrame(()=> chatArea.scrollTo({top:chatArea.scrollHeight,behavior:'smooth'})); }

function autosize(){
  input.style.height='auto';
  input.style.height = Math.min(input.scrollHeight,130) + 'px';
  $('#charCount').textContent = input.value.length;
}
input.addEventListener('input', autosize);

function renderLangButtons(){
  const s=lang(state.source), t=lang(state.target);
  $('#sourceFlag').textContent=s.flag; $('#sourceLabel').textContent=s.name;
  $('#targetFlag').textContent=t.flag; $('#targetLabel').textContent=t.name;
}

function openLanguage(which){
  state.selecting=which;
  $('#modalTitle').textContent = which==='source' ? 'เลือกภาษาต้นทาง' : 'เลือกภาษาปลายทาง';
  $('#languageSearch').value='';
  renderLanguageList();
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#languageSearch').focus(),120);
}
function closeLanguage(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
function renderLanguageList(filter=''){
  const q=filter.trim().toLowerCase();
  let options=languages.filter(l=> state.selecting==='source' || l.code!=='auto');
  if(q) options=options.filter(l=>`${l.name} ${l.en} ${l.code}`.toLowerCase().includes(q));
  list.innerHTML=options.map(l=>`<button class="language-option" data-code="${l.code}"><span>${l.flag}</span><span><strong>${escapeHTML(l.name)}</strong><small>${escapeHTML(l.en)}</small></span></button>`).join('');
  $$('.language-option').forEach(btn=>btn.onclick=()=>{
    state[state.selecting]=btn.dataset.code;
    if(state.source===state.target && state.source!=='auto'){
      if(state.selecting==='source') state.target='en'; else state.source='auto';
    }
    renderLangButtons(); closeLanguage();
  });
}
$('#sourceBtn').onclick=()=>openLanguage('source');
$('#targetBtn').onclick=()=>openLanguage('target');
$('#closeModal').onclick=closeLanguage;
modal.addEventListener('click',e=>{if(e.target===modal)closeLanguage()});
$('#languageSearch').addEventListener('input',e=>renderLanguageList(e.target.value));

$('#swapBtn').onclick=()=>{
  if(state.source==='auto'){
    state.source=state.target;
    state.target='th';
  } else [state.source,state.target]=[state.target,state.source];
  renderLangButtons();
  $('#swapBtn').animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:320,easing:'ease'});
};

$$('.tone').forEach(btn=>btn.onclick=()=>{
  $$('.tone').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); state.tone=btn.dataset.tone;
});

function addMessage(role,text,meta={}){
  const isAI=role==='assistant';
  const article=document.createElement('article'); article.className=`message ${isAI?'ai-message':'user-message'}`;
  article.innerHTML=`
    <div class="avatar ${isAI?'ai-avatar':'user-avatar'}">${isAI?'<span>✦</span>':'YOU'}</div>
    <div class="bubble">
      <div class="bubble-head"><strong>${isAI?'SULAWIT AI':'คุณ'}</strong><span>${timeNow()}</span></div>
      <p>${escapeHTML(text)}</p>
      ${isAI?`<div class="message-meta"><button class="action-chip copy-action"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>คัดลอก</button><button class="action-chip speak-action"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12"/></svg>ฟัง</button></div>`:''}
    </div>`;
  chatArea.appendChild(article);
  article.querySelector('.copy-action')?.addEventListener('click',()=>copyText(text));
  article.querySelector('.speak-action')?.addEventListener('click',()=>speakText(text));
  state.messages.push({role,text,meta,time:Date.now()});
  saveHistory(); scrollBottom();
  return article;
}

function addTyping(){
  const el=document.createElement('article'); el.className='message ai-message typing-message';
  el.innerHTML=`<div class="avatar ai-avatar"><span>✦</span></div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div>`;
  chatArea.appendChild(el); scrollBottom(); return el;
}

async function translate(){
  const text=input.value.trim(); if(!text || state.isSending) return;
  state.isSending=true; sendBtn.disabled=true;
  addMessage('user',text,{source:state.source,target:state.target});
  input.value=''; autosize();
  const typing=addTyping();
  try{
    const context = state.messages.slice(-8).map(m=>({role:m.role,content:m.text}));
    const res=await fetch('/api/translate',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text,sourceLanguage:lang(state.source).en,targetLanguage:lang(state.target).en,tone:state.tone,context})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || 'AI service unavailable');
    typing.remove();
    addMessage('assistant',data.translation || 'ไม่พบคำแปล',{source:state.source,target:state.target});
  }catch(err){
    typing.remove();
    const fallback = demoTranslate(text,state.target);
    addMessage('assistant',fallback,{demo:true});
    showToast('กำลังใช้โหมดสาธิต — เชื่อม API เพื่อใช้ AI จริง');
  }finally{state.isSending=false;sendBtn.disabled=false;input.focus()}
}

function demoTranslate(text,target){
  const samples={
    en:{'สวัสดี':'Hello','ขอบคุณ':'Thank you','ฉันรักคุณ':'I love you','วันนี้อากาศดี':'The weather is nice today.'},
    th:{'hello':'สวัสดี','thank you':'ขอบคุณ','i love you':'ฉันรักคุณ','good morning':'สวัสดีตอนเช้า'},
    zh:{'สวัสดี':'你好\nNǐ hǎo','ขอบคุณ':'谢谢\nXièxie','ฉันรักคุณ':'我爱你\nWǒ ài nǐ'},
    ja:{'สวัสดี':'こんにちは','ขอบคุณ':'ありがとうございます'},
    ko:{'สวัสดี':'안녕하세요','ขอบคุณ':'감사합니다'}
  };
  const dict=samples[target]||{}; const key=Object.keys(dict).find(k=>k.toLowerCase()===text.toLowerCase());
  if(key) return dict[key];
  return `［โหมดสาธิต］${text}\n\nเมื่อเชื่อม OPENAI_API_KEY บน Vercel ข้อความนี้จะถูกแปลด้วย AI ตามภาษาและโทนที่เลือกโดยอัตโนมัติ`;
}

sendBtn.onclick=translate;
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();translate()}});

$$('[data-prompt]').forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.prompt;autosize();input.focus();});

async function copyText(text){try{await navigator.clipboard.writeText(text);showToast('คัดลอกแล้ว')}catch{showToast('คัดลอกไม่สำเร็จ')}}
function speakText(text){ if(!('speechSynthesis' in window)) return showToast('อุปกรณ์นี้ไม่รองรับเสียงพูด'); speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang(state.target).code; speechSynthesis.speak(u); }
function showToast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2200)}

function setupSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition; const mic=$('#micBtn');
  if(!SR){mic.onclick=()=>showToast('เบราว์เซอร์นี้ยังไม่รองรับการพูดเป็นข้อความ');return}
  const rec=new SR(); rec.interimResults=true; rec.continuous=false;
  mic.onclick=()=>{rec.lang=state.source==='auto'?'th-TH':state.source;rec.start();mic.classList.add('listening')};
  rec.onresult=e=>{input.value=[...e.results].map(r=>r[0].transcript).join('');autosize()};
  rec.onend=()=>mic.classList.remove('listening'); rec.onerror=()=>{mic.classList.remove('listening');showToast('ไม่สามารถใช้ไมโครโฟนได้')};
}
setupSpeech();

function openDrawer(){drawer.classList.add('open');backdrop.classList.add('show');drawer.setAttribute('aria-hidden','false');renderHistory()}
function closeDrawer(){drawer.classList.remove('open');backdrop.classList.remove('show');drawer.setAttribute('aria-hidden','true')}
$('#menuBtn').onclick=openDrawer;$('#historyNav').onclick=openDrawer;$('#closeDrawer').onclick=closeDrawer;backdrop.onclick=closeDrawer;

function getSessions(){try{return JSON.parse(localStorage.getItem('sulawit-history')||'[]')}catch{return []}}
function saveHistory(){
  if(!state.messages.length)return;
  const sessions=getSessions(); const idx=sessions.findIndex(s=>s.id===state.sessionId);
  const item={id:state.sessionId,title:state.messages.find(m=>m.role==='user')?.text.slice(0,55)||'แชตใหม่',updated:Date.now(),messages:state.messages,source:state.source,target:state.target,tone:state.tone};
  if(idx>=0)sessions[idx]=item;else sessions.unshift(item);
  localStorage.setItem('sulawit-history',JSON.stringify(sessions.slice(0,30)));
}
function renderHistory(){
  const sessions=getSessions().sort((a,b)=>b.updated-a.updated);
  if(!sessions.length){historyList.innerHTML='<div class="empty-history">ยังไม่มีประวัติการแปล<br>เริ่มแชตแรกของคุณได้เลย ✦</div>';return}
  historyList.innerHTML=sessions.map(s=>`<div class="history-item" data-id="${s.id}"><strong>${escapeHTML(s.title)}</strong><span>${new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(s.updated))}</span></div>`).join('');
  $$('.history-item').forEach(el=>el.onclick=()=>loadSession(el.dataset.id));
}
function resetChat(){
  state.sessionId=crypto.randomUUID?.()||String(Date.now());state.messages=[];
  chatArea.innerHTML=`<article class="message ai-message intro-message"><div class="avatar ai-avatar"><span>✦</span></div><div class="bubble"><div class="bubble-head"><strong>SULAWIT AI</strong><span>ตอนนี้</span></div><p>เริ่มบทสนทนาใหม่แล้ว พิมพ์ข้อความที่ต้องการแปลได้เลย ✦</p></div></article>`;closeDrawer();input.focus();
}
function loadSession(id){
  const s=getSessions().find(x=>x.id===id);if(!s)return;
  state.sessionId=s.id;state.messages=[];state.source=s.source||'auto';state.target=s.target||'en';state.tone=s.tone||'natural';renderLangButtons();
  $$('.tone').forEach(x=>x.classList.toggle('active',x.dataset.tone===state.tone));chatArea.innerHTML='';
  (s.messages||[]).forEach(m=>addMessage(m.role,m.text,m.meta||{}));closeDrawer();
}
$('#newChatBtn').onclick=resetChat;
$('#clearHistoryBtn').onclick=()=>{localStorage.removeItem('sulawit-history');renderHistory();showToast('ล้างประวัติแล้ว')};

$('#focusBtn').onclick=()=>{document.body.classList.toggle('focus-mode');showToast(document.body.classList.contains('focus-mode')?'โหมดโฟกัส':'โหมดปกติ')};

window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeLanguage()}});
renderLangButtons();renderHistory();autosize();
