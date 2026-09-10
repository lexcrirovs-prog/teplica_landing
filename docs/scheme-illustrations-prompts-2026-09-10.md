# Иллюстрации схемы — 2026.09.10.4

10.09.2026. OpenAI Codex (GPT-6). Навык ImageGen, встроенный режим image_gen.

Новые растровые иллюстрации по предоставленным пользователем фотографиям и чертежу. Геометрия котла используется только как стилистический ориентир. Исходные документы не изменялись.

Для сайта выполнены только пропорциональное уменьшение и кодирование WebP. У теплицы сохранён alpha; конденсор использует светлый фон, близкий к фону схемы. Масштаб и расположение патрубков условные.

## Конденсор — исходный запрос

```text
Use case: stylized-concept.
Asset type: isolated industrial equipment illustration for an interactive greenhouse-boiler process diagram.

Create ONE NEW 3D schematic illustration of a flue-gas condenser. The attached images are references only, not edit targets.
Image 1 is the primary construction reference: the general-arrangement drawing of a vertical gas condenser. Follow the recognizable arrangement of its cabinet, tapered top exhaust transition, side gas inlet, bolted heat exchanger panel, water connection flanges, lower inspection hatch and supporting legs.
Image 2 is a supporting reference for realistic fabricated steel details, exchanger cassette, stiffeners, round flange connections and industrial construction. Do not copy its factory background.
Image 3 is STYLE ONLY: match this existing CAD-rendered boiler's understated matte light grey steel, dark graphite front surfaces, restrained details, soft studio shading and orthographic engineering presentation. DO NOT include a boiler, cylindrical boiler body, or any part of image 3's actual object.

Subject: one tall rectangular grey steel condenser cabinet supported on four narrow straight legs. On top is a truncated pyramidal transition to one short vertical rectangular flue-gas outlet. On the LEFT side of the composition in the lower half of the cabinet, show a large short horizontal flue-gas inlet with an industrial flange and a simple visible damper linkage. Orienting the inlet left is a schematic layout adaptation from the drawing. On the forward-facing large cabinet face, include a bolted rectangular heat exchanger access panel with two round water pipe flanges vertically separated near its upper and lower portions; below that panel is one large circular inspection hatch. Add a small condensate drain stub below the cabinet. Make the forms readable and believable without excessive pipes or extra invented apparatus.

Composition: front-left orthographic three-quarter view, with cabinet depth receding towards the right; slight view down onto its top. Whole object fully visible, no cropping. Landscape canvas approximately 10:7. A single vertically proportioned object centered, occupying most of the height with only small margins. Keep its silhouette and large details clean and readable when reduced to 180 pixels tall in a website diagram.
Style: crisp simplified 3D engineering render, subtle realistic ambient occlusion, soft top-left illumination. Matte neutral light steel grey panels, slightly darker structural frame and recesses, no colored highlights.
Background: genuinely TRANSPARENT alpha background, no opaque backdrop and no checkerboard pattern. No floor plane, no cast ground shadow, no environment.
Text: none.
Avoid: text, labels, lettering, numbers, arrows, logos, watermarks, humans, factories, boiler shape, photo collage, overly shiny chrome, dramatic lighting, cartoon outlines, exploded parts. This is a new illustrative depiction guided by references, not a certified dimensioned engineering model.
```

## Конденсор — финальная коррекция фона

```text
Use case: precise-object-edit. Edit target: this condenser illustration. Change ONLY the background. Replace the entire grey-and-white checkerboard with ONE completely flat, uniform, pale grey background color #F7F9FA (RGB 247, 249, 250). Fill all surrounding space and every opening between and behind the legs with that exact solid colour. This is intentionally an opaque RGB image, NOT a transparent image. Absolutely no checkerboard or alternating squares anywhere. No gradient, no floor, no backdrop texture, no ground shadow. Preserve the condenser exactly: same cabinet geometry, all pipes and flanges, grey materials, light, viewpoint, bolts, framing and scale. The single condenser stays untouched. The only change is a clean flat background, exact #F7F9FA.
```

## Теплица — выбранный финальный запрос

```text
Create a standalone schematic 3D product illustration of a commercial glass greenhouse on a TRANSPARENT BACKGROUND, exported as a transparent PNG with alpha. There must be THREE CONNECTED GABLE-ROOF BAYS across the front facade: count three triangular front gables in a row, each bay with its own long pitched roof. Simple coherent architecture with a rectangular footprint. A few neat rows of muted green plants visible behind pale glass. Use subject architecture from the first two reference photographs. Use only the material style and camera angle of the third reference image of the boiler: matte CAD-like industrial illustration, cool white and steel-grey, soft studio lighting, crisp edges, restrained surface detail. The boiler is not part of the output. Orthographic three-quarter view from above: the three-gable front end is toward lower left, the length of the greenhouse recedes to upper right. Entire greenhouse visible, small clear padding, landscape composition. Steel-grey frame mullions thick enough for readability at 220px display width, cool translucent pale glass, soft shadowing contained inside the object. No text or labels. The greenhouse is isolated, with no scenery, no ground plane, no background graphics or solid background color. Maintain real alpha transparency outside the entire silhouette.
```
