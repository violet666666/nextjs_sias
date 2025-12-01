'use client';
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Send error to monitoring service (e.g., Sentry)
    this.logErrorToService(error, errorInfo, errorId);
  }

  logErrorToService = async (error, errorInfo, errorId) => {
    try {
      // You can integrate with services like Sentry, LogRocket, etc.
      await fetch('/api/error-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const ErrorFallback = ({ error, errorInfo, errorId, onRetry }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>

          {/* Error ID for support */}
          {errorId && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Error ID: <span className="font-mono text-xs">{errorId}</span>
              </p>
            </div>
          )}

          {/* Development Error Details */}
          {isDevelopment && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                {errorInfo && errorInfo.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <div className="flex space-x-3">
              <Link
                href="/cpanel/dashboard"
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>

          {/* Support Contact */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact support at{' '}
              <a
                href="mailto:support@sias.ac.id"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                support@sias.ac.id
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Page Component
export const ErrorPage = ({ 
  statusCode = 500, 
  title = "Something went wrong", 
  message = "An unexpected error occurred",
  showHomeButton = true,
  showBackButton = true 
}) => {
  const getErrorIcon = (code) => {
    switch (code) {
      case 404:
        return (
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
        );
      case 403:
        return (
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          {getErrorIcon(statusCode)}
          
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {statusCode} - {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          <div className="flex space-x-3">
            {showHomeButton && (
              <Link
                href="/cpanel/dashboard"
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Link>
            )}
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Network Error Component
export const NetworkError = ({ onRetry, message = "Network connection error" }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {message}
          </p>
          <p className="text-sm text-red-700 dark:text-red-300">
            Please check your internet connection and try again.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary; 