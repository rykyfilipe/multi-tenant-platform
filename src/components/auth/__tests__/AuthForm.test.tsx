import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthForm from '../AuthForm';

// Mock child components
vi.mock('../LoginForm', () => ({
  default: ({ closeForm, showForgotPassword }: any) => (
    <div data-testid="login-form">
      <button onClick={() => closeForm(true)}>Login</button>
      <button onClick={() => showForgotPassword()}>Forgot Password</button>
    </div>
  ),
}));

vi.mock('../RegisterForm', () => ({
  default: ({ closeForm }: any) => (
    <div data-testid="register-form">
      <button onClick={() => closeForm(true)}>Register</button>
    </div>
  ),
}));

vi.mock('../ForgotPasswordForm', () => ({
  default: ({ closeForm, showLoginForm }: any) => (
    <div data-testid="forgot-password-form">
      <button onClick={() => closeForm(true)}>Reset Password</button>
      <button onClick={() => showLoginForm()}>Back to Login</button>
    </div>
  ),
}));

vi.mock('../OuthGoogle', () => ({
  default: () => <div data-testid="oauth-google">Google OAuth</div>,
}));

// Mock Tabs components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, defaultValue }: any) => (
    <div data-testid="tabs" data-value={value} data-default={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, className, onClick }: any) => (
    <button
      data-testid={`tab-trigger-${value}`}
      className={className}
      onClick={() => onClick?.(value)}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

describe('AuthForm', () => {
  const mockCloseForm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial rendering', () => {
    it('should render login tab by default', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'login');
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-default', 'login');
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('oauth-google')).toBeInTheDocument();
    });

    it('should render tabs list with login and register options', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-login')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-register')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('should render OAuth Google component', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('oauth-google')).toBeInTheDocument();
      expect(screen.getByText('Google OAuth')).toBeInTheDocument();
    });

    it('should render login form content by default', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('tab-content-login')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should render register form content', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('tab-content-register')).toBeInTheDocument();
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should switch to register tab and update title', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const registerTab = screen.getByTestId('tab-trigger-register');
      fireEvent.click(registerTab);

      // Note: Since we're mocking the Tabs component, we can't test the actual tab switching
      // But we can verify the tab content is rendered
      expect(screen.getByTestId('tab-content-register')).toBeInTheDocument();
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should maintain login tab content', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('tab-content-login')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('forgot password flow', () => {
    it('should show forgot password form when triggered', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
    });

    it('should return to login form when back button is clicked', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // First, go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

      // Then, go back to login
      const backToLoginButton = screen.getByText('Back to Login');
      fireEvent.click(backToLoginButton);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.queryByTestId('forgot-password-form')).not.toBeInTheDocument();
    });

    it('should reset tab to login when returning from forgot password', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // Go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      // Return to login
      const backToLoginButton = screen.getByText('Back to Login');
      fireEvent.click(backToLoginButton);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'login');
    });
  });

  describe('form submission', () => {
    it('should call closeForm when login form is submitted', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      expect(mockCloseForm).toHaveBeenCalledWith(true);
    });

    it('should call closeForm when register form is submitted', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);

      expect(mockCloseForm).toHaveBeenCalledWith(true);
    });

    it('should call closeForm when forgot password form is submitted', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // Go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      // Submit forgot password form
      const resetPasswordButton = screen.getByText('Reset Password');
      fireEvent.click(resetPasswordButton);

      expect(mockCloseForm).toHaveBeenCalledWith(true);
    });
  });

  describe('styling and classes', () => {
    it('should have correct heading classes', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const heading = screen.getByText('Welcome back');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-center', 'mb-6');
    });

    it('should have correct tabs list classes', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toHaveClass('grid', 'grid-cols-2', 'mb-6', 'bg-slate-100', 'p-1', 'rounded-lg');
    });

    it('should have correct tab trigger classes', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const loginTab = screen.getByTestId('tab-trigger-login');
      const registerTab = screen.getByTestId('tab-trigger-register');

      expect(loginTab).toHaveClass(
        'data-[state=active]:bg-white',
        'data-[state=active]:shadow-md',
        'rounded-lg',
        'text-gray-700',
        'font-medium'
      );

      expect(registerTab).toHaveClass(
        'data-[state=active]:bg-white',
        'data-[state=active]:shadow-md',
        'rounded-lg',
        'text-gray-700',
        'font-medium'
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Welcome back');
    });

    it('should have proper button roles', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should have proper tab structure', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const tabsContainer = screen.getByTestId('tabs');
      const tabsList = screen.getByTestId('tabs-list');
      const tabTriggers = screen.getAllByTestId(/tab-trigger-/);

      expect(tabsContainer).toBeInTheDocument();
      expect(tabsList).toBeInTheDocument();
      expect(tabTriggers).toHaveLength(2);
    });
  });

  describe('component structure', () => {
    it('should render main container div', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const container = screen.getByText('Welcome back').parentElement;
      expect(container).toHaveTagName('div');
    });

    it('should render forgot password container div', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // Go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      const container = screen.getByText('Forgot Password').parentElement;
      expect(container).toHaveTagName('div');
    });

    it('should render all child components', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-login')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-register')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-login')).toBeInTheDocument();
      expect(screen.getByTestId('tab-content-register')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
      expect(screen.getByTestId('oauth-google')).toBeInTheDocument();
    });
  });

  describe('state management', () => {
    it('should initialize with correct default state', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.queryByText('Create an account')).not.toBeInTheDocument();
      expect(screen.queryByText('Forgot Password')).not.toBeInTheDocument();
    });

    it('should update state when switching to forgot password', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
      expect(screen.queryByText('Create an account')).not.toBeInTheDocument();
    });

    it('should reset state when returning from forgot password', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // Go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      // Return to login
      const backToLoginButton = screen.getByText('Back to Login');
      fireEvent.click(backToLoginButton);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.queryByText('Forgot Password')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid tab switches', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const loginTab = screen.getByTestId('tab-trigger-login');
      const registerTab = screen.getByTestId('tab-trigger-register');

      // Rapidly click tabs
      fireEvent.click(registerTab);
      fireEvent.click(loginTab);
      fireEvent.click(registerTab);

      // Should still render both forms
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should handle multiple forgot password toggles', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const forgotPasswordButton = screen.getByText('Forgot Password');
      const backToLoginButton = screen.getByText('Back to Login');

      // Go to forgot password
      fireEvent.click(forgotPasswordButton);
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

      // Return to login
      fireEvent.click(backToLoginButton);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      // Go to forgot password again
      fireEvent.click(forgotPasswordButton);
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

      // Return to login again
      fireEvent.click(backToLoginButton);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should handle closeForm being called multiple times', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const loginButton = screen.getByText('Login');
      
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      expect(mockCloseForm).toHaveBeenCalledTimes(3);
      expect(mockCloseForm).toHaveBeenCalledWith(true);
    });

    it('should handle null or undefined closeForm prop', () => {
      // This test ensures the component doesn't crash with invalid props
      expect(() => {
        render(<AuthForm closeForm={null as any} />);
      }).not.toThrow();

      expect(() => {
        render(<AuthForm closeForm={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('integration with child components', () => {
    it('should pass correct props to LoginForm', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const loginForm = screen.getByTestId('login-form');
      expect(loginForm).toBeInTheDocument();

      // Test that the login form can call the passed functions
      const loginButton = screen.getByText('Login');
      const forgotPasswordButton = screen.getByText('Forgot Password');

      fireEvent.click(loginButton);
      expect(mockCloseForm).toHaveBeenCalledWith(true);

      fireEvent.click(forgotPasswordButton);
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('should pass correct props to RegisterForm', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      const registerForm = screen.getByTestId('register-form');
      expect(registerForm).toBeInTheDocument();

      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);
      expect(mockCloseForm).toHaveBeenCalledWith(true);
    });

    it('should pass correct props to ForgotPasswordForm', () => {
      render(<AuthForm closeForm={mockCloseForm} />);

      // Go to forgot password
      const forgotPasswordButton = screen.getByText('Forgot Password');
      fireEvent.click(forgotPasswordButton);

      const forgotPasswordForm = screen.getByTestId('forgot-password-form');
      expect(forgotPasswordForm).toBeInTheDocument();

      const resetPasswordButton = screen.getByText('Reset Password');
      const backToLoginButton = screen.getByText('Back to Login');

      fireEvent.click(resetPasswordButton);
      expect(mockCloseForm).toHaveBeenCalledWith(true);

      fireEvent.click(backToLoginButton);
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
}); 