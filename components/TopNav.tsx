'use client';

import { Menu } from 'lucide-react';

interface TopNavProps {
    onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
    return (
        <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-[9999] pointer-events-none">
            {/* Title - Clickable/Selectable if needed, but pointer-events-auto makes it "real" */}
            <h1 className="text-xl font-bold font-[Outfit] tracking-tighter drop-shadow-md pointer-events-auto text-white">
                GPS<span className="text-emerald-400">on</span>Waves
            </h1>

            {/* Menu Button - Explicitly clickable */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    console.log("TopNav Menu Clicked");
                    onMenuClick();
                }}
                className="pointer-events-auto bg-emerald-500 text-black px-4 py-2 rounded-full font-bold shadow-xl active:scale-95 transition-all hover:bg-emerald-400 cursor-pointer"
                aria-label="Open Saved Spots"
            >
                MENU
            </button>
        </div>
    );
}
