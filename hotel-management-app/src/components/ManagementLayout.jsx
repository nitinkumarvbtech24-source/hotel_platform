import { Outlet } from 'react-router-dom';
import ManagementSidebar from './ManagementSidebar';
import '../Styles/dashboard.css';

export default function ManagementLayout() {
    return (
        <div className="dashboard-layout">
            <ManagementSidebar />
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}
