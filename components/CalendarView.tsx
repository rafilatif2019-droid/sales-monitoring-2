
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface Holiday {
  date: string;
  localName: string;
  name: string;
}

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidays = async (year: number) => {
      setLoading(true);
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
        if (!response.ok) {
          throw new Error('Failed to fetch holidays');
        }
        const data: Holiday[] = await response.json();
        const holidayMap = new Map(data.map(h => [h.date, h.localName]));
        setHolidays(holidayMap);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setHolidays(new Map()); // Clear holidays on error
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays(currentDate.getFullYear());
  }, [currentDate.getFullYear()]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // Sunday - 0, Monday - 1, ...
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday - 0, ..., Sunday - 6
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    // Add blank cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      grid.push({ key: `blank-${i}`, type: 'blank' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isToday = date.getTime() === today.getTime();
      const holidayName = holidays.get(dateString);
      
      grid.push({
        key: `day-${day}`,
        type: 'day',
        day,
        isToday,
        isHoliday: !!holidayName,
        holidayName,
      });
    }
    return grid;
  }, [currentDate, holidays]);
  
  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">
          {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex space-x-2">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Bulan sebelumnya">
            <ChevronLeftIcon />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors" aria-label="Bulan berikutnya">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat hari libur...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-400 mb-2">
            {daysOfWeek.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map(cell => {
              if (cell.type === 'blank') {
                return <div key={cell.key} className="p-2"></div>;
              }
              
              if (cell.type === 'day') {
                const { day, isToday, isHoliday, holidayName } = cell;

                let cellClasses = "relative h-20 md:h-24 p-2 rounded-lg flex flex-col justify-start items-start text-sm transition-colors duration-200";
                if (isHoliday) {
                  cellClasses += " bg-red-900/40 text-red-300 border border-red-800";
                } else {
                  cellClasses += " bg-slate-900 border border-transparent";
                }
                if (isToday) {
                  cellClasses += " ring-2 ring-brand-400 font-bold";
                }

                return (
                  <div key={cell.key} className={cellClasses} title={holidayName || undefined}>
                    <span className={`font-bold ${isToday ? 'text-brand-300' : ''}`}>{day}</span>
                    {isHoliday && (
                      <span className="text-xs mt-1 leading-tight hidden md:block">{holidayName}</span>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
