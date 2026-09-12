import React from 'react';

import useTranslation from '../../i18n/useTranslation'; // 

const DataTable = ({ columns, data, loading, onRowClick, emptyMessage }) => {
    const { t } = useTranslation();
    const finalEmptyMessage = emptyMessage || t('common.no_data_to_display');
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
                {finalEmptyMessage}
            </div>
        );
    }

    return (
        <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-center">
                <thead>
                    <tr className="border-b-2 border-[var(--color-dark-turquoise)] bg-gray-50">
                        {columns.map((col, index) => (
                            <th 
                                key={col.accessorKey || index} 
                                className="py-4 px-3 text-sm md:text-base font-black text-gray-900 tracking-tight"
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr 
                            key={row.id || row._id || rowIndex} 
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`border-b border-gray-200 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gray-50/60'}`}
                        >
                            {columns.map((col, colIndex) => (
                                <td 
                                    key={col.accessorKey || colIndex} 
                                    className={`py-4 px-3 text-sm md:text-base text-gray-800 ${
                                        colIndex === 0 
                                            ? 'font-extrabold text-gray-900 text-base md:text-lg' 
                                            : 'font-semibold'
                                    }`}
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
