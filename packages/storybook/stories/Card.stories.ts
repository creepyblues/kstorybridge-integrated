import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@kstorybridge/ui';
import { createElement } from 'react';

const meta: Meta<typeof Card> = {
  title: 'KStoryBridge/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, content, and footer sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => createElement(Card, { className: "w-[350px]" },
    createElement(CardHeader, {},
      createElement(CardTitle, {}, "Card Title"),
      createElement(CardDescription, {}, "Card Description")
    ),
    createElement(CardContent, {},
      createElement('p', {}, "Card content goes here.")
    ),
    createElement(CardFooter, { className: "flex justify-between" },
      createElement(Button, { variant: "outline" }, "Cancel"),
      createElement(Button, {}, "Deploy")
    )
  ),
};

export const HeaderOnly: Story = {
  render: () => createElement(Card, { className: "w-[350px]" },
    createElement(CardHeader, {},
      createElement(CardTitle, {}, "Settings"),
      createElement(CardDescription, {}, "Make changes to your account here.")
    )
  ),
};

export const WithContent: Story = {
  render: () => createElement(Card, { className: "w-[350px]" },
    createElement(CardContent, { className: "pt-6" },
      createElement('div', { className: "space-y-4" },
        createElement('div', { className: "space-y-2" },
          createElement('h4', { className: "text-sm font-medium" }, "Overview"),
          createElement('p', { className: "text-sm text-muted-foreground" }, 
            "An overview of the application features."
          )
        )
      )
    )
  ),
};

export const KStoryBridgeExample: Story = {
  render: () => createElement(Card, { className: "w-[350px]" },
    createElement(CardHeader, {},
      createElement(CardTitle, {}, "웹툰 제목"),
      createElement(CardDescription, {}, "Korean Webtoon • Romance")
    ),
    createElement(CardContent, {},
      createElement('div', { className: "space-y-2" },
        createElement('p', { className: "text-sm" }, "A captivating story about..."),
        createElement('div', { className: "flex gap-2" },
          createElement('span', { className: "px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs" }, "Views: 1.2M"),
          createElement('span', { className: "px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs" }, "Likes: 45K")
        )
      )
    ),
    createElement(CardFooter, {},
      createElement(Button, { className: "w-full" }, "View Details")
    )
  ),
};