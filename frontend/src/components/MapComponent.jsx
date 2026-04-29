import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDevices } from '../hooks/useDevices';
import QueryStatus from './QueryStatus';
import { formatTime, getStatusClass } from '../utils/helpers';
import '../styles/map.css';
import '../styles/queryStatus.css';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapComponent({ onDeviceSelect }) {
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const [map, setMap] = useState(null);
    const { data: devices = [], isLoading, error } = useDevices();

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || map) return;

        const newMap = L.map(mapRef.current).setView([21.0285, 105.8542], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 2,
        }).addTo(newMap);

        L.control.zoom({ position: 'topleft' }).addTo(newMap);
        L.control.scale().addTo(newMap);

        setMap(newMap);

        return () => {
            newMap.remove();
        };
    }, []);

    // Update markers when devices change
    useEffect(() => {
        if (!map) return;

        const currentMarkers = new Set();

        devices.forEach((device) => {
            if (!device.latitude || !device.longitude) return;

            const markerId = device.device_id;
            currentMarkers.add(markerId);

            const statusClass = getStatusClass(device);
            const customIcon = L.divIcon({
                html: `<div class="sensor-marker ${statusClass}">🛰️</div>`,
                iconSize: [40, 40],
                className: 'custom-marker',
            });

            if (!markersRef.current[markerId]) {
                const marker = L.marker([device.latitude, device.longitude], {
                    icon: customIcon,
                    title: device.name,
                }).addTo(map);

                const popupContent = `
          <div style="font-size: 0.85rem;">
            <strong>${device.name}</strong><br/>
            <small>ID: ${device.device_id}</small><br/>
            <small>Tọa độ: ${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}</small><br/>
            ${device.altitude ? `<small>Độ cao: ${device.altitude.toFixed(1)}m</small><br/>` : ''}
            <small>Cập nhật: ${formatTime(device.last_update)}</small><br/>
            <button onclick="window.dispatchEvent(new CustomEvent('selectDevice', { detail: '${device.device_id}' }))" 
                    style="color: #3498db; background: none; border: none; cursor: pointer; text-decoration: underline;">
              → Xem chi tiết
            </button>
          </div>
        `;

                marker.bindPopup(popupContent);
                marker.on('click', () => {
                    onDeviceSelect?.(device.device_id);
                });

                markersRef.current[markerId] = marker;
            } else {
                markersRef.current[markerId].setLatLng([device.latitude, device.longitude]);
                markersRef.current[markerId].setIcon(customIcon);
            }
        });

        // Remove markers for devices no longer in list
        Object.keys(markersRef.current).forEach((markerId) => {
            if (!currentMarkers.has(markerId)) {
                map.removeLayer(markersRef.current[markerId]);
                delete markersRef.current[markerId];
            }
        });
    }, [map, devices, onDeviceSelect]);

    return (
        <div className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            {isLoading && <div className="map-loading">Đang tải bản đồ...</div>}
            {error && <div className="map-error">Lỗi tải bản đồ: {error.message}</div>}
            <div ref={mapRef} className="map" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
