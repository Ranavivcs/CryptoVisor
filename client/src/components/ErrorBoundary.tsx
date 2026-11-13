import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** What to show instead of the children after a render error. `reset` tries rendering them again. */
  fallback: (reset: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches an error thrown while rendering its children, so it breaks one part of the page instead
 * of unmounting the whole app (React's default). Used by SectionCard around each card's content:
 * with it, "one failing source affects one card" also holds for unexpected data, not just failed requests.
 * It's a class because React only offers error boundaries as class components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  /** React calls this after a child throws; the returned state switches to the fallback. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /** Logs the error with the component stack, for debugging in the browser console. */
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('A dashboard card failed to render.', error, info.componentStack);
  }

  /** Clears the error, so the children render again (used by the fallback's retry button). */
  reset = () => this.setState({ error: null });

  render() {
    return this.state.error ? this.props.fallback(this.reset) : this.props.children;
  }
}
