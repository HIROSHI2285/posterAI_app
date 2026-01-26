import { DesignBlueprint } from './blueprint-types';

export async function extractDesignBlueprint(
    imageBase64: string,
    textLayers: any[] = [] // Optional context from current editor state
): Promise<DesignBlueprint> {
    try {
        const response = await fetch('/api/extract-blueprint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageBase64,
                textLayers,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to extract blueprint');
        }

        const data = await response.json();
        return data as DesignBlueprint;
    } catch (error) {
        console.error('Error extracting blueprint:', error);
        throw error;
    }
}
