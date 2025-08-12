import type { Meta, StoryObj } from '@storybook/react';
import { Input, Label } from '@kstorybridge/ui';
import { createElement } from 'react';

const meta: Meta<typeof Input> = {
  title: 'KStoryBridge/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component for forms and user interactions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
      description: 'The type of input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
  },
  args: {
    placeholder: 'Enter text...',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'This input is disabled',
  },
};

export const WithLabel: Story = {
  render: () => createElement('div', { className: "grid w-full max-w-sm items-center gap-1.5" },
    createElement(Label, { htmlFor: "email" }, "Email"),
    createElement(Input, { type: "email", id: "email", placeholder: "Email" })
  ),
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search titles...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
};

export const KoreanExample: Story = {
  render: () => createElement('div', { className: "grid w-full max-w-sm items-center gap-1.5" },
    createElement(Label, { htmlFor: "korean-title" }, "웹툰 제목"),
    createElement(Input, { 
      id: "korean-title", 
      placeholder: "웹툰 제목을 입력하세요...",
      defaultValue: "러브 시뮬레이터"
    })
  ),
};