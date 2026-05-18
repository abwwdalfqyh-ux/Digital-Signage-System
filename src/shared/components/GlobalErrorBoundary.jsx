import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Global Error Boundary
 * Catches unhandled errors and displays a graceful fallback UI.
 */
class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('GlobalErrorBoundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
                    <div className="bg-[#121215]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md text-center">
                        <div className="bg-red-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3">حدث خطأ غير متوقع</h2>
                        <p className="text-gray-500 text-sm mb-8">نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة.</p>
                        <button
                            onClick={this.handleReload}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl transition-all flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            إعادة التحميل
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default GlobalErrorBoundary;
