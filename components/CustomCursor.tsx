
import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Detecta se o dispositivo tem um ponteiro preciso (mouse)
        // Se não tiver (touch), não ativa o cursor customizado
        const mediaQuery = window.matchMedia('(pointer: fine)');
        const isDesktop = mediaQuery.matches;

        if (!isDesktop) return;

        setIsVisible(true);

        const updatePosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            
            const target = e.target as HTMLElement;
            const computedStyle = window.getComputedStyle(target);
            
            const isInteractive = 
                ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'].includes(target.tagName) ||
                target.closest('button') !== null ||
                target.closest('a') !== null ||
                computedStyle.cursor === 'pointer';

            setIsHovering(isInteractive);
        };

        const onMouseDown = () => setIsClicking(true);
        const onMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', updatePosition);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', updatePosition);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <>
            <style>{`
                body, a, button, input, textarea, select, label, [role="button"] {
                    cursor: none !important;
                }
            `}</style>
            <div 
                className="fixed pointer-events-none z-[10000] mix-blend-exclusion"
                style={{ 
                    left: 0, 
                    top: 0,
                    transform: `translate(${position.x}px, ${position.y}px)`
                }}
            >
                <div className="relative -translate-x-1/2 -translate-y-1/2">
                    {/* Outer Ring */}
                    <div 
                        className={`
                            border border-nexus-accent rounded-full transition-all duration-150 ease-out
                            ${isHovering ? 'w-10 h-10 opacity-100 bg-nexus-accent/20 border-nexus-secondary' : 'w-5 h-5 opacity-70'}
                            ${isClicking ? 'scale-75' : 'scale-100'}
                        `}
                    />
                    
                    {/* Inner Dot */}
                    <div 
                        className={`
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            bg-white rounded-full transition-all duration-200
                            ${isHovering ? 'w-1 h-1' : 'w-1.5 h-1.5'}
                        `}
                    />
                </div>
            </div>
        </>
    );
};

export default CustomCursor;
