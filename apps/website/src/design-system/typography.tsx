/**
 * Typography System Components
 * Consistent, semantic typography across the application
 */
import React from 'react';
import { cn } from '@/lib/utils';

// Base text component with design system integration
interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'strong' | 'em' | 'small';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'inverse';
  align?: 'left' | 'center' | 'right';
}

export const Text: React.FC<TextProps> = ({
  as: Component = 'p',
  size = 'base',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const weightClasses = {
    light: 'font-light',
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses = {
    primary: 'text-midnight-ink-900',
    secondary: 'text-midnight-ink-600',
    muted: 'text-midnight-ink-500',
    accent: 'text-hanok-teal-500',
    inverse: 'text-white',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        'leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Heading components
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'accent' | 'inverse';
  align?: 'left' | 'center' | 'right';
}

export const Heading: React.FC<HeadingProps> = ({
  level,
  size,
  weight = 'bold',
  color = 'primary',
  align = 'left',
  className,
  children,
  ...props
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  // Default size based on heading level if not specified
  const defaultSizes = {
    1: '4xl',
    2: '3xl',
    3: '2xl',
    4: 'xl',
    5: 'lg',
    6: 'md',
  } as const;

  const actualSize = size || defaultSizes[level];

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl md:text-4xl',
    '4xl': 'text-4xl md:text-5xl',
    '5xl': 'text-5xl md:text-6xl',
    '6xl': 'text-6xl md:text-7xl',
  };

  const weightClasses = {
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  };

  const colorClasses = {
    primary: 'text-midnight-ink-900',
    secondary: 'text-midnight-ink-600',
    accent: 'text-hanok-teal-500',
    inverse: 'text-white',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <Component
      className={cn(
        sizeClasses[actualSize],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        'leading-tight tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Specialized typography components
export const Display: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={1} size="6xl" weight="extrabold" {...props} />
);

export const Title: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={2} size="4xl" weight="bold" {...props} />
);

export const Subtitle: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={3} size="2xl" weight="semibold" {...props} />
);

export const SectionHeading: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={2} size="3xl" weight="bold" {...props} />
);

export const CardTitle: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={3} size="xl" weight="semibold" {...props} />
);

// Body text variants
export const BodyText: React.FC<Omit<TextProps, 'size'>> = (props) => (
  <Text size="base" {...props} />
);

export const LeadText: React.FC<Omit<TextProps, 'size' | 'weight'>> = (props) => (
  <Text size="lg" weight="regular" color="secondary" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'size' | 'color'>> = (props) => (
  <Text size="sm" color="muted" {...props} />
);

export const Label: React.FC<Omit<TextProps, 'size' | 'weight'>> = (props) => (
  <Text size="sm" weight="medium" {...props} />
);

// Link component
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'subtle' | 'accent';
  size?: 'sm' | 'base' | 'lg';
}

export const Link: React.FC<LinkProps> = ({
  variant = 'default',
  size = 'base',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'text-hanok-teal-500 hover:text-hanok-teal-600 underline underline-offset-4',
    subtle: 'text-midnight-ink-600 hover:text-midnight-ink-900 hover:underline underline-offset-4',
    accent: 'text-sunrise-coral-500 hover:text-sunrise-coral-600 underline underline-offset-4',
  };

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  return (
    <a
      className={cn(
        'transition-colors duration-200 font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
};

// Utility components
export const Prose: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'prose prose-lg max-w-none',
      'prose-headings:text-midnight-ink-900 prose-headings:font-bold',
      'prose-p:text-midnight-ink-700 prose-p:leading-relaxed',
      'prose-a:text-hanok-teal-500 prose-a:font-medium hover:prose-a:text-hanok-teal-600',
      'prose-strong:text-midnight-ink-900 prose-strong:font-semibold',
      'prose-code:text-hanok-teal-700 prose-code:bg-hanok-teal-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
      className
    )}
    {...props}
  >
    {children}
  </div>
);