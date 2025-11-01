import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from './icons';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800 rounded-lg mb-6 transition-shadow hover:shadow-xl hover:shadow-brand-900/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left bg-slate-800/50 rounded-t-lg"
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-bold text-slate-100">{title}</h3>
        <ChevronDownIcon className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
            <div className="p-4 border-t border-slate-700/50">
            {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
