import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AppLayout from "@/pages/app/AppLayout";

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Avoid navigation during render.
  // If not logged in, redirect in an effect.
  // (In hash routing, this keeps things stable under static hosting.)
  //
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (!user) {
    // Render nothing while redirecting
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);
  return null;
}

// Hash-based routing (/#/) supports static hosting and file:// usage.
function AppRouter() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/app/:rest*">
          {() => (
            <Protected>
              <AppLayout />
            </Protected>
          )}
        </Route>
        <Route path="/app">{() => (
          <Protected>
            <Redirect to="/app/overview" />
          </Protected>
        )}</Route>
        <Route>404</Route>
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <I18nProvider defaultLang="zh">
          <AuthProvider>
            <DataProvider>
              <TooltipProvider>
                <Toaster />
                <AppRouter />
              </TooltipProvider>
            </DataProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
