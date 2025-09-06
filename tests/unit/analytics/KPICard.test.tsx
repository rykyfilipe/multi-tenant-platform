/** @format */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { KPICard } from '@/components/analytics/KPICard';
import { Database, Users, TrendingUp } from 'lucide-react';

describe('KPICard Component', () => {
  const defaultProps = {
    title: 'Total Users',
    value: 1250,
    icon: Users,
  };

  it('renders with basic props', async () => {
    render(<KPICard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument();
    });
  });

  it('formats large numbers correctly', async () => {
    const { rerender } = render(<KPICard {...defaultProps} value={1500000} />);
    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    rerender(<KPICard {...defaultProps} value={15000} />);
    await waitFor(() => {
      expect(screen.getByText('15.0K')).toBeInTheDocument();
    });

    rerender(<KPICard {...defaultProps} value={500} />);
    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('displays change indicator with increase trend', async () => {
    render(
      <KPICard
        {...defaultProps}
        change={12.5}
        changeType="increase"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('13%')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });
  });

  it('displays change indicator with decrease trend', async () => {
    render(
      <KPICard
        {...defaultProps}
        change={8.3}
        changeType="decrease"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('8%')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
    });
  });

  it('displays change indicator with neutral trend', async () => {
    render(
      <KPICard
        {...defaultProps}
        change={0}
        changeType="neutral"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    });
  });

  it('displays unit when provided', async () => {
    render(
      <KPICard
        {...defaultProps}
        value={85.5}
        unit="%"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('85.5')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('%')).toBeInTheDocument();
    });
  });

  it('displays description when provided', async () => {
    render(
      <KPICard
        {...defaultProps}
        description="Active users in the last 30 days"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Active users in the last 30 days')).toBeInTheDocument();
    });
  });

  it('applies correct color theme', async () => {
    const { rerender } = render(<KPICard {...defaultProps} color="green" />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-green-500/10', 'text-green-600');
    });

    rerender(<KPICard {...defaultProps} color="red" />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-red-500/10', 'text-red-600');
    });

    rerender(<KPICard {...defaultProps} color="purple" />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-purple-500/10', 'text-purple-600');
    });
  });

  it('handles string values correctly', async () => {
    render(<KPICard {...defaultProps} value="N/A" />);
    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('applies animation delay correctly', async () => {
    const { container } = render(<KPICard {...defaultProps} delay={0.5} />);
    await waitFor(() => {
      const motionDiv = container.querySelector('div[style*="opacity"]');
      expect(motionDiv).toBeInTheDocument();
    });
  });
});
