
import React, { useState, useEffect } from 'react';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: { id: string; label: string; action: () => void; icon: string }[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredCommands = commands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
            } else if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="w-full max-w-xl bg-nexus-panel border border-nexus-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-nexus-border gap-3">
                    <span className="text-nexus-dim text-lg">🔍</span>
                    <input
                        autoFocus
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Digite um comando..."
                        className="flex-1 bg-transparent border-none outline-none text-nexus-text placeholder:text-nexus-dim font-mono text-sm"
                    />
                    <kbd className="hidden sm:inline text-[10px] bg-white/10 px-2 py-1 rounded text-nexus-dim">ESC</kbd>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {filteredCommands.length === 0 && (
                        <div className="px-4 py-8 text-center text-nexus-dim text-sm italic">
                            Nenhum comando encontrado
                        </div>
                    )}
                    {filteredCommands.map((cmd, i) => (
                        <div
                            key={cmd.id}
                            onClick={() => { cmd.action(); onClose(); }}
                            className={`
                                px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors
                                ${i === selectedIndex ? 'bg-nexus-accent/10 border-l-2 border-nexus-accent' : 'hover:bg-white/5 border-l-2 border-transparent'}
                            `}
                        >
                            <span className="text-lg">{cmd.icon}</span>
                            <span className={`text-sm ${i === selectedIndex ? 'text-nexus-text font-bold' : 'text-nexus-dim'}`}>
                                {cmd.label}
                            </span>
                        </div>
                    ))}
                </div>
                
                <div className="bg-nexus-surface px-4 py-2 flex justify-between items-center text-[10px] text-nexus-dim border-t border-nexus-border">
                    <span>NEXUS OS V2.0</span>
                    <div className="flex gap-2">
                        <span>↑↓ Navegar</span>
                        <span>↵ Selecionar</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
