
import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  title: string;
  children: ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ isOpen, onClose, anchorEl, title, children }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const [arrowStyles, setArrowStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && anchorEl && popoverRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const margin = 8; // Margin from viewport edges

      let top = anchorRect.bottom + window.scrollY + margin;
      let left = anchorRect.left + window.scrollX + anchorRect.width / 2 - popoverRect.width / 2;
      
      const newArrowStyles: React.CSSProperties = {
        position: 'absolute'
      };

      // Vertical positioning
      if (top + popoverRect.height > window.innerHeight + window.scrollY - margin) {
        // Not enough space below, position above
        top = anchorRect.top + window.scrollY - popoverRect.height - margin;
        newArrowStyles.bottom = '-8px';
        newArrowStyles.transform = 'translateX(-50%) rotate(180deg)';
      } else {
        // Position below
        newArrowStyles.top = '-8px';
        newArrowStyles.transform = 'translateX(-50%)';
      }

      // Horizontal boundary check
      if (left < margin) {
        left = margin;
      }
      if (left + popoverRect.width > window.innerWidth - margin) {
        left = window.innerWidth - popoverRect.width - margin;
      }
      
      // Adjust arrow horizontal position
      newArrowStyles.left = `${anchorRect.left + anchorRect.width / 2 - left}px`;

      setPosition({ top, left });
      setArrowStyles(newArrowStyles);
    }
  }, [isOpen, anchorEl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, anchorEl, onClose]);

  if (!isOpen || !anchorEl) return null;

  return (
    <div
      ref={popoverRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-50 w-full max-w-md bg-slate-800 rounded-lg shadow-2xl border border-slate-700 animate-fade-in"
    >
      <div 
        className="w-4 h-4 bg-slate-800 transform rotate-45 border-l border-t border-slate-700"
        style={arrowStyles}
      ></div>
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Popover;
