import { Component, Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import LoadingState from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";

class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="mx-auto my-6 max-w-lg space-y-3 rounded-lg border border-border p-4">
          <h1 className="text-lg font-semibold">This page could not be loaded</h1>
          <p className="text-sm text-muted-foreground">Check your connection and reload the page to try again. Unsaved edits may be lost when you reload.</p>
          <Button type="button" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <PageErrorBoundary key={pathname}>
      <Suspense fallback={<LoadingState title="Loading page" className="mx-auto my-6 max-w-lg" />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}
