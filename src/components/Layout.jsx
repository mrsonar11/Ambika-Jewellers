import { Outlet } from "react-router-dom";
import TopNavbar from "./TopNavbar";
import LiveRates from "./LiveRates";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen">
      <LiveRates />
      <TopNavbar />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;