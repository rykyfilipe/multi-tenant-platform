/** @format */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/analytics/KPICard';
import { Database, Users, TrendingUp } from 'lucide-react';

describe('KPICard Component', () => {
  const defaultProps = {
    title: 'Total Users',
    value: 1250,
    icon: Users,
  };

  it('renders with basic props', () => {
    render(<KPICard {...defaultProps} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const { rerender } = render(<KPICard {...defaultProps} value={1500000} />);
    expect(screen.getByText('1.5M')).toBeInTheDocument();

    rerender(<KPICard {...defaultProps} value={15000} />);
    expect(screen.getByText('15.0K')).toBeInTheDocument();

    rerender(<KPICard {...defaultProps} value={500} />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('displays change indicator with increase trend', () => {
    render(
      <KPICard
        {...defaultProps}
        change={12.5}
        changeType="increase"
      />
    );
    
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
  });

  it('displays change indicator with decrease trend', () => {
    render(
      <KPICard
        {...defaultProps}
        change={8.3}
        changeType="decrease"
      />
    );
    
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
  });

  it('displays change indicator with neutral trend', () => {
    render(
      <KPICard
        {...defaultProps}
        change={0}
        changeType="neutral"
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  it('displays unit when provided', () => {
    render(
      <KPICard
        {...defaultProps}
        value={85.5}
        unit="%"
      />
    );
    
    expect(screen.getByText('85.5%')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <KPICard
        {...defaultProps}
        description="Active users in the last 30 days"
      />
    );
    
    expect(screen.getByText('Active users in the last 30 days')).toBeInTheDocument();
  });

  it('applies correct color theme', () => {
    const { rerender } = render(<KPICard {...defaultProps} color="green" />);
    expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-green-500/10', 'text-green-600');

    rerender(<KPICard {...defaultProps} color="red" />);
    expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-red-500/10', 'text-red-600');

    rerender(<KPICard {...defaultProps} color="purple" />);
    expect(screen.getByTestId('kpi-card-icon')).toHaveClass('bg-purple-500/10', 'text-purple-600');
  });

  it('handles string values correctly', () => {
    render(<KPICard {...defaultProps} value="N/A" />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('applies animation delay correctly', () => {
    const { container } = render(<KPICard {...defaultProps} delay={0.5} />);
    const motionDiv = container.querySelector('[style*="transition-delay"]');
    expect(motionDiv).toBeInTheDocument();
  });
});
