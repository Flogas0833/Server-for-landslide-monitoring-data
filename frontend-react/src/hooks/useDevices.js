import { useQuery } from '@tanstack/react-query';
import { deviceAPI } from '../utils/api';

export const useDevices = (options = {}) => {
    return useQuery({
        queryKey: ['devices'],
        queryFn: () => deviceAPI.getAllDevices(),
        refetchInterval: 10000, // Refresh every 10 seconds
        ...options,
    });
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
