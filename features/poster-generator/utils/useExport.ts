import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { extractDesignBlueprint } from './blueprint-generator';
import { exportPosterToPptx } from './pptxExport';
import { createGoogleSlide } from './googleSlidesExport';

export function useExport() {
    const { data: session } = useSession();
    const [isExtracting, setIsExtracting] = useState(false);
    const [isExportingPptx, setIsExportingPptx] = useState(false);
    const [isExportingSlides, setIsExportingSlides] = useState(false);

    const handleExtractBlueprint = async (imageUrl: string | null) => {
        if (!imageUrl) return;
        try {
            setIsExtracting(true);
            console.log("Starting Blueprint Extraction...");
            const blueprint = await extractDesignBlueprint(imageUrl, []);
            console.log("Blueprint Extracted:", blueprint);
            alert("Blueprint extracted! Check console for JSON.");
        } catch (error) {
            console.error("Extraction failed:", error);
            alert("Extraction failed. See console.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleExportPptx = async (imageUrl: string | null) => {
        if (!imageUrl) return;
        try {
            setIsExportingPptx(true);
            const blueprint = await extractDesignBlueprint(imageUrl, []);
            await exportPosterToPptx(blueprint);
            alert("PowerPoint file downloaded!");
        } catch (error) {
            console.error("PPTX Export failed:", error);
            alert("PPTX Export failed. See console.");
        } finally {
            setIsExportingPptx(false);
        }
    };

    const handleExportSlides = async (imageUrl: string | null) => {
        if (!imageUrl) return;
        if (!session?.accessToken) {
            alert("Google Slides連携には再ログインが必要です。");
            return;
        }
        try {
            setIsExportingSlides(true);
            const blueprint = await extractDesignBlueprint(imageUrl, []);
            const url = await createGoogleSlide(blueprint, session.accessToken);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Slides Export failed:", error);
            alert("Slides Export failed. See console.");
        } finally {
            setIsExportingSlides(false);
        }
    };

    return {
        isExtracting,
        isExportingPptx,
        isExportingSlides,
        handleExtractBlueprint,
        handleExportPptx,
        handleExportSlides
    };
}
