import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../styles/Layout.css';

const Layout = () => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <header className="top-bar">
                    <div className="search-bar">
                        {/* Search or page title placeholder */}
                        <h2>Overview</h2>
                    </div>
                    <div className="user-profile">
                        <span className="user-name">District Admin</span>
                        <div className="avatar">DA</div>
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
