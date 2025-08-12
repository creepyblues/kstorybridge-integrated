import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify testing setup works
describe('Test Setup', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Hello Testing!</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByText('Hello Testing!')).toBeInTheDocument();
  });

  it('should perform basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toMatch(/hello/);
    expect({ name: 'test' }).toHaveProperty('name');
  });
});