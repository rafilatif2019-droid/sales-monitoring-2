import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useNotifier } from '../contexts/NotificationContext';
import { StoreLevel } from '../types';
import { CheckCircleIcon } from '../components/icons';

const useTargetCompletionNotifier = () => {
    const { products, stores, sales, user } = useAppContext();
    const { addNotification } = useNotifier();

    useEffect(() => {
        // Only run for logged-in users and when data is available
        if (!user || !products.length || !stores.length) {
            return;
        }

        const activeProducts = products.filter(p => p.isActive);

        const storesByLevel = stores.reduce((acc, store) => {
            if (!acc[store.level]) {
                acc[store.level] = [];
            }
            acc[store.level].push(store);
            return acc;
        }, {} as Record<StoreLevel, typeof stores>);

        activeProducts.forEach(product => {
            const storageKey = `notification-shown-target-completed-${product.id}-${user.id}`;
            if (localStorage.getItem(storageKey)) {
                return; // Notification already shown for this product for this user
            }

            let totalTargetCount = 0;
            const hasTargets = product.targetCoverage && Object.keys(product.targetCoverage).length > 0;

            if (hasTargets) {
                for (const levelStr in product.targetCoverage) {
                    const level = levelStr as StoreLevel;
                    const coveragePercent = product.targetCoverage[level] || 0;
                    const levelStores = storesByLevel[level] || [];
                    if (levelStores.length === 0) continue;

                    const requiredCount = Math.ceil(levelStores.length * (coveragePercent / 100));
                    totalTargetCount += requiredCount;
                }
            }

            if (totalTargetCount === 0) {
                return; // No target set for this product
            }

            const achievedStoreIds = new Set(sales.filter(s => s.productId === product.id).map(s => s.storeId));
            const totalAchievedCount = achievedStoreIds.size;

            if (totalAchievedCount >= totalTargetCount) {
                addNotification({
                    type: 'success',
                    title: 'Target Tercapai!',
                    message: `Produk "${product.name}" telah mencapai target penjualan. Kerja bagus!`,
                    // FIX: The error indicates a TypeScript parsing issue with JSX syntax in a .ts file.
                    // Using React.createElement instead of JSX avoids this ambiguity.
                    icon: React.createElement(CheckCircleIcon),
                });
                localStorage.setItem(storageKey, 'true');
            }
        });

    }, [products, stores, sales, addNotification, user]);
};

export default useTargetCompletionNotifier;
