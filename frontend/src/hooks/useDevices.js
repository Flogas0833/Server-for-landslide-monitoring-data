import { useQuery } from '@tanstack/react-query';
import { deviceAPI } from '../utils/api';

export const useDevices = (options = {}) => {
    const result = useQuery({
        queryKey: ['devices'],
        queryFn: async () => {
            console.log('[useDevices] Fetching devices...');
            try {
                const data = await deviceAPI.getAllDevices();
                console.log('[useDevices] Got devices:', data);
                return data;
            } catch (error) {
                console.error('[useDevices] Error fetching devices:', error);
                throw error;
            }
        },
        refetchInterval: 10000, // Refresh every 10 seconds
        ...options,
    });

    console.log('[useDevices] Query result:', {
        status: result.status,
        isLoading: result.isLoading,
        dataLength: result.data?.length,
        error: result.error?.message
    });

    return result;
};

export const useDeviceDetail = (deviceId, options = {}) => {
    return useQuery({
        queryKey: ['device', deviceId],
        queryFn: () => deviceAPI.getDeviceDetail(deviceId),
        enabled: !!deviceId,
        refetchInterval: 5000, // Refresh every 5 seconds
        ...options,
    });
};
