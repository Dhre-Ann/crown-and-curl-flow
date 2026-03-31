import type { JSX } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminLayout from "@/components/layout/AdminLayout";

import Landing from "@/pages/public/Landing";
import Services from "@/pages/public/Services";
import ServiceDetail from "@/pages/public/ServiceDetail";
import Book from "@/pages/public/Book";
import Checkout from "@/pages/public/Checkout";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import CustomerDashboard from "@/pages/customer/Dashboard";
import NewReview from "@/pages/customer/NewReview";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminServicesPage from "@/pages/admin/AdminServicesPage";
import AdminCalendar from "@/pages/admin/AdminCalendar";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminSettings from "@/pages/admin/AdminSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function CustomerRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "customer") return <Navigate to="/admin" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
                <Route path="/book" element={<Book />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/customer/dashboard"
                  element={
                    <CustomerRoute>
                      <CustomerDashboard />
                    </CustomerRoute>
                  }
                />
                <Route
                  path="/customer/reviews/new"
                  element={
                    <CustomerRoute>
                      <NewReview />
                    </CustomerRoute>
                  }
                />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="services" element={<AdminServicesPage />} />
                  <Route path="calendar" element={<AdminCalendar />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
