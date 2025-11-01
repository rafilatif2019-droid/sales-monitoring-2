import React, { useState, useEffect } from 'react';
import { ClockIcon } from './icons';

const PhaseCountdown: React.FC = () => {
    const [phase, setPhase] = useState<number>(1);
    const [daysRemaining, setDaysRemaining] = useState<number>(0);

    useEffect(() => {
        const calculatePhase = () => {
            const today = new Date();
            const dayOfMonth = today.getDate();
            const year = today.getFullYear();
            const month = today.getMonth();

            let currentPhase: number;
            let phaseEndDate: Date;

            if (dayOfMonth <= 15) {
                currentPhase = 1;
                phaseEndDate = new Date(year, month, 15);
            } else {
                currentPhase = 2;
                phaseEndDate = new Date(year, month + 1, 0); // Last day of current month
            }

            // Set end of day for accurate calculation
            phaseEndDate.setHours(23, 59, 59, 999);
            today.setHours(0,0,0,0);

            const timeDiff = phaseEndDate.getTime() - today.getTime();
            const remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

            setPhase(currentPhase);
            setDaysRemaining(remainingDays);
        };

        calculatePhase();
    }, []);
    
    const getCountdownText = () => {
        if (daysRemaining <= 0) {
            return <span className="font-bold text-yellow-400">Fase Berakhir</span>;
        }
        if (daysRemaining === 1) {
            return <span className="font-bold text-red-400 animate-pulse">Hari Terakhir!</span>;
        }
        return <>Sisa <span className="font-bold text-white">{daysRemaining}</span> hari</>;
    }

    return (
        <div className="bg-brand-900/50 border border-brand-700 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 text-brand-400">
                <ClockIcon />
            </div>
            <div>
                <p className="font-semibold text-brand-300">Distribusi Drive - Fase {phase}</p>
                <p className="text-sm text-slate-300">
                    {getCountdownText()}
                </p>
            </div>
        </div>
    );
};

export default PhaseCountdown;
