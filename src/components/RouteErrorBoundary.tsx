import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detect chunk loading errors (lazy loading failures)
    const isChunkError = 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError');

    return { hasError: true, error, isChunkError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route error:', error, errorInfo);
    console.error('Route name:', this.props.routeName);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const { routeName } = this.props;
      const { isChunkError, error } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>
                  {isChunkError ? 'Loading Error' : 'Page Error'}
                </CardTitle>
              </div>
              <CardDescription>
                {isChunkError 
                  ? 'Failed to load this page. This usually happens after an update. Please refresh the page.'
                  : `An error occurred ${routeName ? `on the ${routeName} page` : 'while loading this page'}.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && !isChunkError && (
                <div className="p-3 bg-muted rounded-md text-sm font-mono overflow-auto max-h-32 text-muted-foreground">
                  {error.message}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReload} 
                  className="flex-1 gap-2"
                  variant={isChunkError ? "default" : "outline"}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  variant={isChunkError ? "outline" : "default"}
                  className="flex-1 gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
