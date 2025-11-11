import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load all route components for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Booking = lazy(() => import("./pages/Booking"));
const MasterSchedule = lazy(() => import("./pages/MasterSchedule"));
const Schedule = lazy(() => import("./pages/Schedule"));
const AdminSchedule = lazy(() => import("./pages/AdminSchedule"));
const ParentHome = lazy(() => import("./pages/ParentHome"));
const UpdateProgress = lazy(() => import("./pages/UpdateProgress"));
const CoordinatorHub = lazy(() => import("./pages/CoordinatorHub"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PosApproval = lazy(() => import("./pages/PosApproval"));
const WaiverCompletion = lazy(() => import("./pages/WaiverCompletion"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/parent-home" element={<ParentHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/coordinator" element={<CoordinatorHub />} />
            <Route path="/update-progress" element={<UpdateProgress />} />
            <Route path="/admin/master-schedule" element={<MasterSchedule />} />
            <Route path="/pos-approval/:requestId" element={<PosApproval />} />
            <Route path="/waivers" element={<WaiverCompletion />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
