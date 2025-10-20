import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[80vh]">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
