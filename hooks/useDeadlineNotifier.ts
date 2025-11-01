
import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNotifier } from '../contexts/NotificationContext';

const useDeadlineNotifier = () => {
    const { settings } = useAppContext();
    const { addNotification } = useNotifier();

    useEffect(() => {
        const { deadline } = settings;
        if (!deadline) return;

        const checkDeadline = () => {
            const deadlineDate = new Date(deadline);
            const today = new Date();
            // Reset time to compare dates only
            deadlineDate.setHours(23, 59, 59, 999); // Check against end of deadline day
            today.setHours(0, 0, 0, 0);
            
            const timeDiff = deadlineDate.getTime() - today.getTime();
            const daysRemaining = Math.floor(timeDiff / (1000 * 3600 * 24));

            if (daysRemaining < 0) return; // Deadline has passed

            const thresholds = [7, 3, 1];

            thresholds.forEach(day => {
                if (daysRemaining < day) {
                    const storageKey = `notification-shown-${deadline}-${day}-days`;
                    if (!localStorage.getItem(storageKey)) {
                        addNotification({
                            type: 'warning',
                            title: 'Tenggat Waktu Mendekat!',
                            message: `Target Distribusi Drive akan berakhir dalam ${daysRemaining === 0 ? 'hari ini' : `${daysRemaining + 1} hari`}. Ayo semangat!`,
                        });
                        localStorage.setItem(storageKey, 'true');
                    }
                }
            });
        };

        checkDeadline();

    }, [settings.deadline, addNotification]);
};

export default useDeadlineNotifier;
