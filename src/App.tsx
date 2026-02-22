import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AnalyticsInit } from "./components/AnalyticsInit";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Page = lazy(() => import("./pages/Page"));
const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AllReviews = lazy(() => import("./pages/AllReviews"));

// User pages
const Profile = lazy(() => import("./pages/user/Profile"));
const UserOrders = lazy(() => import("./pages/user/UserOrders"));
const UserOrderDetail = lazy(() => import("./pages/user/UserOrderDetail"));
const UserMaterials = lazy(() => import("./pages/user/UserMaterials"));

// Admin pages — в отдельном чанке, грузятся только при заходе в /admin
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.Dashboard })));
const Orders = lazy(() => import("./pages/admin/Orders").then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail").then(m => ({ default: m.OrderDetail })));
const Products = lazy(() => import("./pages/admin/Products").then(m => ({ default: m.Products })));
const Settings = lazy(() => import("./pages/admin/Settings").then(m => ({ default: m.Settings })));
const Comparison = lazy(() => import("./pages/admin/Comparison").then(m => ({ default: m.Comparison })));
const Options = lazy(() => import("./pages/admin/Options").then(m => ({ default: m.Options })));
const Materials = lazy(() => import("./pages/admin/Materials").then(m => ({ default: m.Materials })));
const Galleries = lazy(() => import("./pages/admin/Galleries").then(m => ({ default: m.Galleries })));
const Reviews = lazy(() => import("./pages/admin/Reviews").then(m => ({ default: m.Reviews })));
const FAQ = lazy(() => import("./pages/admin/FAQ").then(m => ({ default: m.FAQ })));
const Team = lazy(() => import("./pages/admin/Team").then(m => ({ default: m.Team })));
const Instagram = lazy(() => import("./pages/admin/Instagram").then(m => ({ default: m.Instagram })));
const Texts = lazy(() => import("./pages/admin/Texts").then(m => ({ default: m.Texts })));
const Pages = lazy(() => import("./pages/admin/Pages").then(m => ({ default: m.Pages })));
const PageDetail = lazy(() => import("./pages/admin/PageDetail").then(m => ({ default: m.PageDetail })));
const EmailTemplates = lazy(() => import("./pages/admin/EmailTemplates").then(m => ({ default: m.EmailTemplates })));
const Analytics = lazy(() => import("./pages/admin/Analytics").then(m => ({ default: m.Analytics })));
const AdminSocialProof = lazy(() => import("./pages/admin/SocialProof").then(m => ({ default: m.SocialProof })));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/reviews" element={<AllReviews />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* User routes - protected */}
                  <Route path="/user/profile" element={
                    <ProtectedRoute><Profile /></ProtectedRoute>
                  } />
                  <Route path="/user/orders" element={
                    <ProtectedRoute><UserOrders /></ProtectedRoute>
                  } />
                  <Route path="/user/orders/:id" element={
                    <ProtectedRoute><UserOrderDetail /></ProtectedRoute>
                  } />
                  <Route path="/user/materials" element={
                    <ProtectedRoute><UserMaterials /></ProtectedRoute>
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
                    <Route path="materials" element={<Materials />} />
                    <Route path="galleries" element={<Galleries />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="faq" element={<FAQ />} />
                    <Route path="team" element={<Team />} />
                    <Route path="instagram" element={<Instagram />} />
                    <Route path="texts" element={<Texts />} />
                    <Route path="pages" element={<Pages />} />
                    <Route path="pages/:id" element={<PageDetail />} />
                    <Route path="email-templates" element={<EmailTemplates />} />
                    <Route path="analytics/*" element={<Analytics />} />
                    <Route path="social-proof/*" element={<AdminSocialProof />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="comparison" element={<Comparison />} />
                  </Route>

                  {/* Product direct links */}
                  <Route path="/nabory-fetru/:slug" element={<Index />} />

                  {/* Dynamic page routes - must be after admin routes */}
                  <Route path="/:slug" element={<Page />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
