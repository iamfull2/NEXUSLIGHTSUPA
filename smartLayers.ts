import { SmartLayer } from "./types";

/**
 * SMART LAYERS SYSTEM (V36)
 * Manages composition layers for the canvas engine.
 */

export class SmartLayerManager {
    layers: SmartLayer[] = [];

    constructor(initialLayers: SmartLayer[] = []) {
        this.layers = initialLayers;
    }

    addLayer(type: SmartLayer['type'], content: string, options: Partial<SmartLayer> = {}): SmartLayer {
        const newLayer: SmartLayer = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            name: options.name || `${type} ${this.layers.length + 1}`,
            content,
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            x: 0,
            y: 0,
            zIndex: this.layers.length,
            ...options
        };
        this.layers.push(newLayer);
        this.sortLayers();
        return newLayer;
    }

    updateLayer(id: string, updates: Partial<SmartLayer>) {
        const idx = this.layers.findIndex(l => l.id === id);
        if (idx !== -1) {
            this.layers[idx] = { ...this.layers[idx], ...updates };
        }
        if (updates.zIndex !== undefined) this.sortLayers();
    }

    removeLayer(id: string) {
        this.layers = this.layers.filter(l => l.id !== id);
    }

    // AI Auto-Arrange: Backgrounds at bottom, Text at top
    autoOrganize() {
        this.layers.forEach(layer => {
            if (layer.type === 'background') layer.zIndex = 0;
            if (layer.type === 'image') layer.zIndex = 10;
            if (layer.type === 'shape') layer.zIndex = 20;
            if (layer.type === 'text') layer.zIndex = 30;
        });
        this.sortLayers();
    }

    private sortLayers() {
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
    }

    getLayers() {
        return this.layers;
    }
}
