import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify testing setup works
describe('Website Test Setup', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Website Testing Works!</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Website Testing Works!')).toBeInTheDocument();
  });

  it('should perform basic assertions', () => {
    expect(2 + 2).toBe(4);
    expect('website').toMatch(/web/);
  });
});