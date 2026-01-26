import { DesignBlueprint, Layer, TextLayer, ImageLayer, ShapeLayer } from "./blueprint-types";

/**
 * Creates a Google Slide presentation from the DesignBlueprint.
 * Requires a valid Google Access Token with 'https://www.googleapis.com/auth/presentations' scope.
 */
export async function createGoogleSlide(blueprint: DesignBlueprint, accessToken: string) {
    if (!accessToken) {
        throw new Error("Access token is required for Google Slides export");
    }

    // 1. Create Empty Presentation
    const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: blueprint.meta?.title || 'Poster Export'
        })
    });

    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(`Failed to create presentation: ${err.error?.message || 'Unknown error'}`);
    }

    const presentation = await createRes.json();
    const presentationId = presentation.presentationId;
    const pageId = presentation.slides[0].objectId; // Use the first slide

    // 2. Prepare Batch Update Requests
    const requests: any[] = [];

    // Set Page Size (Custom page size is limited in API, typically we assume standard)
    // If we want custom size, we might need to set it on create or update. 
    // Usually standard 16:9 or 4:3 is default.
    // For simplicity, we'll fit content into the default slide for now, 
    // or we assume user sets page setup separately.
    // (Changing page size is 'updatePageElementTransform' logic effectively or 'updatePageProperties' but limited support)

    // Clear existing elements on first slide (optional but clean)
    // We skip this for simplicity to avoid complexities with 'deleteObject' of unknown IDs.

    // Add Layers
    // Reverse layer order because we append to page (last added is on top)? 
    // Actually typically 'create' adds to Z-order top. 
    // So layers[0] (bottom) should be added first.
    const layers = [...blueprint.layers].sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    for (const layer of layers) {
        const elementId = `gen_${Math.random().toString(36).substr(2, 9)}`;

        // Scaling factor: Google Slides uses PT (points). 
        // 1 px (96dpi) = 0.75 pt. 
        // We assume blueprint dimensions are in PX.
        const scale = 0.75;

        const x_pt = { magnitude: layer.position.x * scale, unit: 'PT' };
        const y_pt = { magnitude: layer.position.y * scale, unit: 'PT' };
        const w_pt = { magnitude: layer.size.width * scale, unit: 'PT' };
        const h_pt = { magnitude: layer.size.height * scale, unit: 'PT' };

        if (layer.type === 'text') {
            const textLayer = layer as TextLayer;
            requests.push({
                createShape: {
                    objectId: elementId,
                    shapeType: 'RECTANGLE',
                    elementProperties: {
                        pageObjectId: pageId,
                        size: { width: w_pt, height: h_pt },
                        transform: {
                            scaleX: 1, scaleY: 1,
                            translateX: x_pt.magnitude,
                            translateY: y_pt.magnitude,
                            unit: 'PT'
                        }
                    }
                }
            });

            // Insert Text
            requests.push({
                insertText: {
                    objectId: elementId,
                    text: textLayer.content,
                    insertionIndex: 0
                }
            });

            // Style Text
            requests.push({
                updateTextStyle: {
                    objectId: elementId,
                    style: {
                        fontFamily: textLayer.style.fontFamily || 'Arial',
                        fontSize: { magnitude: (textLayer.style.fontSize || 16) * scale, unit: 'PT' },
                        foregroundColor: {
                            opaqueColor: {
                                rgbColor: hexToRgb(textLayer.style.color)
                            }
                        },
                        bold: textLayer.style.fontWeight === 'bold'
                    },
                    textRange: { type: 'ALL' },
                    fields: 'fontFamily,fontSize,foregroundColor,bold'
                }
            });

            // Remove border/fill of text box
            requests.push({
                updateShapeProperties: {
                    objectId: elementId,
                    shapeProperties: {
                        shapeBackgroundFill: { propertyState: 'NOT_RENDERED' },
                        outline: { propertyState: 'NOT_RENDERED' }
                    },
                    fields: 'shapeBackgroundFill,outline'
                }
            });

        } else if (layer.type === 'image') {
            const imageLayer = layer as ImageLayer;
            // Image requires a public URL. 
            // If it's base64, we CANNOT use Google Slides API directly without uploading to Drive first or having a public URL.
            // This is a major limitation for purely client-side or base64 flow.
            // WORKAROUND: For Phase 3 initial specific, we skip image unless it is a URL.
            if (imageLayer.src.startsWith('http')) {
                requests.push({
                    createImage: {
                        objectId: elementId,
                        url: imageLayer.src,
                        elementProperties: {
                            pageObjectId: pageId,
                            size: { width: w_pt, height: h_pt },
                            transform: {
                                scaleX: 1, scaleY: 1,
                                translateX: x_pt.magnitude,
                                translateY: y_pt.magnitude,
                                unit: 'PT'
                            }
                        }
                    }
                });
            } else {
                console.warn("Skipping image layer (Base64 not supported in direct Slides API call without Drive upload):", layer.id);
                // Placeholder
                requests.push({
                    createShape: {
                        objectId: elementId,
                        shapeType: 'RECTANGLE',
                        elementProperties: {
                            pageObjectId: pageId,
                            size: { width: w_pt, height: h_pt },
                            transform: {
                                scaleX: 1, scaleY: 1,
                                translateX: x_pt.magnitude,
                                translateY: y_pt.magnitude,
                                unit: 'PT'
                            }
                        }
                    }
                });
                requests.push({
                    insertText: {
                        objectId: elementId,
                        text: "[Image Placeholder]",
                    }
                });
            }
        }
    }

    if (requests.length > 0) {
        const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(`Failed to update presentation: ${err.error?.message || 'Unknown error'}`);
        }
    }

    return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

function hexToRgb(hex: string) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16) / 255,
        green: parseInt(result[2], 16) / 255,
        blue: parseInt(result[3], 16) / 255
    } : { red: 0, green: 0, blue: 0 };
}
