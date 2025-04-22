import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import QuestionnairePage from "@/pages/QuestionnairePage";
import ResultsPage from "@/pages/ResultsPage";
import JoinTeamPage from "@/pages/join-team-page";
import ChurchProfilePage from "@/pages/church-profile-page";
import ChurchDashboardPage from "@/pages/church-dashboard-page";
import RecommendationsPage from "@/pages/recommendations-page";
import TeamUnifiedPage from "@/pages/team-unified-page";
import SubscriptionPage from "@/pages/subscription-page";
import ProfileSettingsPage from "@/pages/profile-settings-page";
import MembersPage from "@/pages/members-page";
import PrivacyPolicyPage from "@/pages/privacy-policy-page";
import TermsAndConditionsPage from "@/pages/terms-and-conditions-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { NavigationProvider } from "@/components/NavigationProvider";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

// Main redirection component for home page
function HomeRedirector() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Always define the useEffect hook, but only trigger redirects conditionally
  useEffect(() => {
    if (!isLoading && user) {
      // If user is team leader, redirect to dashboard
      if (user.role === 'teamleader') {
        navigate('/teams');
      } 
      // If user is team member with team ID, show results
      else if (user.role === 'user' && user.teamId) {
        navigate('/results');
      } 
      // If user is regular user without team ID, show questionnaire
      else if (user.role === 'user') {
        navigate('/questionnaire');
      }
    }
  }, [user, isLoading, navigate]);
  
  // Show loading state while authentication is checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Not logged in, show landing page
  if (!user) {
    return <HomePage />;
  }
  
  // During redirect, show loading
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirector />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/questionnaire" element={<ProtectedRoute><QuestionnairePage /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><TeamUnifiedPage /></ProtectedRoute>} />
      <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamUnifiedPage /></ProtectedRoute>} />
      <Route path="/teams/:teamId" element={<ProtectedRoute><TeamUnifiedPage /></ProtectedRoute>} />
      <Route path="/church-profile" element={<ProtectedRoute><ChurchProfilePage /></ProtectedRoute>} />
      <Route path="/church-dashboard" element={<ProtectedRoute><ChurchDashboardPage /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/join/:inviteCode" element={<JoinTeamPage />} />
      <Route path="/join-church/:inviteCode" element={<JoinTeamPage />} />
      
      {/* Add alias route for case-insensitive matching - if someone manually types the URL with capital letters */}
      <Route path="/JOIN/:inviteCode" element={<JoinTeamPage />} />
      <Route path="/JOIN-CHURCH/:inviteCode" element={<JoinTeamPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NavigationProvider>
            <Router />
            <Toaster />
          </NavigationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
