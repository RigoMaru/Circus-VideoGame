import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/fraunces/latin-900.css';
import './style.css';
import {Game,ACTS,ACT_DURATION,grade,PLAYER_X,dailySeed} from './game.js';
import {Stage} from './scene.js';
import {AudioDirector} from './audio.js';

const $=id=>document.getElementById(id);
const audio=new AudioDirector();let stage;let mode='show',ready=false;let announcementTimer,feedbackTimer,flashTimer;let settingsWasPlaying=false;
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private mode can deny persistence; play still works. */}};
const settings={music:48,fx:65,chill:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,quality:'high',...safeRead('cirque-settings',{})};
const records=safeRead('cirque-records',{});
const game=new Game(onEvent);
const recordKey=()=>`${mode}-${settings.chill?'chill':'classic'}${mode==='daily'?'-'+dailySeed():''}`;
const fmt=n=>Math.floor(n).toString().padStart(6,'0');
function refreshRecord(){$('menu-best').textContent=fmt(records[recordKey()]||0);$('mode-note').textContent=mode==='daily'?`Ticket ${dailySeed()} · Same course for everyone.`:mode==='encore'?'The curtain never falls.':'Three acts. Make them count.';}
function updateSettings(){
  audio.musicVolume=settings.music/100;audio.fxVolume=settings.fx/100;audio.volumes();
  document.body.classList.toggle('reduced-motion',settings.reduced);
  if(stage){stage.reduced=settings.reduced;stage.quality(settings.quality==='low');}
  save('cirque-settings',settings);refreshRecord();
}
function announce(act){clearTimeout(announcementTimer);$('announce-small').textContent=`ACT 0${act+1} · ${ACTS[act].short}`;$('announce-title').textContent=ACTS[act].name;$('announce-sub').textContent=ACTS[act].subtitle;$('announcement').classList.remove('hidden');announcementTimer=setTimeout(()=>$('announcement').classList.add('hidden'),2600);}
function feedback(text){$('feedback').textContent=text;$('feedback').style.opacity='1';clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('feedback').style.opacity='0',1000);}
function onEvent(event){
  switch(event.type){
    case 'act':audio.act=event.act;audio.effect('act');announce(event.act);stage?.clearObjects();break;
    case 'jump':audio.effect('jump');break;
    case 'star':audio.effect('star');stage?.burst(event.x,event.y,4);break;
    case 'clear':audio.effect(event.perfect?'perfect':'clear');feedback(`${event.perfect?'PERFECT!':'BRAVO!'} +${event.points}`);stage?.burst(PLAYER_X,game.y+1.3,20);break;
    case 'trick':audio.effect('trick');feedback(`TA-DA! +${event.points}`);stage?.burst(PLAYER_X,1,12);break;
    case 'hit':audio.effect('hit');feedback('You’ve got this!');if(!settings.reduced){stage.shake=.35;$('flash').style.opacity='.20';clearTimeout(flashTimer);flashTimer=setTimeout(()=>$('flash').style.opacity='0',120);}break;
    case 'pause':audio.suspend();break;
    case 'finish':finish(event.won);break;
  }
}
async function start(){
  if(!ready)return;
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  $('menu').classList.add('hidden');$('hud').classList.remove('hidden');document.body.classList.add('playing');
  $('feedback').style.opacity='0';stage.setMode('game');
  try{await audio.unlock();audio.start();}catch(e){console.warn('Audio unavailable; continuing silently.',e);}
  game.start({mode,chill:settings.chill});document.activeElement?.blur();
}
function home(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());game.status='menu';game.y=0;game.invincible=0;audio.stop();$('menu').classList.remove('hidden');$('hud').classList.add('hidden');document.body.classList.remove('playing');stage.setMode('menu');refreshRecord();}
function pause(){if(game.status!=='playing')return;game.pause();$('pause-dialog').showModal();}
async function resume(){if(game.status!=='paused')return;$('pause-dialog').close();try{await audio.unlock();audio.start();}catch{}game.resume();}
function finish(won){
  clearTimeout(announcementTimer);$('announcement').classList.add('hidden');audio.stop();audio.effect(won?'win':'lose');
  const key=recordKey(),previous=records[key]||0,isRecord=game.score>previous;
  if(isRecord){records[key]=game.score;save('cirque-records',records);}
  $('result-kicker').textContent=won?'A STANDING OVATION':'THE CROWD WANTS MORE';
  $('result-title').textContent=won?'Take a bow.':'One more show?';
  $('result-score').textContent=game.score.toLocaleString();$('rank').textContent=grade(game.score,won);
  $('new-record').textContent=isRecord?'✦ A NEW PERSONAL BEST. THAT’S SHOW BUSINESS.':`PERSONAL BEST: ${previous.toLocaleString()} · ${settings.chill?'CHILL':'CLASSIC'}`;
  $('stat-cleared').textContent=game.cleared;$('stat-combo').textContent=game.bestCombo;$('stat-tricks').textContent=game.tricks;
  $('result-tip').textContent=won?`${game.lives} hearts left earned ${game.lives*1000} bonus applause. Can you do it with more flair?`:game.cleared<3?'Jump about half a second before the hoop reaches you. Follow the golden stars.':'Chain three clean jumps to raise your multiplier. Add an X somersault for extra applause.';
  $('share-btn').textContent='Copy score ↗';$('results-dialog').showModal();if(won)stage.burst(0,6,100);
}
function hud(){
  $('score').textContent=fmt(game.score);$('hearts').textContent='♥ '.repeat(Math.max(0,game.lives))+'♡ '.repeat(Math.max(0,game.maxLives-game.lives));$('hearts').setAttribute('aria-label',`${game.lives} lives`);
  $('combo').textContent=`×${game.multiplier}`;$('act-label').textContent=`ACT 0${game.act+1} / 03${settings.chill?' · CHILL':''}`;$('act-title').textContent=ACTS[game.act].name;
  $('progress-fill').style.width=`${(game.t%ACT_DURATION)/ACT_DURATION*100}%`;
  $('time-left').textContent=mode==='encore'?`${Math.floor(game.t)}s · THE SHOW GOES ON`:`${Math.max(0,Math.ceil(90-game.t))}s TO THE OVATION`;
}
$('play-btn').onclick=start;$('retry-btn').onclick=start;$('how-play').onclick=start;$('resume-btn').onclick=resume;$('quit-btn').onclick=home;$('results-home').onclick=home;$('pause-btn').onclick=pause;
$('home-link').onclick=e=>{e.preventDefault();if(game.status==='playing')pause();else if(game.status!=='paused')home();};
$('how-btn').onclick=()=>$('how-dialog').showModal();
$('settings-btn').onclick=()=>{settingsWasPlaying=game.status==='playing';if(settingsWasPlaying)game.pause();$('settings-dialog').showModal();};
$('settings-dialog').addEventListener('close',()=>{if(settingsWasPlaying){settingsWasPlaying=false;resume();}});
document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});
$('results-dialog').addEventListener('cancel',e=>{e.preventDefault();home();});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(btn=>{const selected=btn===b;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));});refreshRecord();});
for(const [id,key] of [['music-volume','music'],['fx-volume','fx'],['chill','chill'],['reduced-motion','reduced'],['quality','quality']]){
  const input=$(id);if(input.type==='checkbox')input.checked=settings[key];else input.value=settings[key];
  input.addEventListener('input',()=>{settings[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;updateSettings();});
}
function toggleSound(){audio.muted=!audio.muted;audio.volumes();$('sound-btn').textContent=audio.muted?'♪̸':'♫';$('sound-btn').setAttribute('aria-label',audio.muted?'Unmute sound':'Mute sound');}
$('sound-btn').onclick=toggleSound;
$('fullscreen-btn').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{$('fullscreen-btn').title='Fullscreen is unavailable in this browser';}};
$('share-btn').onclick=async()=>{const text=`CIRQUE · ${game.score.toLocaleString()} applause · ${game.bestCombo} streak · ${mode}${settings.chill?' · Chill':''}${mode==='daily'?' · Ticket '+game.seed:''}\nOne more show? ${location.href.split('?')[0]}`;try{await navigator.clipboard.writeText(text);$('share-btn').textContent='Copied! ✓';}catch{$('share-btn').textContent='Copy unavailable';}};
window.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(e.repeat)return;
  if(e.code==='KeyM'){toggleSound();return;}
  if(e.code==='Escape'||e.code==='KeyP'){if(document.querySelector('dialog[open]'))return;if(game.status==='playing'){e.preventDefault();pause();}return;}
  if(document.querySelector('dialog[open]'))return;
  if(['Space','ArrowUp','KeyW'].includes(e.code)){if(game.status==='playing'){e.preventDefault();game.jump();}else if(game.status==='menu'&&e.target===document.body){e.preventDefault();start();}}
  if(e.code==='KeyX'){e.preventDefault();game.flip();}
});
$('jump-btn').addEventListener('pointerdown',e=>{e.preventDefault();game.jump();});$('flip-btn').addEventListener('pointerdown',e=>{e.preventDefault();game.flip();});
$('world').addEventListener('pointerdown',e=>{if(game.status==='playing'){e.preventDefault();game.jump();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.status==='playing')pause();});
window.addEventListener('blur',()=>{if(game.status==='playing')pause();});
refreshRecord();updateSettings();
try{
  stage=new Stage($('world'));updateSettings();await stage.load();ready=true;
  $('play-btn').disabled=false;$('play-label').textContent='STEP RIGHT UP';document.body.classList.add('ready');
  let last=performance.now(),hudTime=0;
  const frame=now=>{const dt=Math.min((now-last)/1000,.05);last=now;game.update(dt);stage.frame(dt,game);hudTime+=dt;if(hudTime>.08&&game.status!=='menu'){hud();hudTime=0;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
}catch(error){console.error(error);$('load-error').classList.remove('hidden');}
