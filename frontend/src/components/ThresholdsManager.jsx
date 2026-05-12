import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Alert, AlertTitle, AlertDescription } from './ui';
import { AlertCircle, Save, Loader } from 'lucide-react';
import { alertAPI, userAPI } from '../utils/api';
import { VIETNAM_PROVINCES } from '../constants/provinces';

const SENSOR_TYPES = ['tilt', 'vibration', 'displacement', 'rainfall', 'temperature'];

const SENSOR_TYPES_VI = {
    tilt: 'Tilt (Nghiêng)',
    vibration: 'Vibration (Rung động)',
    displacement: 'Displacement (Chuyển vị)',
    rainfall: 'Rainfall (Lượng mưa)',
    temperature: 'Temperature (Nhiệt độ)',
};

const THRESHOLD_LABELS = {
    tilt: {
        roll_low: 'Roll Thấp (°)',
        roll_medium: 'Roll Trung bình (°)',
        roll_high: 'Roll Cao (°)',
        roll_critical: 'Roll Nguy hiểm (°)',
        pitch_low: 'Pitch Thấp (°)',
        pitch_medium: 'Pitch Trung bình (°)',
        pitch_high: 'Pitch Cao (°)',
        pitch_critical: 'Pitch Nguy hiểm (°)',
    },
    vibration: {
        frequency_low: 'Frequency Thấp (Hz)',
        frequency_medium: 'Frequency Trung bình (Hz)',
        frequency_high: 'Frequency Cao (Hz)',
        frequency_critical: 'Frequency Nguy hiểm (Hz)',
        amplitude_low: 'Amplitude Thấp (G)',
        amplitude_medium: 'Amplitude Trung bình (G)',
        amplitude_high: 'Amplitude Cao (G)',
        amplitude_critical: 'Amplitude Nguy hiểm (G)',
    },
    displacement: {
        horizontal_low: 'Ngang Thấp (mm)',
        horizontal_medium: 'Ngang Trung bình (mm)',
        horizontal_high: 'Ngang Cao (mm)',
        horizontal_critical: 'Ngang Nguy hiểm (mm)',
        vertical_low: 'Dọc Thấp (mm)',
        vertical_medium: 'Dọc Trung bình (mm)',
        vertical_high: 'Dọc Cao (mm)',
        vertical_critical: 'Dọc Nguy hiểm (mm)',
        cumulative_low: 'Tích lũy Thấp (mm)',
        cumulative_medium: 'Tích lũy Trung bình (mm)',
        cumulative_high: 'Tích lũy Cao (mm)',
        cumulative_critical: 'Tích lũy Nguy hiểm (mm)',
    },
    rainfall: {
        intensity_low: 'Cường độ Thấp (mm/h)',
        intensity_medium: 'Cường độ Trung bình (mm/h)',
        intensity_high: 'Cường độ Cao (mm/h)',
        intensity_critical: 'Cường độ Nguy hiểm (mm/h)',
        cumulative_1h_low: 'Tích lũy 1h Thấp (mm)',
        cumulative_1h_medium: 'Tích lũy 1h Trung bình (mm)',
        cumulative_1h_high: 'Tích lũy 1h Cao (mm)',
        cumulative_1h_critical: 'Tích lũy 1h Nguy hiểm (mm)',
    },
    temperature: {
        temp_min_critical: 'Nhiệt độ Min Nguy hiểm (°C)',
        temp_min_high: 'Nhiệt độ Min Cao (°C)',
        temp_min_low: 'Nhiệt độ Min Thấp (°C)',
        temp_max_low: 'Nhiệt độ Max Thấp (°C)',
        temp_max_high: 'Nhiệt độ Max Cao (°C)',
        temp_max_critical: 'Nhiệt độ Max Nguy hiểm (°C)',
        humidity_low: 'Độ ẩm Thấp (%)',
        humidity_high: 'Độ ẩm Cao (%)',
    },
};

export default function ThresholdsManager() {
    const [selectedSensor, setSelectedSensor] = useState('displacement');
    const [thresholds, setThresholds] = useState({});
    const [editedValues, setEditedValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Province-related state
    const [userProvince, setUserProvince] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Load user info to get province
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        try {
            const response = await userAPI.getCurrentUser();
            if (response.user) {
                setUserRole(response.user.role);
                setUserProvince(response.user.province);
                // Auto-select user's province for operators
                if (response.user.role === 'operator' && response.user.province) {
                    setSelectedProvince(response.user.province);
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    };

    useEffect(() => {
        if (selectedProvince || userRole === 'admin') {
            loadThresholds();
        }
    }, [selectedProvince, userRole]);

    const loadThresholds = async () => {
        try {
            setLoading(true);
            setMessage({ type: '', text: '' }); // Clear previous messages

            let response;
            try {
                // If province is selected, use province-specific endpoint
                if (selectedProvince) {
                    response = await alertAPI.getThresholdsByProvince(selectedProvince);
                } else {
                    // Try getting details first
                    response = await alertAPI.getThresholdsDetails();
                }
            } catch (error) {
                console.log('getThresholdsDetails failed, trying public endpoint:', error.message);
                // Fallback to public endpoint
                response = await alertAPI.getThresholdsPublic();
            }

            if (response && response.thresholds) {
                setThresholds(response.thresholds);
                // Initialize edited values with current values
                const initial = {};
                Object.entries(response.thresholds).forEach(([sensorType, values]) => {
                    initial[sensorType] = {};
                    Object.entries(values).forEach(([key, data]) => {
                        // Handle both formats: {value: X, updated_at: Y} and direct values
                        const val = typeof data === 'object' ? data.value : data;
                        initial[sensorType][key] = val;
                    });
                });
                setEditedValues(initial);
            } else {
                throw new Error('Không nhận được dữ liệu từ server');
            }
        } catch (error) {
            console.error('Error loading thresholds:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Lỗi không xác định';
            setMessage({
                type: 'error',
                text: 'Không thể tải ngưỡng cảnh báo: ' + errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (sensorType, thresholdName, newValue) => {
        setEditedValues(prev => ({
            ...prev,
            [sensorType]: {
                ...prev[sensorType],
                [thresholdName]: parseFloat(newValue) || 0
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const sensorType = selectedSensor;

            // Compare current with edited values
            const currentValues = thresholds[sensorType] || {};
            const newValues = editedValues[sensorType] || {};

            let successCount = 0;
            let errorCount = 0;

            for (const [key, newValue] of Object.entries(newValues)) {
                const currentValue = currentValues[key]?.value;
                if (currentValue !== newValue) {
                    // Save this threshold
                    try {
                        if (selectedProvince) {
                            // Save province-specific threshold
                            await alertAPI.updateThresholdByProvince(selectedProvince, sensorType, key, newValue);
                        } else {
                            // Save global threshold
                            await alertAPI.updateThreshold(sensorType, key, newValue);
                        }
                        successCount++;
                    } catch (error) {
                        console.error(`Error updating ${key}:`, error);
                        errorCount++;
                    }
                }
            }

            if (errorCount === 0 && successCount > 0) {
                setMessage({
                    type: 'success',
                    text: `Đã lưu ${successCount} ngưỡng cảnh báo thành công!`
                });
                // Reload to get updated values with timestamps
                setTimeout(loadThresholds, 1000);
            } else if (successCount === 0 && errorCount === 0) {
                setMessage({
                    type: 'success',
                    text: 'Không có thay đổi nào để lưu'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: `Lỗi: ${errorCount} thay đổi không thành công, ${successCount} thành công`
                });
            }
        } catch (error) {
            console.error('Error saving thresholds:', error);
            setMessage({
                type: 'error',
                text: 'Lỗi khi lưu ngưỡng: ' + (error.response?.data?.error || error.message || 'Lỗi không xác định')
            });
        } finally {
            setSaving(false);
        }
    };



    const currentSensorThresholds = editedValues[selectedSensor] || {};
    const currentSensorOriginal = thresholds[selectedSensor] || {};

    return (
        <Card className="w-full">
            <CardContent className="space-y-6">
                {message.text && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        {message.type === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{message.type === 'error' ? 'Lỗi' : 'Thành công'}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Province Selector - For Admin or Show user's province */}
                {(userRole === 'admin' || userProvince) && (
                    <div className="space-y-3 border-b pb-4">
                        <label className="text-sm font-medium">
                            Tỉnh Thành {userRole === 'operator' && <span className="text-red-500">*</span>}
                        </label>
                        {userRole === 'admin' ? (
                            <div className="space-y-3">

                                <div className="relative">
                                    <select
                                        value={selectedProvince || ''}
                                        onChange={(e) => setSelectedProvince(e.target.value || null)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">-- Chọn tỉnh thành --</option>
                                        {VIETNAM_PROVINCES.map(province => (
                                            <option key={province} value={province}>
                                                {province}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm text-gray-600">Tỉnh quản lý của bạn:</div>
                                <div className="text-lg font-semibold text-blue-700 mt-1">{userProvince}</div>
                            </div>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2">Đang tải...</span>
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Sensor Type Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Chọn loại cảm biến</label>
                            <div className="flex gap-2 flex-wrap">
                                {SENSOR_TYPES.map(sensor => (
                                    <button
                                        key={sensor}
                                        onClick={() => setSelectedSensor(sensor)}
                                        className={`px-4 py-2 rounded-lg border transition ${selectedSensor === sensor
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                            }`}
                                    >
                                        {SENSOR_TYPES_VI[sensor]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thresholds Grid */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(currentSensorThresholds).map(([thresholdKey, value]) => {
                                    const originalData = currentSensorOriginal[thresholdKey];
                                    // Handle both formats: {value: X, updated_at: Y} or direct value
                                    const original = typeof originalData === 'object' ? originalData?.value : originalData;
                                    const isChanged = value !== original;
                                    const label = THRESHOLD_LABELS[selectedSensor]?.[thresholdKey] || thresholdKey;

                                    return (
                                        <div key={thresholdKey} className="space-y-1">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                {label}
                                                {isChanged && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Đã thay đổi
                                                    </Badge>
                                                )}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={value}
                                                    onChange={(e) => handleValueChange(selectedSensor, thresholdKey, e.target.value)}
                                                    className={isChanged ? 'border-blue-500 bg-blue-50' : ''}
                                                />
                                                {isChanged && original && (
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        (trước: {original})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Lưu Thay Đổi
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
