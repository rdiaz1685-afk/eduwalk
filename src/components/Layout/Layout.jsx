import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../styles/Layout.css';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="app-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="main-content">
                <header className="top-bar">
                    <div className="flex items-center gap-3">
                        <button className="mobile-toggle" onClick={toggleSidebar}>
                            <div className="hamburger"></div>
                        </button>
                        <h2 className="page-title">EduWalk</h2>
                    </div>
                    <div className="user-profile">
                        <span className="user-name">Usuario</span>
                        <div className="avatar">U</div>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};


export default Layout;
