export const ACTS = [
  { name: 'The Ring of Fire', short: 'FIRE & WONDER', subtitle: 'Jump through the golden hoops.', speed: 7.2, color: '#f5bd63' },
  { name: 'Roll With It', short: 'A BALANCING ACT', subtitle: 'Clear the barrels. Stick the landing.', speed: 8.1, color: '#7edbd0' },
  { name: 'The Grand Finale', short: 'MAKE IT SPECTACULAR', subtitle: 'Hoops, barrels, and one last bow.', speed: 9.0, color: '#ffa1a4' },
];
export const ACT_DURATION = 30;
export const PLAYER_X = -5;
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t=s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}
export function dailySeed(date = new Date()) { return Number(date.toISOString().slice(0,10).replaceAll('-','')); }
export function obstacleCleared(type, height) { return type === 'hoop' ? height >= .66 && height <= 2.95 : height >= .90; }
export function grade(score, won) { return won && score >= 14000 ? 'S' : score >= 9000 ? 'A' : score >= 5000 ? 'B' : score >= 2000 ? 'C' : 'D'; }

export class Game {
  constructor(onEvent = () => {}) { this.onEvent=onEvent; this.status='menu'; this.obstacles=[]; this.stars=[]; this.y=0; this.t=0; this.score=0; this.act=0; this.combo=0; this.invincible=0; }
  emit(type, detail={}) { this.onEvent({type,...detail}); }
  start({mode='show',chill=false,seed=Date.now()}={}) {
    this.mode=mode;this.chill=chill;this.seed=mode==='daily'?dailySeed():seed;
    this.random=seededRandom(this.seed);this.status='playing';this.t=0;this.act=0;this.y=0;this.vy=0;
    this.score=0;this.combo=0;this.bestCombo=0;this.cleared=0;this.collected=0;this.tricks=0;
    this.lives=chill?5:3;this.maxLives=this.lives;this.invincible=0;this.obstacles=[];this.stars=[];
    this.spawnTimer=2.1;this.nextId=1;this.jumpBuffer=0;this.flipping=false;this.flipTime=0;this.flipLanded=false;
    this.emit('start');this.emit('act',{act:0});
  }
  jump() {
    if(this.status!=='playing')return;
    if(this.y<=.025) {this.vy=9.0;this.y=.026;this.flipping=false;this.flipTime=0;this.emit('jump');}
    else this.jumpBuffer=.12;
  }
  flip() {
    if(this.status!=='playing'||this.y<.7||this.flipping||this.vy<-.8)return;
    this.flipping=true;this.flipTime=0;this.emit('flip');
  }
  pause() { if(this.status==='playing'){this.status='paused';this.emit('pause');} }
  resume() {if(this.status==='paused'){this.status='playing';this.emit('resume');} }
  get speed() { return (ACTS[this.act].speed+(this.mode==='encore'?Math.min(4,Math.floor(this.t/90)*.65):0))*(this.chill?.78:1); }
  get multiplier() { return Math.min(5,1+Math.floor(this.combo/3)); }
  spawn() {
    const type=this.act===0?'hoop':this.act===1?'barrel':this.random()>.45?'hoop':'barrel';
    const x=20;const id=this.nextId++;
    this.obstacles.push({id,x,type,passed:false});
    // A rising trail explains the intended arc without obscuring the hazard.
    for(let i=0;i<3;i++)this.stars.push({id:this.nextId++,x:x-2.6+i*1.25,y:2.3+Math.sin(i*Math.PI/2)*.48,collected:false});
    this.spawnTimer=2.05+this.random()*.7;
    this.emit('spawn',{id,type});
  }
  update(dt) {
    if(this.status!=='playing')return;
    dt=Math.min(dt,.05);this.t+=dt;this.invincible=Math.max(0,this.invincible-dt);
    const nextAct=Math.floor(this.t/ACT_DURATION)%3;
    if(this.mode!=='encore'&&this.t>=90){this.finish(true);return;}
    if(nextAct!==this.act){this.act=nextAct;this.obstacles=[];this.stars=[];this.spawnTimer=1.8;this.emit('act',{act:this.act});}
    if(this.y>0||this.vy>0){
      this.vy-=18*dt;this.y+=this.vy*dt;
      if(this.flipping)this.flipTime+=dt;
      if(this.y<=0){
        this.y=0;this.vy=0;
        if(this.flipping&&this.flipTime>=.35){this.tricks++;this.score+=150*this.multiplier;this.emit('trick',{points:150*this.multiplier});}
        this.flipping=false;this.emit('land');
        if(this.jumpBuffer>0){this.jumpBuffer=0;this.jump();}
      }
    }
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    this.spawnTimer-=dt;if(this.spawnTimer<=0)this.spawn();
    for(const o of this.obstacles){
      o.x-=this.speed*dt;
      if(!o.passed&&o.x<=PLAYER_X+.10){
        o.passed=true;
        if(obstacleCleared(o.type,this.y)){
          this.combo++;this.cleared++;this.bestCombo=Math.max(this.bestCombo,this.combo);
          const perfect=Math.abs(this.y-1.9)<.45;
          const points=(perfect?400:250)*this.multiplier;this.score+=points;
          this.emit('clear',{id:o.id,perfect,points});
        }else if(this.invincible<=0){
          this.lives--;this.combo=0;this.invincible=2.3;this.flipping=false;
          this.emit('hit',{hazardType:o.type});if(this.lives<=0){this.finish(false);return;}
        }
      }
    }
    for(const s of this.stars){
      s.x-=this.speed*dt;
      if(!s.collected&&Math.abs(s.x-PLAYER_X)<.65&&Math.abs(s.y-(this.y+1.1))<.85){
        s.collected=true;this.collected++;this.score+=50*this.multiplier;this.emit('star',{id:s.id,x:s.x,y:s.y});
      }
    }
    this.obstacles=this.obstacles.filter(o=>o.x>-15);
    this.stars=this.stars.filter(s=>s.x>-15&&!s.collected);
  }
  finish(won){this.status='finished';this.won=won;if(won)this.score+=this.lives*1000;this.emit('finish',{won});}
}
