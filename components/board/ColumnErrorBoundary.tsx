"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type Props = {
  children: ReactNode;
  columnLabel: string;
  onRetry: () => void;
  fallback?: ReactNode;
};

type State = { hasError: boolean; error: Error | null };

export class ColumnErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ColumnErrorBoundary]", this.props.columnLabel, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex min-w-[280px] flex-col rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          role="alert"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm">{this.props.columnLabel}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Something went wrong loading this column.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onRetry();
            }}
          >
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
