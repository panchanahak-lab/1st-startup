import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorHandler extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontFamily: 'monospace',
                    minHeight: '100vh',
                    overflow: 'auto'
                }}>
                    <h1 style={{ color: '#ef4444', fontSize: '2rem' }}>Application Crashed</h1>
                    <p style={{ marginBottom: '2rem' }}>Something went wrong while rendering the application.</p>

                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '2rem',
                        border: '1px solid #334155'
                    }}>
                        <h2 style={{ color: '#fca5a5', marginTop: 0 }}>Error:</h2>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#f8fafc' }}>
                            {this.state.error?.toString()}
                        </pre>
                    </div>

                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #334155'
                    }}>
                        <h2 style={{ color: '#94a3b8', marginTop: 0 }}>Stack Trace:</h2>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: '#cbd5e1' }}>
                            {this.state.errorInfo?.componentStack || this.state.error?.stack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
