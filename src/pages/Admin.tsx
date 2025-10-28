import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    console.log('[Admin Page] Auth state:', { loading, user: !!user, isAdmin });
    if (!loading) {
      if (!user) {
        console.log('[Admin Page] No user, redirecting to /auth');
        navigate("/auth");
      } else if (!isAdmin) {
        console.log('[Admin Page] User exists but not admin, redirecting to /');
        navigate("/");
      } else {
        console.log('[Admin Page] User is admin, showing dashboard');
      }
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 pb-20 md:pb-8 overflow-x-hidden w-full">
        <AdminDashboard />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Admin;
