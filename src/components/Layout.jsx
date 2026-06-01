import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 dark:text-gray-200">
                <Outlet />
            </main>
        </div>
    );
};
export default Layout;