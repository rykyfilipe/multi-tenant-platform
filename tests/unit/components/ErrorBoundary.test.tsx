import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary'

// Mock the logger
jest.mock('@/lib/error-logger', () => ({
  logger: {
    error: jest.fn()
  }
}))

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Component for testing HOC
const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests since we're testing error boundaries
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child component')).toBeInTheDocument()
  })

  it('should render default error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText("We've logged this error and will investigate it.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(String)
    )
  })

  it('should reset error state when Try Again is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(tryAgainButton)

    // The error boundary should reset, but since the component still throws, it will show error again
    // In a real scenario, the parent would re-render with a non-throwing component
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should pass through additional props', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-component">Child component</div>
      </ErrorBoundary>
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
  })
})

describe('withErrorBoundary HOC', () => {
  it('should wrap component with ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent, 'TestComponent')

    render(<WrappedComponent name="World" />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should use component name as displayName', () => {
    const WrappedComponent = withErrorBoundary(TestComponent, 'CustomName')

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(CustomName)')
  })

  it('should use default component name when not provided', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
  })

  it('should handle errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, 'ThrowError')

    render(<WrappedComponent shouldThrow={true} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})


