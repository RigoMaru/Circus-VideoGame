import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,seededRandom,dailySeed,obstacleCleared,PLAYER_X} from '../src/game.js';
test('daily courses are deterministic and UTC dated',()=>{assert.equal(dailySeed(new Date('2026-09-30T23:59:00Z')),20260930);const a=seededRandom(30),b=seededRandom(30);assert.deepEqual(Array.from({length:100},a),Array.from({length:100},b));});
test('jump has one airborne arc and lands consistently at varied frame rates',()=>{for(const fps of [30,60,144]){const g=new Game();g.start();g.jump();let top=0;for(let i=0;i<fps*1.2;i++){g.update(1/fps);top=Math.max(top,g.y);}assert.ok(top>2&&top<2.4);assert.equal(g.y,0);}});
test('cannot double jump or flip from the ground',()=>{const g=new Game();g.start();g.flip();assert.equal(g.flipping,false);g.jump();g.update(.05);const vy=g.vy;g.jump();assert.equal(g.vy,vy);});
test('clearing an obstacle scores exactly once',()=>{const g=new Game();g.start();g.y=1.9;g.vy=0;g.obstacles=[{id:1,x:PLAYER_X+.11,type:'hoop',passed:false}];g.update(.01);const score=g.score;assert.ok(score>0);g.update(.01);assert.equal(g.score,score);assert.equal(g.combo,1);});
test('collision costs one life, resets combo and supplies invulnerability',()=>{const g=new Game();g.start();g.combo=5;g.obstacles=[{id:1,x:PLAYER_X,type:'hoop',passed:false},{id:2,x:PLAYER_X,type:'barrel',passed:false}];g.update(.01);assert.equal(g.lives,2);assert.equal(g.combo,0);assert.ok(g.invincible>2);});
test('pause freezes simulation and cannot award points',()=>{const g=new Game();g.start();g.jump();g.pause();const y=g.y;g.update(1);g.jump();assert.equal(g.t,0);assert.equal(g.y,y);g.resume();g.update(.01);assert.ok(g.t>0);});
test('90-second show wins while encore keeps going',()=>{for(const mode of ['show','encore']){const g=new Game();g.start({mode});g.t=89.99;g.update(.02);assert.equal(g.status,mode==='show'?'finished':'playing');}});
test('act changes clear old hazards and give breathing space',()=>{const g=new Game();g.start();g.t=29.99;g.obstacles=[{id:1,x:PLAYER_X,type:'hoop'}];g.update(.02);assert.equal(g.act,1);assert.equal(g.obstacles.length,0);assert.equal(g.lives,3);assert.ok(g.spawnTimer>1);});
test('collision windows match jumpable course',()=>{assert.equal(obstacleCleared('hoop',0),false);assert.equal(obstacleCleared('hoop',1.8),true);assert.equal(obstacleCleared('barrel',.3),false);assert.equal(obstacleCleared('barrel',1.2),true);});
test('buffered late input starts next jump on landing',()=>{const g=new Game();g.start();g.y=.05;g.vy=-8;g.jump();g.update(.02);assert.ok(g.vy>0);});
test('damage emits a hit event for sound and visual feedback',()=>{const events=[];const g=new Game(e=>events.push(e));g.start();g.obstacles=[{id:1,x:PLAYER_X,type:'hoop',passed:false}];g.update(.01);assert.ok(events.some(e=>e.type==='hit'&&e.hazardType==='hoop'));});
test('a timed player can finish every act without damage at 30, 60 and 144 FPS',()=>{
  for(const fps of [30,60,144]){
    const g=new Game();g.start({seed:1234});
    for(let i=0;i<fps*92&&g.status==='playing';i++){
      const next=g.obstacles.find(o=>!o.passed);
      if(next&&g.y===0&&(next.x-PLAYER_X)/g.speed<.52)g.jump();
      if(g.y>.9&&g.vy>1)g.flip();
      g.update(1/fps);
    }
    assert.equal(g.won,true,`${fps} FPS must reach finale`);assert.equal(g.lives,3);assert.ok(g.cleared>25);assert.ok(g.tricks>20);assert.ok(g.score>15000);
  }
});
test('encore supports a long run without accumulating old hazards',()=>{
  const g=new Game();g.start({mode:'encore',chill:true,seed:77});
  for(let i=0;i<60*300&&g.status==='playing';i++){const next=g.obstacles.find(o=>!o.passed);if(next&&g.y===0&&(next.x-PLAYER_X)/g.speed<.52)g.jump();g.update(1/60);}
  assert.equal(g.status,'playing');assert.ok(g.obstacles.length<6);assert.ok(g.stars.length<18);assert.ok(g.t>299);
});
