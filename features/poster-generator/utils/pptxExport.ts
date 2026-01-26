import PptxGenJS from "pptxgenjs";
import { DesignBlueprint, Layer, TextLayer, ImageLayer, ShapeLayer } from "./blueprint-types";

/**
 * Converts a DesignBlueprint into a downloadable PowerPoint file.
 */
export async function exportPosterToPptx(blueprint: DesignBlueprint) {
    const pres = new PptxGenJS();

    // 1. Setup Slide
    // Determine layout based on dimensions. Defaulting to A4 if close, or custom.
    const layoutName = determineLayoutName(blueprint.dimensions.width, blueprint.dimensions.height);
    if (layoutName === 'CUSTOM') {
        // PptxGenJS uses inches mainly. Convert px to inches assuming 96DPI or provided unit.
        const w = convertToInches(blueprint.dimensions.width, blueprint.dimensions.unit);
        const h = convertToInches(blueprint.dimensions.height, blueprint.dimensions.unit);
        pres.defineLayout({ name: 'CUSTOM_POSTER', width: w, height: h });
        pres.layout = 'CUSTOM_POSTER';
    } else {
        pres.layout = layoutName;
    }

    const slide = pres.addSlide();

    // 2. Background
    if (blueprint.background.type === 'solid') {
        slide.background = { color: blueprint.background.value.replace('#', '') };
    } else if (blueprint.background.type === 'image') {
        // NOTE: PptxGenJS handles base64 or URL
        slide.background = { path: blueprint.background.value };
    }

    // 3. Process Layers
    // Sort layers by z-index if provided, otherwise assume array order.
    const layers = [...blueprint.layers].sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    for (const layer of layers) {
        await addLayerToSlide(slide, layer, blueprint.dimensions);
    }

    // 4. Save
    // Browser download
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `poster_export_${date}.pptx`;
    await pres.writeFile({ fileName });
}

async function addLayerToSlide(slide: PptxGenJS.Slide, layer: Layer, canvasDim: { width: number, height: number, unit: string }) {
    // Convert Position & Size to Inches/Percentages for PptxGenJS
    // We'll use percentage positioning for best responsiveness if canvas size differs slightly
    // Or plain inches if we are confident. Let's use Inches based on 96DPI assumption for 'px'.

    // X, Y, W, H
    const x = convertToInches(layer.position.x, 'px');
    const y = convertToInches(layer.position.y, 'px');
    const w = convertToInches(layer.size.width, 'px');
    const h = convertToInches(layer.size.height, 'px');

    if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        slide.addText(textLayer.content, {
            x, y, w, h,
            fontSize: textLayer.style.fontSize * 0.75, // pt conversion approx (px * 0.75 = pt)
            color: textLayer.style.color.replace('#', ''),
            fontFace: mapFont(textLayer.style.fontFamily),
            bold: textLayer.style.fontWeight === 'bold' || textLayer.style.fontWeight === '700',
            align: textLayer.style.textAlign || 'left',
            // rotation: textLayer.rotation, // PptxGenJS supports rotate in degrees
        });
    } else if (layer.type === 'image') {
        const imageLayer = layer as ImageLayer;
        slide.addImage({
            path: imageLayer.src,
            x, y, w, h,
            // rotate: imageLayer.rotation 
        });
    } else if (layer.type === 'shape') {
        const shapeLayer = layer as ShapeLayer;
        // Basic shape mapping
        if (shapeLayer.shapeType === 'rect') {
            slide.addShape(pres.ShapeType.rect, {
                x, y, w, h,
                fill: { color: shapeLayer.fill.color?.replace('#', '') || 'FFFFFF' }
            });
        }
    }
}

// Helpers
const pres = new PptxGenJS(); // Instance for accessing constants if needed? Actually mostly static or instance based.

function determineLayoutName(width: number, height: number): 'LAYOUT_16x9' | 'LAYOUT_4x3' | 'LAYOUT_16x10' | 'LAYOUT_WIDE' | 'CUSTOM' {
    // Simple heuristic. Return CUSTOM for now to be safe with posters.
    return 'CUSTOM';
}

function convertToInches(value: number, unit: string): number {
    if (unit === 'in') return value;
    if (unit === 'pt') return value / 72;
    // Default px (assuming 96dpi)
    return value / 96;
}

function mapFont(fontFamily: string): string {
    const lower = fontFamily.toLowerCase();
    if (lower.includes('serif')) return 'Times New Roman';
    if (lower.includes('mono')) return 'Courier New';
    return 'Arial'; // Default safe font
}
