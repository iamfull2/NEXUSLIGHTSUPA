
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasLayer } from '../types';

declare global {
    interface Window {
        fabric: any;
    }
}

interface InfiniteCanvasProps {
    layers: CanvasLayer[];
    setLayers: (layers: CanvasLayer[]) => void;
    onSelectLayers: (layerIds: string[]) => void;
    canvasRefOutput: (canvas: any) => void;
    activeTool: string;
}

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ 
    layers, 
    setLayers, 
    onSelectLayers,
    canvasRefOutput,
    activeTool
}) => {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [, setFabricCanvas] = useState<any>(null);
    const [zoom, setZoom] = useState(1);
    
    // Refs for debouncing to avoid re-renders
    const resizeTimeoutRef = useRef<any>(null);
    const updateTimeoutRef = useRef<any>(null);

    // Optimized Update Handler (Debounced)
    const debouncedUpdateLayerState = useCallback((canvas: any) => {
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        
        updateTimeoutRef.current = setTimeout(() => {
            if (!canvas) return;
            const objs = canvas.getObjects();
            // Perform light mapping only when necessary
            // In a real high-perf scenario, we might diff this, but debouncing is a good first step
            // Note: We are just logging or triggering the parent update here depending on props
            // Since setLayers is passed, we assume the parent wants the source of truth back
            // However, avoid circular loops if parent causes re-render. 
            // For V2 demo, we assume one-way sync on modification events.
        }, 300);
    }, []);

    // Initialize Fabric
    useEffect(() => {
        if (!canvasEl.current || !containerRef.current || !window.fabric) return;

        // Get variable for background
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--nexus-panel').trim() || '#0a0a10';
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--nexus-border').trim() || '#1a1a24';

        const canvas = new window.fabric.Canvas(canvasEl.current, {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            backgroundColor: bgColor,
            preserveObjectStacking: true,
            selection: true,
            fireRightClick: true,
            stopContextMenu: true,
            // PERFORMANCE OPTIMIZATIONS
            renderOnAddRemove: false, // Critical: Batch renders
            enableRetinaScaling: true, // Keep quality, but be aware of cost
            perPixelTargetFind: false, // Faster selection detection
            skipTargetFind: false,
        });

        // Grid Pattern (Cached off-screen canvas)
        const gridSize = 50;
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = gridSize;
        gridCanvas.height = gridSize;
        const gridCtx = gridCanvas.getContext('2d');
        if (gridCtx) {
            gridCtx.fillStyle = bgColor;
            gridCtx.fillRect(0, 0, gridSize, gridSize);
            gridCtx.strokeStyle = borderColor;
            gridCtx.lineWidth = 1;
            gridCtx.beginPath();
            gridCtx.moveTo(0, 0);
            gridCtx.lineTo(gridSize, 0);
            gridCtx.moveTo(0, 0);
            gridCtx.lineTo(0, gridSize);
            gridCtx.stroke();
        }
        
        const gridPattern = new window.fabric.Pattern({
            source: gridCanvas,
            repeat: 'repeat'
        });
        
        // Use requestRenderAll for initial render
        canvas.setBackgroundColor(gridPattern, () => canvas.requestRenderAll());

        // Handlers
        const handleSelection = (e: any) => {
            const selected = e.selected || [];
            const ids = selected.map((obj: any) => obj.id);
            onSelectLayers(ids);
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => onSelectLayers([]));
        
        canvas.on('object:modified', () => {
            debouncedUpdateLayerState(canvas);
        });

        canvas.on('object:added', () => {
            // Because renderOnAddRemove is false, we must manually request render
            canvas.requestRenderAll();
        });

        canvas.on('object:removed', () => {
            canvas.requestRenderAll();
        });

        // Infinite Zoom & Pan
        canvas.on('mouse:wheel', (opt: any) => {
            if (opt.e.ctrlKey || opt.e.metaKey) {
                // Zoom
                opt.e.preventDefault();
                opt.e.stopPropagation();
                let delta = opt.e.deltaY;
                let z = canvas.getZoom();
                z *= 0.999 ** delta;
                if (z > 20) z = 20;
                if (z < 0.01) z = 0.01;
                canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
                setZoom(z);
            } else {
                // Pan
                opt.e.preventDefault();
                opt.e.stopPropagation();
                const vpt = canvas.viewportTransform;
                vpt[4] -= opt.e.deltaX;
                vpt[5] -= opt.e.deltaY;
                canvas.requestRenderAll();
            }
        });

        // Optimized Middle click pan
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        canvas.on('mouse:down', (opt: any) => {
            if (opt.e.button === 1 || activeTool === 'hand') { 
                isDragging = true;
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
                // Optimize: Skip finding targets while panning for speed
                canvas.skipTargetFind = true;
                lastPosX = opt.e.clientX;
                lastPosY = opt.e.clientY;
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:move', (opt: any) => {
            if (isDragging) {
                const e = opt.e;
                const vpt = canvas.viewportTransform;
                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        });

        canvas.on('mouse:up', () => {
            if (isDragging) {
                isDragging = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                // Re-enable target finding
                canvas.skipTargetFind = false;
                canvas.requestRenderAll();
            }
        });

        setFabricCanvas(canvas);
        canvasRefOutput(canvas);

        const handleResize = () => {
            if (containerRef.current) {
                canvas.setWidth(containerRef.current.clientWidth);
                canvas.setHeight(containerRef.current.clientHeight);
                canvas.requestRenderAll();
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            // Debounce resize
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(handleResize, 100);
        });
        
        resizeObserver.observe(containerRef.current);

        return () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            canvas.dispose();
            resizeObserver.disconnect();
        };
    }, []); // Empty dependency array to run only once

    return (
        <div ref={containerRef} className="w-full h-full bg-nexus-panel relative overflow-hidden">
            <canvas ref={canvasEl} />
            
            {/* Zoom Indicator */}
            <div className="absolute bottom-6 right-6 bg-black/50 border border-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-nexus-dim pointer-events-none select-none">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
};

export default InfiniteCanvas;
