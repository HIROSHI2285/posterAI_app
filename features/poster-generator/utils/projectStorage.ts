import { PosterProject } from "../types/poster";

/**
 * Downloads the project as a JSON file.
 */
/**
 * Downloads the project as a JSON file.
 * Uses File System Access API if available to allow "Save As" dialog.
 */
export async function exportProject(project: PosterProject) {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const safeTitle = (project.meta.title || 'poster-project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const suggestedName = `${safeTitle}.json`;

    try {
        // @ts-ignore - File System Access API types might not be fully available
        if (window.showSaveFilePicker) {
            // Use File System Access API
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [{
                    description: 'Poster Project JSON',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        }
    } catch (err: any) {
        // User cancelled or API not supported/failed
        if (err.name === 'AbortError') {
            return; // User cancelled
        }
        console.warn('File System Access API failed, falling back to download:', err);
    }

    // Fallback for browsers without support or on error
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Parses and verifies a JSON file as a PosterProject.
 */
export async function importProject(file: File): Promise<PosterProject> {
    const text = await file.text();
    let data: any;

    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON file");
    }

    // Basic Schema Validation
    if (!data.version || !data.canvas || !Array.isArray(data.layers)) {
        throw new Error("Invalid project file format: Missing required fields");
    }

    // TODO: Add more rigorous Zod validation if needed

    return data as PosterProject;
}

/**
 * Helper to normalize coordinates (pixel -> 0-1000 scale)
 */
export function normalizePosition(
    val: number,
    maxVal: number
): number {
    if (maxVal === 0) return 0;
    return Math.round((val / maxVal) * 1000);
}

/**
 * Helper to denormalize coordinates (0-1000 scale -> pixel)
 */
export function denormalizePosition(
    normVal: number,
    maxVal: number
): number {
    return (normVal / 1000) * maxVal;
}
