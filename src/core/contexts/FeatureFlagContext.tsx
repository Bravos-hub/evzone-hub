import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../core/api/client';

type FeatureFlagContextType = {
    flags: Record<string, boolean>;
    isEnabled: (key: string) => boolean;
    reload: () => Promise<void>;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
    const [flags, setFlags] = useState<Record<string, boolean>>({});

    const reload = async () => {
        try {
            const flags = await apiClient.get<any[]>('/feature-flags');
            // Ensure we handle both direct array response and wrapped response if API changes
            const flagList = Array.isArray(flags) ? flags : (flags as any).data || [];

            const flagMap = flagList.reduce((acc: any, flag: any) => {
                acc[flag.key] = flag.isEnabled;
                return acc;
            }, {});
            setFlags(flagMap);
        } catch (err) {
            console.error('Failed to load feature flags', err);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const isEnabled = (key: string) => !!flags[key];

    return (
        <FeatureFlagContext.Provider value={{ flags, isEnabled, reload }}>
            {children}
        </FeatureFlagContext.Provider>
    );
}

export function useFeatureFlags() {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
}
