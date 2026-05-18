import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './core/routes/AppRoutes';
import ToastContainer from './shared/components/ToastContainer';

const App = () => {
    return (
        <Router>
            <div className="App min-h-screen bg-slate-50 dark:bg-[#0a0a0c] transition-colors duration-500">
                <AppRoutes />
                <ToastContainer />
            </div>
        </Router>
    );
};

export default App;