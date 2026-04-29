import { useMemo } from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useSensorData } from '../hooks/useSensors';
import QueryStatus from './QueryStatus';
import { formatTime, formatValue } from '../utils/helpers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardHeader, CardTitle, CardContent, Button, Loader } from './ui';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

const columnHelper = createColumnHelper();

function TiltTable({ sensorType, params }) {
    const query = useSensorData(sensorType, params);
    const { data: response, isLoading } = query;
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
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

    return <TableRenderer table={table} query={query} isLoading={isLoading} />;
}

function VibrationTable({ sensorType, params }) {
    const query = useSensorData(sensorType, params);
    const { data: response, isLoading } = query;
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
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

    return <TableRenderer table={table} query={query} isLoading={isLoading} />;
}

function DisplacementTable({ sensorType, params }) {
    const query = useSensorData(sensorType, params);
    const { data: response, isLoading } = query;
    const records = response?.data || [];

    const columns = useMemo(
        () => [
            columnHelper.accessor('device_id', {
                header: 'Cảm Biến',
                cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
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
                    return <span className={isHigh ? 'font-semibold text-red-600' : ''}>{formatValue(value)}</span>;
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

    return <TableRenderer table={table} query={query} isLoading={isLoading} />;
}

function TableRenderer({ table, query, isLoading }) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Dữ Liệu Cảm Biến</CardTitle>
                <QueryStatus query={query} label="Trạng thái" />
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader />
                    </div>
                ) : (
                    <>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className={header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-muted' : ''}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getIsSorted() && (
                                                            <span className="text-xs">
                                                                {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={table.getAllColumns().length} className="text-center text-muted-foreground py-4">
                                                Không có dữ liệu
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between gap-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronFirst className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronLast className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
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
            return <Card className="w-full"><CardContent className="py-4">Loại cảm biến không được hỗ trợ: {sensorType}</CardContent></Card>;
    }
}
