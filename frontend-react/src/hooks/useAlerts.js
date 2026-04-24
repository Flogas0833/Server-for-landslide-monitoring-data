import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertAPI } from '../utils/api';

export const useActiveAlerts = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['alerts', params],
        queryFn: () => alertAPI.getActiveAlerts(params),
        refetchInterval: 5000, // Refresh every 5 seconds
        ...options,
    });
};

export const useAlertHistory = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['alertHistory', params],
        queryFn: () => alertAPI.getAlertHistory(params),
        ...options,
    });
};

export const useAlertStats = (options = {}) => {
    return useQuery({
        queryKey: ['alertStats'],
        queryFn: () => alertAPI.getAlertStats(),
        refetchInterval: 5000, // Refresh every 5 seconds
        ...options,
    });
};

export const useAcknowledgeAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ alertId, user }) => alertAPI.acknowledgeAlert(alertId, user),
        onSuccess: () => {
            // Invalidate alerts query to refetch
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alertHistory'] });
        },
    });
};

export const useThresholds = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ['thresholds', params],
        queryFn: () => alertAPI.getThresholds(params),
        ...options,
    });
};

export const useUpdateThreshold = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sensorType, thresholdName, value }) =>
            alertAPI.updateThreshold(sensorType, thresholdName, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['thresholds'] });
        },
    });
};
