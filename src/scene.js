import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {PLAYER_X} from './game.js';

function batchModel(source) {
  source.updateMatrixWorld(true);const materials=new Map();
  source.traverse(o=>{
    if(!o.isMesh)return;
    const key=o.material.uuid;
    if(!materials.has(key))materials.set(key,{material:o.material,geometries:[]});
    const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    // glTF creates UVs only on some primitives: normalize before merging.
    for(const name of Object.keys(g.attributes))if(!['position','normal'].includes(name))g.deleteAttribute(name);
    materials.get(key).geometries.push(g);
  });
  const group=new THREE.Group();
  for(const {material,geometries} of materials.values()){
    const geo=mergeGeometries(geometries,false);const mesh=new THREE.Mesh(geo,material);
    mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);geometries.forEach(g=>g.dispose());
  }
  return group;
}

export class Stage {
  constructor(container){
    this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#efd4a5');
    this.scene.fog=new THREE.Fog('#efd4a5',36,85);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    container.appendChild(this.renderer.domElement);
    this.camera=new THREE.OrthographicCamera(-15,15,9,-9,.1,120);
    this.camera.position.set(7,7.5,19);this.camera.lookAt(2,2.2,0);
    this.scene.add(new THREE.HemisphereLight('#fff3d0','#77503b',2.6));
    const sun=new THREE.DirectionalLight('#fff1cd',3.3);sun.position.set(-6,12,9);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-25,right:25,top:18,bottom:-15,near:1,far:55});
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;
    this.scene.add(sun);this.sun=sun;
    const rim=new THREE.DirectionalLight('#ffd29c',1.5);rim.position.set(8,9,-7);this.scene.add(rim);
    this.fill=new THREE.DirectionalLight('#b9ffed',.7);this.fill.position.set(0,5,15);this.scene.add(this.fill);
    this.models={};this.hazards=new Map();this.collectibles=new Map();this.particles=[];this.mode='menu';this.time=0;this.shake=0;this.reduced=false;
    this.particleGeo=new THREE.BoxGeometry(.07,.12,.025);this.particleMats=['#f9c35c','#dc482f','#2c9d91','#fff0cb'].map(color=>new THREE.MeshBasicMaterial({color}));
    this.resize();window.addEventListener('resize',()=>this.resize());
  }
  async load(){
    const loader=new GLTFLoader();
    await Promise.all(['arena','lion','acrobat','hoop','barrel','star'].map(async name=>{
      const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`);this.models[name]=batchModel(gltf.scene);
    }));
    this.scene.add(this.models.arena);
    // Center the barrel once; instances share immutable geometry throughout a run.
    this.models.barrel.children.forEach(c=>c.geometry.translate(0,-.57,0));
    this.player=new THREE.Group();this.scene.add(this.player);
    this.lion=this.models.lion.clone();this.acrobat=this.models.acrobat.clone();
    this.player.add(this.lion,this.acrobat);this.acrobat.visible=false;
    this.demoHoop=this.models.hoop.clone();this.demoHoop.position.set(10,0,-1);this.demoHoop.scale.setScalar(1.4);this.demoHoop.rotation.y=-.25;this.scene.add(this.demoHoop);
    this.demoBarrel=this.models.barrel.clone();this.demoBarrel.position.set(2,.57,-2.5);this.scene.add(this.demoBarrel);
    this.floorMarks=[];
    for(let i=0;i<18;i++){const mark=new THREE.Mesh(new THREE.RingGeometry(.12,.15,5),new THREE.MeshBasicMaterial({color:'#f5d7a2',transparent:true,opacity:.55}));mark.rotation.x=-Math.PI/2;mark.position.set(i*2-16,.09,1.1);this.scene.add(mark);this.floorMarks.push(mark);}
    this.shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:'#442e1b',transparent:true,opacity:.15,depthWrite:false}));
    this.shadow.rotation.x=-Math.PI/2;this.shadow.scale.set(1.2,.5,1);this.scene.add(this.shadow);
    this.loaded=true;this.container.dataset.loaded='true';
  }
  resize(){
    const w=window.innerWidth,h=window.innerHeight;this.renderer.setSize(w,h);this.aspect=w/h;
    // Portrait retains enough horizontal runway to see incoming obstacles.
    const width=this.mode==='menu'?(this.aspect<.85?24:this.aspect<1.3?28:31):(this.aspect<.85?20:25);
    this.camera.left=-width/2;this.camera.right=width/2;this.camera.top=width/this.aspect/2;this.camera.bottom=-width/this.aspect/2;this.camera.updateProjectionMatrix();
  }
  quality(low){this.renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=!low;this.resize();}
  setMode(mode){this.mode=mode;this.demoHoop.visible=mode==='menu';this.demoBarrel.visible=mode==='menu';this.clearObjects();this.resize();}
  clearObjects(){for(const map of [this.hazards,this.collectibles]){map.forEach(m=>this.scene.remove(m));map.clear();}}
  burst(x,y,count=16){
    if(this.reduced)return;
    for(let i=0;i<count;i++){
      const mesh=new THREE.Mesh(this.particleGeo,this.particleMats[i%4]);mesh.position.set(x,y,.5);
      const velocity=new THREE.Vector3((Math.random()-.5)*4,2+Math.random()*4,(Math.random()-.5)*3);
      this.scene.add(mesh);this.particles.push({mesh,velocity,life:1+Math.random()*.5});
    }
  }
  updateObjects(game){
    const ids=new Set(game.obstacles.map(o=>o.id));
    for(const [id,m] of this.hazards){if(!ids.has(id)){this.scene.remove(m);this.hazards.delete(id);}}
    for(const o of game.obstacles){
      let mesh=this.hazards.get(o.id);
      if(!mesh){mesh=this.models[o.type].clone();if(o.type==='hoop')mesh.rotation.y=-.3;this.hazards.set(o.id,mesh);this.scene.add(mesh);}
      mesh.position.set(o.x,0,0);
      if(o.type==='barrel'){mesh.rotation.z=-o.x*1.1;mesh.position.y=.57;}
      if(o.type==='hoop'&&!this.reduced)mesh.scale.setScalar(1+Math.sin(this.time*9)*.006);
    }
    const starIds=new Set(game.stars.map(s=>s.id));
    for(const [id,m] of this.collectibles){if(!starIds.has(id)){this.scene.remove(m);this.collectibles.delete(id);}}
    for(const s of game.stars){let mesh=this.collectibles.get(s.id);if(!mesh){mesh=this.models.star.clone();this.scene.add(mesh);this.collectibles.set(s.id,mesh);}mesh.position.set(s.x,s.y,.35);mesh.rotation.y=this.reduced?0:this.time*2;}
  }
  frame(dt,game){
    this.time+=dt;if(!this.loaded)return;
    const menu=this.mode==='menu';const t=this.time;
    const targetPos=menu?new THREE.Vector3(7,7.5,19):new THREE.Vector3(1.5,5.2,20);
    const look=menu?new THREE.Vector3(2,2.2,0):new THREE.Vector3(1,2.2,0);
    this.camera.position.lerp(targetPos,Math.min(1,dt*3));this.camera.lookAt(look);
    if(this.shake>0&&!this.reduced){this.camera.position.x+=(Math.random()-.5)*this.shake;this.shake=Math.max(0,this.shake-dt*2);}
    this.player.position.set(menu?5:PLAYER_X,menu?0:game.y,0);
    const scale=menu?1.9:.72;this.player.scale.setScalar(scale);
    this.lion.visible=menu||game.act!==1;this.acrobat.visible=!this.lion.visible;
    const active=menu||game.status==='playing';
    if(active&&!this.reduced){
      this.player.position.y+=Math.abs(Math.sin(t*(menu?2:13)))*(menu?.06:.035);
      this.player.rotation.z=menu?Math.sin(t*1.7)*.016:game.flipping?-Math.min(1,game.flipTime/.48)*Math.PI*2:Math.sin(t*13)*.018;
    }else this.player.rotation.z=0;
    this.player.visible=menu||game.invincible<=0||Math.floor(game.invincible*10)%2===0;
    this.shadow.position.set(this.player.position.x,.09,0);this.shadow.material.opacity=.16/(1+game.y*.5);this.shadow.scale.set(1.2+game.y*.2,.5,1);
    if(!menu)this.updateObjects(game);
    for(const mark of this.floorMarks){mark.visible=!menu;if(!menu&&game.status==='playing'){mark.position.x-=game.speed*dt;if(mark.position.x<-17)mark.position.x+=36;}}
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.velocity.y-=7*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*4;p.mesh.rotation.z+=dt*3;if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);}}
    this.renderer.render(this.scene,this.camera);
  }
}
