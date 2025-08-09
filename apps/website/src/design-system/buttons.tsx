/**
 * Enhanced Button System
 * Professional, consistent button components with proper states and accessibility
 */
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Button variants using CVA for better type safety and consistency
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'ring-offset-white transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanok-teal-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none cursor-pointer',
  ],
  {
    variants: {
      variant: {
        // Primary brand button
        primary: [
          'bg-hanok-teal-500 text-white shadow',
          'hover:bg-hanok-teal-600 active:bg-hanok-teal-700',
          'focus-visible:ring-hanok-teal-500',
        ],
        // Secondary accent button  
        secondary: [
          'bg-sunrise-coral-500 text-white shadow',
          'hover:bg-sunrise-coral-600 active:bg-sunrise-coral-700',
          'focus-visible:ring-sunrise-coral-500',
        ],
        // Outlined button
        outline: [
          'border-2 border-hanok-teal-500 text-hanok-teal-600 bg-transparent',
          'hover:bg-hanok-teal-50 hover:text-hanok-teal-700',
          'active:bg-hanok-teal-100',
        ],
        // Ghost button
        ghost: [
          'text-hanok-teal-600 bg-transparent',
          'hover:bg-hanok-teal-50 hover:text-hanok-teal-700',
          'active:bg-hanok-teal-100',
        ],
        // Subtle button
        subtle: [
          'bg-porcelain-blue-100 text-midnight-ink-700',
          'hover:bg-porcelain-blue-200 hover:text-midnight-ink-800',
          'active:bg-porcelain-blue-300',
        ],
        // Link style button
        link: [
          'text-hanok-teal-500 underline-offset-4',
          'hover:text-hanok-teal-600 hover:underline',
          'active:text-hanok-teal-700',
          'bg-transparent shadow-none',
        ],
        // Destructive button
        destructive: [
          'bg-red-500 text-white shadow',
          'hover:bg-red-600 active:bg-red-700',
          'focus-visible:ring-red-500',
        ],
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 rounded-md px-8 text-base',
        xl: 'h-14 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// Button group component for related actions
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md';
  attached?: boolean;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  orientation = 'horizontal',
  spacing = 'sm',
  attached = false,
  className,
  children,
  ...props
}) => {
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };

  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
  };

  const attachedClasses = attached
    ? {
        horizontal: '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0',
        vertical: '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:border-t-0',
      }[orientation]
    : '';

  return (
    <div
      className={cn(
        'flex',
        orientationClasses[orientation],
        !attached && spacingClasses[spacing],
        attachedClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Icon button component
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn('flex-shrink-0', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';

// Floating Action Button
interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  size?: 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingActionButton: React.FC<FABProps> = ({
  size = 'lg',
  position = 'bottom-right',
  className,
  ...props
}) => {
  const sizeClasses = {
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <Button
      variant="primary"
      className={cn(
        'rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200',
        'z-50',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
      {...props}
    />
  );
};

// Button with tooltip (requires Tooltip component)
interface TooltipButtonProps extends ButtonProps {
  tooltip?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
  tooltip,
  tooltipSide = 'top',
  ...buttonProps
}) => {
  // This would integrate with your tooltip system
  // For now, just render the button with title attribute
  return <Button title={tooltip} {...buttonProps} />;
};

// Call-to-action button with enhanced styling
const CTAButton: React.FC<ButtonProps> = ({ className, ...props }) => (
  <Button
    variant="secondary"
    size="lg"
    className={cn(
      'font-semibold tracking-wide uppercase',
      'transform transition-transform duration-200',
      'hover:scale-105 active:scale-95',
      'shadow-lg hover:shadow-xl',
      className
    )}
    {...props}
  />
);

export {
  Button,
  ButtonGroup,
  IconButton,
  FloatingActionButton,
  TooltipButton,
  CTAButton,
  buttonVariants,
};