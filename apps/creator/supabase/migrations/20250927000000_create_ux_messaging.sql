-- Create UX Messaging table for centralized messaging management
create table if not exists ux_messaging (
  id uuid primary key default uuid_generate_v4(),
  page_route text not null unique,
  page_name text not null,
  account_type text not null check (account_type in ('buyer', 'creator', 'shared')),
  title text not null,
  subtitle text,
  description text,
  cta_text text,
  empty_state_title text,
  empty_state_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists idx_ux_messaging_route on ux_messaging(page_route);
create index if not exists idx_ux_messaging_account_type on ux_messaging(account_type);

-- Enable RLS
alter table ux_messaging enable row level security;

-- Allow all authenticated users to read
create policy "Allow authenticated users to read ux_messaging"
  on ux_messaging for select
  to authenticated
  using (true);

-- Only allow admins to insert/update/delete
create policy "Allow admins to manage ux_messaging"
  on ux_messaging for all
  to authenticated
  using (
    auth.jwt() ->> 'email' in ('sungho@dadble.com', 'kevin@sandstoneartists.com')
  )
  with check (
    auth.jwt() ->> 'email' in ('sungho@dadble.com', 'kevin@sandstoneartists.com')
  );

-- Insert initial messaging data extracted from existing pages
insert into ux_messaging (page_route, page_name, account_type, title, subtitle, description, cta_text, empty_state_title, empty_state_description) values

-- Authentication Pages
('/signup/buyer', 'Buyer Signup', 'buyer', 'Join KStoryBridge as a Buyer', 'Discover premium Korean content for your next project', 'Create your account to access our curated catalog of Korean IP', 'Create Account', null, null),
('/signup/creator', 'Creator Signup', 'creator', 'Join KStoryBridge as a Creator', 'Showcase your Korean content to global buyers', 'Create your account to list your titles and connect with buyers worldwide', 'Create Account', null, null),
('/signin', 'Sign In', 'shared', 'Welcome Back', 'Sign in to access your dashboard', 'Enter your credentials to continue', 'Sign In', null, null),
('/forgot-password', 'Forgot Password', 'shared', 'Reset Your Password', 'We''ll send you instructions to reset your password', 'Enter your email address and we''ll send you a link to reset your password', 'Send Reset Link', null, null),

-- Buyer Dashboard Pages
('/buyers/home', 'Buyer Home (Chat)', 'buyer', 'AI-Powered IP Discovery', 'Chat with AI to find the perfect Korean content', 'Ask me anything about Korean titles and I''ll help you discover content that matches your needs', 'Start Chatting', 'Start a conversation', 'Ask me about any Korean content you''re looking for'),
('/buyers/featured', 'Featured Titles', 'buyer', 'Featured Korean Content', 'Discover our curated selection of premium titles', 'Explore handpicked Korean IP that''s trending in global markets', 'Browse All', 'No featured titles available', 'Check back soon for new featured content'),
('/buyers/titles', 'Browse Titles', 'buyer', 'Explore Korean Content', 'Browse our complete catalog of Korean IP', 'Search and filter through hundreds of Korean titles across all genres', 'View Details', 'No titles found', 'Try adjusting your search or filters'),
('/buyers/favorites', 'My Favorites', 'buyer', 'Your Saved Titles', 'Quick access to titles you''ve favorited', 'Keep track of Korean content you''re interested in for future reference', 'Browse Titles', 'No favorites yet', 'Start exploring titles and save your favorites for easy access'),
('/buyers/news', 'K-content News', 'buyer', 'Latest Industry News', 'Stay updated on Korean content trends and market insights', 'Get the latest updates on Korean entertainment, licensing deals, and industry news', null, 'No news available', 'Check back soon for the latest updates'),
('/buyers/profile', 'Buyer Profile', 'buyer', 'Your Profile', 'Manage your account settings and preferences', 'Update your information and manage your subscription', 'Edit Profile', null, null),
('/buyers/plan', 'Subscription Plan', 'buyer', 'Upgrade Your Plan', 'Unlock premium features with Pro or Suite', 'Access exclusive content, pitch decks, and advanced search capabilities', 'Upgrade Now', null, null),

-- Creator Dashboard Pages
('/creators/home', 'Creator Home', 'creator', 'My Titles', 'Manage your content catalog', 'View, edit, and organize all your titles in one place', 'Add New Title', 'No titles yet', 'Start by adding your first title to showcase your content'),
('/creators/titles/add', 'Add Title', 'creator', 'Add New Title', 'List your Korean content for global buyers', 'Fill in the details to showcase your title to potential buyers worldwide', 'Publish Title', null, null),
('/creators/news', 'K-content News', 'creator', 'Latest Industry News', 'Stay updated on Korean content trends and market insights', 'Get the latest updates on Korean entertainment, licensing deals, and industry news', null, 'No news available', 'Check back soon for the latest updates'),
('/creators/profile', 'Creator Profile', 'creator', 'Your Profile', 'Manage your creator account and portfolio', 'Update your pen name, company information, and contact details', 'Edit Profile', null, null),

-- Title Detail Pages
('/buyers/titles/:id', 'Title Detail', 'buyer', 'Title Information', 'Detailed overview of this Korean title', 'Explore synopsis, genre, format, and licensing information', 'Contact Us', null, null),
('/creators/titles/:id', 'Title Detail', 'creator', 'Your Title', 'View and manage your title details', 'See how your title appears to buyers and make updates', 'Edit Title', null, null),

-- Shared Pages
('/chat', 'AI Chat', 'shared', 'AI-Powered Content Discovery', 'Let AI help you find the perfect Korean title', 'Describe what you''re looking for and get personalized recommendations', 'Ask AI', 'Start your search', 'Tell me what kind of Korean content you''re looking for'),
('/experiment', 'Experimental Tools', 'shared', 'Admin Tools & Experiments', 'Access experimental features and analytics', 'Testing ground for new features and admin utilities', null, null, null),
('/docs', 'Documentation', 'shared', 'Documentation Center', 'Comprehensive guides and technical documentation', 'Explore architecture docs, API references, and deployment guides', null, 'No documentation found', 'Try adjusting your search terms or category filter');

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_ux_messaging_updated_at
  before update on ux_messaging
  for each row
  execute function update_updated_at_column();