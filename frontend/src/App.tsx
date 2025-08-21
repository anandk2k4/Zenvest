// src/App.tsx
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";

import Home from "@/pages/Home";
import DashboardLayout from "@/pages/Dashboard/Dashboard";
import DashboardHome from "@/pages/Dashboard/DashHome";
import Budget from "@/pages/Dashboard/Budget";
import Goals from "@/pages/Dashboard/Goals";
import AIInsight from "@/pages/Dashboard/ChatBot";
import Reports from "@/pages/Dashboard/Reports";
import Portfolio from "@/pages/Dashboard/Portfolio";
import News from "@/pages/Dashboard/News";


const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>
          {/* Home route */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" />
                </SignedIn>
                <SignedOut>
                  <Home />
                </SignedOut>
              </>
            }
          />

          {/* Clerk auth routes */}
          <Route path="/sign-in/*" element={<SignIn forceRedirectUrl="/dashboard" />} />
          <Route path="/sign-up/*" element={<SignUp forceRedirectUrl="/dashboard" />} />

          {/* Protected Dashboard with nested routes */}
          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <DashboardLayout />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          >
            {/* Nested Pages under /dashboard */}
            <Route index element={<DashboardHome />} />
            <Route path="budget" element={<Budget />} />
            <Route path="goals" element={<Goals />} />
            <Route path="ai" element={<AIInsight />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="reports" element={<Reports />} />
            <Route path="news" element={<News />} />
          </Route>
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;
