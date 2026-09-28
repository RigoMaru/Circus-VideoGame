// Original score: "One More Show". 144 BPM, swung eighths, four eight-bar phrases.
// No samples, external recordings, or copied melodies. Every sound is synthesized.
const MELODY = [
 [76,79,81,79,76,72,74,76],[79,0,76,74,72,0,67,72],
 [77,81,84,81,77,74,76,77],[79,76,74,71,67,0,74,79],
 [76,79,84,83,81,79,76,74],[72,76,79,76,74,72,69,67],
 [69,72,77,76,74,71,74,79],[76,72,74,71,72,0,79,0],
 [84,0,83,81,79,76,79,81],[83,79,76,74,72,0,76,79],
 [81,77,74,77,84,81,79,77],[79,0,74,76,71,74,79,83],
 [84,79,76,79,81,76,74,72],[77,74,72,69,72,74,77,81],
 [79,74,71,74,77,76,74,71],[72,0,76,0,79,0,84,0],
];
const CHORDS=[[48,52,55],[48,52,55],[53,57,60],[43,47,50],[48,52,55],[45,48,52],[53,57,60],[43,47,50]];
export class AudioDirector {
  constructor(){this.ctx=null;this.muted=false;this.musicVolume=.48;this.fxVolume=.65;this.act=0;this.running=false;this.step=0;this.timer=null;}
  async unlock(){
    if(!this.ctx){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain();this.master.gain.value=.7;
      const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=5;
      this.master.connect(comp);comp.connect(this.ctx.destination);
      this.music=this.ctx.createGain();this.music.connect(this.master);
      this.fx=this.ctx.createGain();this.fx.connect(this.master);
      this.delay=this.ctx.createDelay(.5);this.delay.delayTime.value=.208;
      const feedback=this.ctx.createGain();feedback.gain.value=.13;
      this.delay.connect(feedback);feedback.connect(this.delay);this.delay.connect(this.music);
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=buffer.getChannelData(0);
      let seed=9876;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/2147483647)*2-1;}this.noiseBuffer=buffer;
    }
    this.volumes();await this.ctx.resume();
  }
  volumes(){if(!this.ctx)return;this.master.gain.setTargetAtTime(this.muted?0:.7,this.ctx.currentTime,.04);this.music.gain.value=this.musicVolume;this.fx.gain.value=this.fxVolume;}
  note(midi,time,dur=.16,vol=.12,type='triangle',bus=this.music){
    if(!midi)return;
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.value=440*2**((midi-69)/12);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol,time+.008);gain.gain.exponentialRampToValueAtTime(.001,time+dur);
    osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+dur+.02);
    if(type==='triangle'&&bus===this.music){const echo=this.ctx.createGain();echo.gain.value=.13;gain.connect(echo);echo.connect(this.delay);}
  }
  noise(time,dur,volume,freq){const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=this.noiseBuffer;f.type='highpass';f.frequency.value=freq;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.001,time+dur);n.connect(f);f.connect(g);g.connect(this.music);n.start(time);n.stop(time+dur);}
  kick(t){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(this.music);o.start(t);o.stop(t+.2);}
  schedule(step,t){
    const bar=Math.floor(step/8),e=step%8,chord=CHORDS[bar%8];
    const melody=MELODY[(bar+(this.act===2?8:0))%16][e];
    this.note(melody+(this.act===1?12:0),t,.19,.13,'triangle');
    if(melody)this.note(melody+12,t,.13,.028,'sine');
    if(e%2===0){this.note(chord[e===4?2:0]-12,t,.23,.22,'triangle');if(e===0||e===4)this.kick(t);}
    if(e===2||e===6){chord.forEach(n=>this.note(n+12,t,.11,.033,'sawtooth'));this.noise(t,.09,.13,1400);}
    this.noise(t,.025,e%2?.045:.025,6500);
    if(this.act>0&&e%2)this.note(chord[(e-1)%3]+24,t,.12,.038,'sine');
  }
  start(){if(!this.ctx)return;this.stop();this.running=true;this.next=this.ctx.currentTime+.08;this.step=0;this.timer=setInterval(()=>{
    if(this.ctx.state!=='running')return;
    while(this.next<this.ctx.currentTime+.12){this.schedule(this.step,this.next);this.next+=(60/144)*(this.step%2?.44:.56);this.step++;}
  },25);}
  stop(){clearInterval(this.timer);this.timer=null;this.running=false;}
  suspend(){this.stop();if(this.ctx)this.ctx.suspend();}
  effect(name){
    if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime;
    const seq={jump:[72,79],star:[88],clear:[79,84,88],perfect:[84,88,91],trick:[76,83,88],hit:[48,43,36],act:[72,76,79,84],win:[72,76,79,84,79,84,88,91],lose:[64,60,57,48]}[name]||[];
    seq.forEach((n,i)=>this.note(n,t+i*.07,name==='hit'?.20:.13,.16,name==='hit'?'sawtooth':'sine',this.fx));
  }
}
