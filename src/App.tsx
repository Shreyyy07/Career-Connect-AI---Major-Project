import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import CandidateDashboard from "./pages/CandidateDashboard.tsx";
import HRDashboard from "./pages/HRDashboard.tsx";
import AIInterview from "./pages/AIInterview.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./context/AuthContext";
import { ResumeMatch } from "./pages/ResumeMatch";
import { Assessments } from "./pages/Assessments";
import { EvaluationResult } from "./pages/EvaluationResult";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/resume" element={<ResumeMatch />} />
          <Route path="/candidate/interview" element={<AIInterview />} />
          <Route path="/candidate/skills" element={<ResumeMatch />} />
          <Route path="/candidate/assessments" element={<Assessments />} />
          <Route path="/candidate/evaluation/:id" element={<EvaluationResult />} />
          <Route path="/candidate/reports" element={<CandidateDashboard />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/jobs" element={<HRDashboard />} />
          <Route path="/hr/candidates" element={<HRDashboard />} />
          <Route path="/hr/interviews" element={<HRDashboard />} />
          <Route path="/hr/anticheat" element={<HRDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
