'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>⚠️ Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg">
                  We&apos;re sorry, but something unexpected happened. 
                  Please try refreshing the page.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="primary"
                    className="w-full"
                  >
                    🔄 Refresh Page
                  </Button>
                  <Button
                    onClick={() => this.setState({ hasError: false })}
                    variant="secondary"
                    className="w-full"
                  >
                    ↩️ Try Again
                  </Button>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="font-bold cursor-pointer">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 border-3 border-black text-sm overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}