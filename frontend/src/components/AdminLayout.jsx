import Sidebar from "./Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f4f8" }}>
      <Sidebar />
      <div style={{
        flex: 1, padding: 0,
        background: "#f0f4f8",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}
