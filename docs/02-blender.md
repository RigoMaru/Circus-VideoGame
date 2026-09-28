# Stage 02 — Original Blender assets

Created with Blender 5.2.1 using `art/build_assets.py`; the editable source is `art/cirque.blend`.

## Modeling sequence
1. Establish the palette as reusable named physically based materials: porcelain cream, vermilion, lagoon, brass, marigold, burnt-orange mane and warm emissive bulbs.
2. Build the lion from smooth ellipsoids, rounded paws, layered mane curls, a cream muzzle, eyes and a brass-trimmed saddle.
3. Construct the acrobat: mitten hands, boots, jacket, ruff, face, nose, hair, conical hat and buttons. Reuse the sculpt on a striped balance ball.
4. Model an elevated torus hoop with emissive flame shapes, an inner luminous rim and a weighted stand. Model a barrel with brass hoops, cream staves and a star badge.
5. Create the big top: stage planks, oval carpet and trim, striped canvas panels, roof wedges, curtain entrance, crest, poles, stands, audience, suspended stars, festoon bulbs and balloons.
6. Export each collection at its own origin to GLB. Save the full editable scene with a presentation camera and area lights. Render `art/blender-stage.png` using Cycles.

## Runtime asset map
| File | Use |
| --- | --- |
| arena.glb | Main stage and scenery |
| lion.glb | Original lion + rider in acts 1 and 3 |
| acrobat.glb | Acrobat on a ball in act 2 |
| hoop.glb | Fire-ring obstacle |
| barrel.glb | Rolling obstacle |
| star.glb | Collectible score pickup |

Materials and geometry are batched by material on load to reduce draw calls. Instances share immutable geometry; barrel geometry is centered once before cloning. The hero is animated as a toy-like whole-body bounce and somersault, not with a skeletal rig.

The Blender render is a presentation artifact. The interactive game renders these actual meshes with Three.js and its own real-time lighting.
