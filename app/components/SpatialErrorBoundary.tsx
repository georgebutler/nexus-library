"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type SpatialErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError: (error: Error) => void;
};

type SpatialErrorBoundaryState = {
  hasError: boolean;
};

export class SpatialErrorBoundary extends Component<
  SpatialErrorBoundaryProps,
  SpatialErrorBoundaryState
> {
  state: SpatialErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    return this.state.hasError
      ? this.props.fallback
      : this.props.children;
  }
}
