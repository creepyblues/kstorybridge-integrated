import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify testing setup works
describe('Admin Test Setup', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Admin Testing Works!</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Admin Testing Works!')).toBeInTheDocument();
  });

  it('should perform basic assertions', () => {
    expect(3 + 3).toBe(6);
    expect('admin').toMatch(/admin/);
  });
});