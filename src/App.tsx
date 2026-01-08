import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Page from "./pages/Page";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";
import { Orders } from "./pages/admin/Orders";
import { OrderDetail } from "./pages/admin/OrderDetail";
import { Products } from "./pages/admin/Products";
import { Settings } from "./pages/admin/Settings";
import { Comparison } from "./pages/admin/Comparison";
import { Options } from "./pages/admin/Options";
import { Galleries } from "./pages/admin/Galleries";
import { Reviews } from "./pages/admin/Reviews";
import { FAQ } from "./pages/admin/FAQ";
import { Team } from "./pages/admin/Team";
import { Instagram } from "./pages/admin/Instagram";
import { Texts } from "./pages/admin/Texts";
import { Pages } from "./pages/admin/Pages";
import { PageDetail } from "./pages/admin/PageDetail";
import { EmailTemplates } from "./pages/admin/EmailTemplates";
import { Analytics } from "./pages/admin/Analytics";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AnalyticsInit } from "./components/AnalyticsInit";
import Profile from "./pages/user/Profile";
import UserOrders from "./pages/user/UserOrders";
import UserOrderDetail from "./pages/user/UserOrderDetail";
import UserMaterials from "./pages/user/UserMaterials";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsInit />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* User routes - protected */}
                  <Route path="/user/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/orders" element={
                    <ProtectedRoute>
                      <UserOrders />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/orders/:id" element={
                    <ProtectedRoute>
                      <UserOrderDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/materials" element={
                    <ProtectedRoute>
                      <UserMaterials />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes - protected */}
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="products" element={<Products />} />
                    <Route path="options" element={<Options />} />
                    <Route path="galleries" element={<Galleries />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="faq" element={<FAQ />} />
                    <Route path="team" element={<Team />} />
                    <Route path="instagram" element={<Instagram />} />
                    <Route path="texts" element={<Texts />} />
                    <Route path="pages" element={<Pages />} />
                    <Route path="pages/:id" element={<PageDetail />} />
                    <Route path="email-templates" element={<EmailTemplates />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="comparison" element={<Comparison />} />
                  </Route>
                  
                  {/* Dynamic page routes - must be after admin routes */}
                  <Route path="/:slug" element={<Page />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AnalyticsProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
