import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
            <div 
                className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[var(--color-bg-light)]">
                    <h2 className="text-lg font-bold text-[var(--color-dark-turquoise)]">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
