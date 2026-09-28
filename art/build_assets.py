"""CIRQUE — reproducible original Blender assets. Run with Blender --background --python."""
import bpy, math, os, random
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(17)

def mat(name, color, metal=0, rough=.45, glow=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if glow:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = glow
    return m

cream=mat('Warm porcelain',(.96,.83,.60))
red=mat('Vermilion enamel',(.79,.055,.035))
pink=mat('Blush',(.96,.30,.26))
teal=mat('Lagoon enamel',(.035,.39,.37))
dark=mat('Midnight teal',(.018,.075,.08))
gold=mat('Brushed brass',(.98,.54,.12),.45)
yellow=mat('Lion marigold',(.98,.55,.12))
mane=mat('Burnt orange mane',(.68,.19,.055))
white=mat('Ivory',(.98,.94,.80))
black=mat('Ink',(.012,.024,.025))
bulb=mat('Warm bulbs',(1,.70,.25),0,.3,3)
flame=mat('Amber flame',(1,.20,.015),0,.3,2)
wood=mat('Maple stage',(.43,.20,.085))

def finish(o,name,material):
    o.name=name
    o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth=True
    return o

def uv(name, loc, scale, material, seg=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=10, location=loc)
    o=bpy.context.object
    o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material)

def cube(name, loc, scale, material, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(o,name,material)
    if bevel:
        b=o.modifiers.new('Soft toy edges','BEVEL');b.width=bevel;b.segments=3
        bpy.context.view_layer.objects.active=o
        bpy.ops.object.modifier_apply(modifier=b.name)
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def cylinder(name,loc,radius,depth,material,vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    return finish(bpy.context.object,name,material)

def cone(name,loc,r1,r2,depth,material):
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=r1,radius2=r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,material)

def torus(name,loc,major,minor,material,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,location=loc,major_radius=major,minor_radius=minor,rotation=rotation)
    return finish(bpy.context.object,name,material)

def line(name,a,b,r,material):
    d=Vector(b)-Vector(a);o=cylinder(name,(Vector(a)+Vector(b))/2,r,d.length,material,12)
    o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o

def mesh(name,vs,fs,material):
    m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update()
    o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o

def star(name,loc,size,material):
    # Star in X/Z, with a little thickness.
    v=[]
    for y in [-.07,.07]:
        for i in range(10):
            a=math.pi/2+i*math.pi/5;r=size*(1 if i%2==0 else .46)
            v.append((loc[0]+math.cos(a)*r,loc[1]+y,loc[2]+math.sin(a)*r))
    f=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    return mesh(name,v,f,material)

groups={}
def begin(name):
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c)
    layer=bpy.context.view_layer.layer_collection.children[c.name]
    bpy.context.view_layer.active_layer_collection=layer
    groups[name]=c

def clown(z=0):
    uv('Jacket',(-.10,0,z+.54),(.31,.24,.4),teal)
    for side in [-1,1]:
        uv('Sleeve',(-.10,side*.33,z+.61),(.19,.18,.17),red)
        uv('Mitten',(.08,side*.41,z+.54),(.12,.12,.12),white)
        uv('Boot',(.14,side*.23,z+.13),(.26,.13,.13),red)
        line('Trousers',(-.13,side*.18,z+.33),(.01,side*.23,z+.18),.12,cream)
    uv('Ruff',(-.04,0,z+.91),(.36,.30,.10),white)
    uv('Face',(-.01,0,z+1.15),(.29,.27,.29),cream)
    for side in [-1,1]:
        uv('Hair tuft',(-.12,side*.26,z+1.16),(.16,.11,.19),mane)
        uv('Eye',(.215,side*.125,z+1.22),(.036,.040,.057),black)
        uv('Blush',(.22,side*.19,z+1.09),(.042,.055,.05),pink)
    uv('Red nose',(.29,0,z+1.14),(.105,.105,.105),red)
    cone('Pointy hat',(-.06,0,z+1.60),.24,0,.55,red)
    torus('Hat band',(-.06,0,z+1.36),.215,.036,gold)
    uv('Hat pom',(-.06,0,z+1.90),(.075,.075,.075),gold)
    for h in [.46,.63,.79]:uv('Jacket button',(.20,0,z+h),(.048,.048,.048),gold)

begin('lion')
uv('Body',(-.15,0,.74),(.82,.38,.41),yellow)
uv('Belly',(-.02,-.01,.57),(.62,.31,.25),cream)
for x in [-.64,.40]:
    for y in [-.26,.26]:
        uv('Leg', (x,y,.33),(.17,.16,.32),yellow)
        uv('Paw',(x+.08,y,.13),(.25,.20,.13),cream)
uv('Mane',(.66,0,1.02),(.49,.48,.54),mane)
for i in range(10):
    a=i*math.tau/10
    uv('Mane curl',(.57,math.cos(a)*.4,1.02+math.sin(a)*.46),(.20,.17,.17),mane)
uv('Lion face',(.91,0,1.06),(.36,.33,.36),yellow)
for y in [-.18,.18]:
    uv('Ear',(.64,y*2,1.42),(.13,.12,.16),yellow)
    uv('Lion eye',(1.18,y,1.18),(.038,.045,.055),black)
    uv('Muzzle',(1.2,y*.6,.94),(.20,.15,.14),cream)
uv('Lion nose',(1.38,0,1.03),(.07,.085,.07),mane)
line('Tail',(-.84,0,.8),(-1.2,.04,1.12),.045,yellow)
uv('Tail tuft',(-1.23,.04,1.14),(.15,.09,.11),mane)
cube('Saddle',(-.20,0,1.11),(.60,.68,.13),red)
clown(1.15)

begin('acrobat')
clown(.95)
uv('Balance ball',(0,0,.49),(.50,.50,.50),teal,24)
torus('Ball stripe',(0,0,.49),.494,.032,gold,(math.pi/2,0,0))
torus('Ball stripe 2',(0,0,.49),.494,.032,cream,(0,math.pi/2,0))
star('Ball star',(0,-.51,.49),.20,gold)

begin('hoop')
torus('Fire ring',(0,0,2.75),1.43,.095,gold,(math.pi/2,0,0))
torus('Luminous inner edge',(0,-.035,2.75),1.31,.027,bulb,(math.pi/2,0,0))
for i in range(24):
    a=i*math.tau/24
    x=math.cos(a)*1.48;z=2.75+math.sin(a)*1.48
    uv('Flame', (x,0,z),(.105,.095,.18),flame,12)
    uv('Flame heart',(x,-.045,z+.04),(.052,.06,.12),bulb,12)
line('Ring stand',(0,0,0),(0,0,1.26),.05,gold)
cone('Ring foot',(0,0,.09),.35,.22,.18,red)

begin('barrel')
o=cylinder('Barrel',(0,0,.57),.56,.85,teal);o.rotation_euler[0]=math.pi/2
for y in [-.40,.40]:torus('Brass hoop',(0,y,.57),.535,.045,gold,(math.pi/2,0,0))
star('Barrel star',(0,-.46,.57),.31,cream)
for i in range(12):
    a=i*math.tau/12
    line('Stave',(math.cos(a)*.558,-.4,.57+math.sin(a)*.558),(math.cos(a)*.558,.4,.57+math.sin(a)*.558),.013,cream)

begin('star')
star('Collectible',(0,0,0),.29,gold)

begin('arena')
cube('Stage foundation',(0,1,-.47),(64,18,.80),wood,.12)
cube('Velvet edge',(0,-7.95,-.32),(64,.16,.48),red,.02)
cube('Stage surface',(0,1,-.04),(64,18,.10),cream,.01)
for x in range(-31,33,2): cube('Stage seam',(x,1,.015),(.012,18,.012),gold,0)
o=cylinder('Oval ring carpet',(0,1,.028),1,.04,red,96);o.scale=(19,5.9,1)
o=torus('Carpet gold trim',(0,1,.07),1,.009,gold);o.scale=(18.4,5.5,1)
o=torus('Carpet ivory trim',(0,1,.071),1,.008,cream);o.scale=(18,5.2,1)
# Rear canvas wall and soaring alternating roof wedges.
for i in range(26):
    x=-32+i*2.5
    cube('Canvas stripe',(x,10,4.0),(2.5,.18,8),red if i%2==0 else cream,0)
    mesh('Roof stripe',[(x-1.25,10,8),(x+1.25,10,8),(x+1.25,-6,10),(x-1.25,-6,10),(x,4,17)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],red if i%2==0 else cream)
    uv('Scalloped valance',(x,8.8,7.3),(1.4,.18,.72),red)
for x in [-24,-12,12,24]:
    cylinder('Tent pole',(x,7,4.4),.13,8.8,gold)
    uv('Pole finial',(x,7,8.85),(.27,.27,.32),gold)
    star('Hanging star',(x+1.3,7,6.15),.48,gold)
    line('Star string',(x+1.3,7,6.6),(x+1.3,7,8),.015,gold)
# Grand entrance with a round illuminated crest.
cube('Entrance frame',(0,9,2.65),(6,.5,5.3),gold,.15)
cube('Entrance shadow',(0,8.65,2.6),(5.6,.4,5),dark,.1)
for x in [-2.15,2.15]:
    for j in range(5):uv('Gathered velvet',(x+(j-2)*.23,8.25,2.5),(.26,.28,2.45),red)
torus('Entrance crest',(0,8.3,5.5),1.3,.075,gold,(math.pi/2,0,0))
o=cylinder('Crest inset',(0,8.32,5.5),1.24,.08,teal,48);o.rotation_euler[0]=math.pi/2
star('Crest star',(0,8.20,5.5),.80,gold)
# Audience bleachers: stepped teal seats, stylized spectators.
for side in [-1,1]:
    for row in range(3):
        y=4.4+row*1.0;z=.6+row*.65
        cube('Bleacher',(side*13,y,z/2),(17,.9,z),teal,.07)
        cube('Seat lip',(side*13,y-.43,z),(17,.13,.14),gold,.02)
        for j in range(20):
            x=side*13-8+j*.83
            if random.random()<.14:continue
            m=random.choice([red,gold,teal,pink,white])
            uv('Audience body',(x,y,z+.24),(.20,.17,.25),m,12)
            uv('Audience head',(x,y,z+.59),(.15,.15,.17),random.choice([cream,yellow,mane]),12)
            if j%5==0:cone('Party hat',(x,y,z+.84),.15,0,.25,red)
# Two sagging strings of festoon bulbs, behind play space.
for y,base in [(3.8,6.5),(6,8.0)]:
    points=[]
    for i in range(65):
        x=-32+i;z=base+1.8*(abs(x)/32)**2
        points.append((x,y,z))
        if i%2==0:
            line('Bulb drop',(x,y,z),(x,y,z-.18),.022,dark)
            uv('Festoon bulb',(x,y,z-.25),(.095,.095,.13),bulb,12)
        if i>0:line('Festoon wire',points[-2],points[-1],.017,dark)
# Balloon bouquets and brass circus plinths.
for x in [-19,-8,8,19]:
    cone('Pedestal',(x,3,.45),.72,.58,.9,red)
    cylinder('Pedestal top',(x,3,.93),.64,.08,gold)
    star('Pedestal badge',(x,2.31,.48),.27,cream)
    if abs(x)==19:
        for j in range(3):
            bx=x+(j-1)*.55;bz=3.2+(j%2)*.6
            uv('Balloon',(bx,3.5,bz),(.38,.32,.5),[teal,red,gold][j])
            line('Balloon string',(x,3.5,1),(bx,3.5,bz-.5),.008,gold)
for x in range(-30,31):uv('Footlight',(x,-7.85,-.12),(.07,.07,.09),bulb,12)

# Each game asset is exported at its own origin. All remain editable in one blend.
for name,c in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in c.objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_apply=True)

# Presentation scene for the editable project / contact sheet.
for name,c in groups.items():
    if name in ['barrel','star','acrobat']:
        for o in c.objects:o.hide_render=True
    if name=='lion':
        for o in c.objects:o.location.x-=3.6
    if name=='hoop':
        for o in c.objects:o.location.x+=3.1
bpy.ops.object.camera_add(location=(10,-24,11))
camera=bpy.context.object;camera.name='Presentation camera'
camera.rotation_euler=(Vector((0,2,2.8))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=25;bpy.context.scene.camera=camera
for loc,energy,size in [((0,-8,12),2200,10),((-10,0,8),1600,8),((8,8,12),2600,8)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size
    l.rotation_euler=(Vector((0,0,0))-l.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene
scene.world.color=(.22,.22,.22)
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(ROOT,'art','blender-stage.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','cirque.blend'))
if '--render' in __import__('sys').argv:bpy.ops.render.render(write_still=True)
print('CIRQUE: exported six original Blender models and saved editable scene.')
