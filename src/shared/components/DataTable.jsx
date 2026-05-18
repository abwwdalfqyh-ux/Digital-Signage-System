import React from 'react';

const DataTable = ({ columns, data, loading, onRowClick, emptyMessage = 'لا توجد بيانات لعرضها' }) => {
    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--color-dark-turquoise)] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500 font-bold bg-white rounded-lg border-[2.5px] border-[var(--color-dark-turquoise)]">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-center">
                <thead>
                    <tr className="border-b border-gray-300">
                        {columns.map((col, index) => (
                            <th 
                                key={index} 
                                className="py-3 px-2 text-[11px] md:text-sm font-black text-gray-800"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr 
                            key={rowIndex} 
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`border-b border-gray-100 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        >
                            {columns.map((col, colIndex) => (
                                <td 
                                    key={colIndex} 
                                    className="py-3 px-2 text-[11px] md:text-sm font-bold text-gray-800"
                                >
                                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
