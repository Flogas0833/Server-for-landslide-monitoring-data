import { useQuery } from '@tanstack/react-query';
import { sensorAPI } from '../utils/api';

export const useSensorData = (sensorType, params = {}, options = {}) => {
    return useQuery({
        queryKey: ['sensor', sensorType, params],
        queryFn: () => sensorAPI.getSensorData(sensorType, params),
        enabled: !!sensorType,
        refetchInterval: 5000, // Refresh every 5 seconds
        ...options,
    });
};

export const useSensorHistory = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['sensorHistory', params],
        queryFn: () => sensorAPI.getSensorHistory(params),
        enabled: !!params.sensor_type,
        ...options,
    });
};

export const useStatistics = (options = {}) => {
    return useQuery({
        queryKey: ['statistics'],
        queryFn: () => sensorAPI.getStatistics(),
        refetchInterval: 5000, // Refresh every 5 seconds
        ...options,
    });
};
