import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './core/routes/AppRoutes';
import ToastContainer from './shared/components/ToastContainer';
import useUIStore from './store/useUIStore';

const App = () => {
    const { theme, language } = useUIStore();

    /* Apply theme + language to <html> on every change */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    }, [theme, language]);

    return (
        <Router>
            <div className="App min-h-screen transition-colors duration-500">
                <AppRoutes />
                <ToastContainer />
            </div>
        </Router>
    );
};

export default App;