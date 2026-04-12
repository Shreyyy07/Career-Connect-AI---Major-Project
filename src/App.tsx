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
import HRJobsPage from "./pages/HRJobsPage.tsx";
import HRCandidatesPage from "./pages/HRCandidatesPage.tsx";
import HRAntiCheatPage from "./pages/HRAntiCheatPage.tsx";
import HRProfile from "./pages/HRProfile.tsx";
import AIInterview from "./pages/AIInterview.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./context/AuthContext";
import ResumeMatch from "./pages/ResumeMatch";
import { Assessments } from "./pages/Assessments";
import { EvaluationResult } from "./pages/EvaluationResult";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import CandidateProfile from "./pages/CandidateProfile.tsx";
import CandidateReports from "./pages/CandidateReports.tsx";
import CandidateSkills from "./pages/CandidateSkills.tsx";
import { VanAgent } from "./components/VoiceAgent/VanAgent";
import AboutAuthor from "./pages/AboutAuthor.tsx";
import GuideCandidate from "./pages/GuideCandidate.tsx";
import GuideRecruiter from "./pages/GuideRecruiter.tsx";
import FAQs from "./pages/FAQs.tsx";

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
          <Route path="/about" element={<AboutAuthor />} />
          <Route path="/guide-candidate" element={<GuideCandidate />} />
          <Route path="/guide-recruiter" element={<GuideRecruiter />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/profile" element={<CandidateProfile />} />
          <Route path="/candidate/resume" element={<ResumeMatch />} />
          <Route path="/candidate/interview" element={<AIInterview />} />
          <Route path="/candidate/skills" element={<CandidateSkills />} />
          <Route path="/candidate/assessments" element={<Assessments />} />
          <Route path="/candidate/evaluation/:id" element={<EvaluationResult />} />
          <Route path="/candidate/reports" element={<CandidateReports />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/jobs" element={<HRJobsPage />} />
          <Route path="/hr/candidates" element={<HRCandidatesPage />} />
          <Route path="/hr/anticheat" element={<HRAntiCheatPage />} />
          <Route path="/hr/profile" element={<HRProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <VanAgent />
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
