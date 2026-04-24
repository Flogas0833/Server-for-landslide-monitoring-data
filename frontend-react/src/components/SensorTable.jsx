import { useMemo, useState } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useSensorData } from '../hooks/useSensors';
import { formatTime, formatValue } from '../utils/helpers';
import '../styles/sensorTable.css';

const columnHelper = createColumnHelper();

function TiltTable({ sensorType, params }) {
    const { data: response, isLoading } = useSensorData(sensorType, params);
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="device-id">{info.getValue()}</span>,
            }),
            columnHelper.accessor('timestamp', {
                header: 'Thời Gian',
                cell: (info) => formatTime(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.roll, {
                id: 'roll',
                header: 'Roll (°)',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.pitch, {
                id: 'pitch',
                header: 'Pitch (°)',
                cell: (info) => formatValue(info.getValue()),
            }),
        ],
        []
    );

    const table = useReactTable({
        data: records,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return <TableRenderer table={table} isLoading={isLoading} />;
}

function VibrationTable({ sensorType, params }) {
    const { data: response, isLoading } = useSensorData(sensorType, params);
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="device-id">{info.getValue()}</span>,
            }),
            columnHelper.accessor('timestamp', {
                header: 'Thời Gian',
                cell: (info) => formatTime(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.frequency, {
                id: 'frequency',
                header: 'Tần Số (Hz)',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.amplitude_x, {
                id: 'amplitude_x',
                header: 'Biên Độ X',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.amplitude_y, {
                id: 'amplitude_y',
                header: 'Biên Độ Y',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.amplitude_z, {
                id: 'amplitude_z',
                header: 'Biên Độ Z',
                cell: (info) => formatValue(info.getValue()),
            }),
        ],
        []
    );

    const table = useReactTable({
        data: records,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return <TableRenderer table={table} isLoading={isLoading} />;
}

function DisplacementTable({ sensorType, params }) {
    const { data: response, isLoading } = useSensorData(sensorType, params);
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="device-id">{info.getValue()}</span>,
            }),
            columnHelper.accessor('timestamp', {
                header: 'Thời Gian',
                cell: (info) => formatTime(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.horizontal, {
                id: 'horizontal',
                header: 'Ngang (mm)',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.vertical, {
                id: 'vertical',
                header: 'Dọc (mm)',
                cell: (info) => formatValue(info.getValue()),
            }),
            columnHelper.accessor((row) => row.data?.cumulative, {
                id: 'cumulative',
                header: 'Tích Lũy (mm)',
                cell: (info) => {
                    const value = info.getValue();
                    const isHigh = value > 100;
                    return <span className={isHigh ? 'high' : ''}>{formatValue(value)}</span>;
                },
            }),
        ],
        []
    );

    const table = useReactTable({
        data: records,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return <TableRenderer table={table} isLoading={isLoading} />;
}

function TableRenderer({ table, isLoading }) {
    return (
        <div className="table-container">
            {isLoading ? (
                <div className="loading">Đang tải dữ liệu...</div>
            ) : (
                <>
                    <table className="data-table">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getIsSorted() && (
                                                        <span>{header.column.getIsSorted() === 'desc' ? ' 🔽' : ' 🔼'}</span>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                            {'<<'}
                        </button>
                        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            {'<'}
                        </button>
                        <span>
                            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            {'>'}
                        </button>
                        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                            {'>>'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export function SensorTable({ sensorType, params }) {
    switch (sensorType) {
        case 'tilt':
            return <TiltTable sensorType={sensorType} params={params} />;
        case 'vibration':
            return <VibrationTable sensorType={sensorType} params={params} />;
        case 'displacement':
            return <DisplacementTable sensorType={sensorType} params={params} />;
        default:
            return <div className="unsupported">Loại cảm biến không được hỗ trợ: {sensorType}</div>;
    }
}
