export interface PosterProject {
    version: string; // e.g., "1.0.0"
    meta: {
        title: string;
        createdAt: number; // timestamp
        updatedAt: number; // timestamp
    };
    canvas: {
        width: number;
        height: number;
        aspectRatio?: number; // e.g. 1.77 for 16:9
        backgroundImage?: {
            type: 'url' | 'base64';
            src: string;
        };
    };
    layers: ProjectLayer[];
}

export interface ProjectLayer {
    id: string;
    type: 'text' | 'image' | 'shape';
    name?: string;
    visible: boolean;
    locked: boolean;

    // Normalized coordinates (0-1000 scale)
    position: {
        x: number; // 0-1000
        y: number; // 0-1000
        z: number; // z-index
    };
    size: {
        width: number;
        height: number;
    };
    rotation: number; // degrees
    opacity: number; // 0-1

    // Type specific data
    text?: TextData;
    image?: ImageData;
    shape?: ShapeData;
}

export interface TextData {
    content: string;
    style: {
        fontFamily: string;
        fontSize: number; // px value (will be scaled relative to canvas size in UI)
        color: string; // Hex
        fontWeight: string; // 'normal' | 'bold'
        letterSpacing?: number;
        lineHeight?: number;
        textAlign?: 'left' | 'center' | 'right';
    };
}

export interface ImageData {
    src: string; // url or base64
    fit?: 'contain' | 'cover';
}

export interface ShapeData {
    shapeType: string;
    fill: string;
}
