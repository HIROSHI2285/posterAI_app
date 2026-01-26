import { DesignBlueprint, Layer, TextLayer, ImageLayer, ShapeLayer } from "./blueprint-types";

/**
 * Creates a Google Slide presentation from the DesignBlueprint.
 * Requires a valid Google Access Token with 'https://www.googleapis.com/auth/presentations' scope.
 */
/**
 * Uploads a base64 image to Google Drive and returns a usable URL.
 */
async function uploadImageToDrive(base64Data: string, accessToken: string): Promise<string> {
    const metadata = {
        name: 'PosterAI_Asset_' + Date.now() + '.png',
        mimeType: 'image/png',
        parents: [] // Upload to root or specific folder
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    // Strip header if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: image/png\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        cleanBase64 +
        close_delim;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Failed to upload image to Drive: ${err.error?.message || 'Unknown error'}`);
    }

    const file = await res.json();

    // We need the webContentLink or thumbnailLink or similar that is accessible.
    // However, for Slides API to access it, usually the file needs to be shared or the efficient way is actually using the ID?
    // The Slides API can use a Drive ID format sometimes, but URL is standard.
    // Let's get the 'webContentLink' via a get call if not returned, usually creation returns id.

    // We need to fetch file fields to get the link
    const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?fields=webContentLink,thumbnailLink`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const fileData = await getRes.json();
    return fileData.webContentLink; // This link is usually downloadable.
}

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

    const requests: any[] = [];
    const layers = [...blueprint.layers].sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    for (const layer of layers) {
        const elementId = `gen_${Math.random().toString(36).substr(2, 9)}`;
        const scale = 0.75; // PX to PT

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

            requests.push({
                insertText: {
                    objectId: elementId,
                    text: textLayer.content,
                    insertionIndex: 0
                }
            });

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
            let imageUrl = imageLayer.src;

            // Handle Base64: Upload to Drive
            if (imageUrl.startsWith('data:image')) {
                try {
                    // console.log("Uploading image to Drive...", layer.id);
                    imageUrl = await uploadImageToDrive(imageUrl, accessToken);
                } catch (upErr) {
                    console.error("Failed to upload image layer:", upErr);
                    // Fallback to placeholder handled below if url is still data:
                }
            }

            if (imageUrl.startsWith('http')) {
                requests.push({
                    createImage: {
                        objectId: elementId,
                        url: imageUrl,
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
                console.warn("Skipping image layer (Upload failed or invalid URL):", layer.id);
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
                        text: "[Image Placeholder - Upload Failed]",
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
            // console.error("Batch update failed:", err);
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
