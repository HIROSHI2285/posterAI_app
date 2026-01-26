
export interface DesignBlueprint {
    version: "1.0";
    meta: {
        title?: string;
        generatedAt: string;
        description?: string;
    };
    dimensions: {
        width: number;
        height: number;
        unit: 'px' | 'pt' | 'in';
    };
    background: {
        type: 'solid' | 'gradient' | 'image';
        value: string; // Hex code, gradient string, or Image URL/Base64
        opacity?: number;
    };
    layers: Layer[];
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;

export interface BaseLayer {
    id: string;
    name?: string;
    type: LayerType;
    position: {
        x: number;
        y: number;
        z: number; // z-index equivalent
    };
    size: {
        width: number;
        height: number;
    };
    rotation?: number; // degrees
    opacity?: number; // 0-1
    locked?: boolean;
}

export type LayerType = 'text' | 'image' | 'shape';

export interface TextLayer extends BaseLayer {
    type: 'text';
    content: string;
    style: {
        fontFamily: string;
        fontSize: number;
        color: string; // Hex
        fontWeight?: 'normal' | 'bold' | string;
        fontStyle?: 'normal' | 'italic';
        textDecoration?: 'none' | 'underline' | 'line-through';
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        lineHeight?: number;
        letterSpacing?: number;
        backgroundColor?: string;
        padding?: number;
    };
}

export interface ImageLayer extends BaseLayer {
    type: 'image';
    src: string; // URL or Base64
    alt?: string;
    fit?: 'contain' | 'cover' | 'fill';
}

export interface ShapeLayer extends BaseLayer {
    type: 'shape';
    shapeType: 'rect' | 'circle' | 'line' | 'star' | string;
    fill: {
        color?: string;
        opacity?: number;
    };
    stroke?: {
        color: string;
        width: number;
        style?: 'solid' | 'dashed' | 'dotted';
    };
}
