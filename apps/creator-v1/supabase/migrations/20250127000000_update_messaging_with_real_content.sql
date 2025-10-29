-- Update UX Messaging with Real Content from Page Components
-- Generated from extracted and cleaned messaging data
-- Date: 2025-01-27

-- Update existing records with real content extracted from page components

-- Buyer Pages

-- Update Buyer Home (/buyers/home)
UPDATE ux_messaging
SET
  title = 'Featured Titles',
  subtitle = NULL,
  description = 'Jinu, our friendly AI agent, handpicked these titles just for you!',
  cta_text = NULL,
  empty_state_title = 'No featured titles available',
  empty_state_description = 'Check back soon for new recommendations'
WHERE page_route = '/buyers/home';

-- Update Browse Titles (/buyers/titles)
UPDATE ux_messaging
SET
  title = 'Title Library',
  subtitle = NULL,
  description = 'Browse our complete collection of Korean content',
  cta_text = NULL,
  empty_state_title = 'No titles found',
  empty_state_description = 'Try adjusting your search or filters'
WHERE page_route = '/buyers/titles';

-- Update Title Detail (/buyers/titles/:id)
UPDATE ux_messaging
SET
  title = 'Title Details',
  subtitle = NULL,
  description = 'View detailed information about this title',
  cta_text = NULL,
  empty_state_title = 'Title not found',
  empty_state_description = 'This title may have been removed or is temporarily unavailable'
WHERE page_route = '/buyers/titles/:id';

-- Update My Favorites (/buyers/favorites)
UPDATE ux_messaging
SET
  title = 'My Favorites',
  subtitle = NULL,
  description = 'Your saved titles and content',
  cta_text = NULL,
  empty_state_title = 'No favorites yet',
  empty_state_description = 'Start exploring titles and add them to your favorites'
WHERE page_route = '/buyers/favorites';

-- Update K-content News (/buyers/news)
UPDATE ux_messaging
SET
  title = 'K-Content News',
  subtitle = NULL,
  description = 'Stay updated with the latest Korean entertainment industry news',
  cta_text = NULL,
  empty_state_title = 'No news articles',
  empty_state_description = 'Check back for the latest industry updates'
WHERE page_route = '/buyers/news';

-- Update Buyer Profile (/buyers/profile)
UPDATE ux_messaging
SET
  title = 'Buyer Profile',
  subtitle = NULL,
  description = 'Manage your professional profile and company information',
  cta_text = NULL,
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/buyers/profile';

-- Update Subscription Plan (/buyers/plan)
UPDATE ux_messaging
SET
  title = 'Subscription Plan',
  subtitle = NULL,
  description = 'Manage your subscription and billing',
  cta_text = NULL,
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/buyers/plan';

-- Creator Pages

-- Update Creator Home (/creators/home)
UPDATE ux_messaging
SET
  title = 'Creator Dashboard',
  subtitle = NULL,
  description = 'Manage your content and track performance',
  cta_text = 'View All Titles',
  empty_state_title = 'No content yet',
  empty_state_description = 'Upload your first title to get started'
WHERE page_route = '/creators/home';

-- Update Add New Title (/creators/titles/add)
UPDATE ux_messaging
SET
  title = 'Add New Title',
  subtitle = NULL,
  description = 'Upload and publish new content',
  cta_text = 'Save Title',
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/creators/titles/add';

-- Update K-content News (/creators/news)
UPDATE ux_messaging
SET
  title = 'K-Content News',
  subtitle = NULL,
  description = 'Stay updated with industry trends and opportunities',
  cta_text = NULL,
  empty_state_title = 'No news articles',
  empty_state_description = 'Check back for the latest industry updates'
WHERE page_route = '/creators/news';

-- Update Creator Profile (/creators/profile)
UPDATE ux_messaging
SET
  title = 'Creator Profile',
  subtitle = NULL,
  description = 'Manage your creator profile and portfolio',
  cta_text = NULL,
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/creators/profile';

-- Update Title Detail (/creators/titles/:id)
UPDATE ux_messaging
SET
  title = 'Title Details',
  subtitle = NULL,
  description = 'View and manage your title',
  cta_text = NULL,
  empty_state_title = 'Title not found',
  empty_state_description = 'This title may have been removed'
WHERE page_route = '/creators/titles/:id';

-- Add missing buyer pages that weren't in the original seed data
INSERT INTO ux_messaging (page_route, page_name, account_type, title, subtitle, description, cta_text, empty_state_title, empty_state_description) VALUES
('/buyers/requests', 'My Requests', 'buyer', 'My Requests', NULL, 'Track your content requests and deals', NULL, 'No requests yet', 'Submit a request to connect with content creators'),
('/buyers/deals', 'My Deals', 'buyer', 'My Deals', NULL, 'Manage your active deals and negotiations', NULL, 'No active deals', 'Your completed deals will appear here'),
('/buyers/browse', 'Browse Content', 'buyer', 'Browse Content', NULL, 'Discover Korean content across all genres', NULL, 'No content found', 'Try different search terms or browse categories'),
('/buyers/media', 'Media Center', 'buyer', 'Media Center', NULL, 'Access your media files and downloads', NULL, 'No media files', 'Your downloaded content will appear here'),
('/buyers/users', 'User Management', 'buyer', 'User Management', NULL, 'Manage team members and permissions', NULL, 'No team members', 'Invite team members to collaborate'),
('/buyers/settings', 'Settings', 'buyer', 'Settings', NULL, 'Configure your account preferences', NULL, NULL, NULL),
('/buyers/send-message', 'Send Message', 'buyer', 'Send Message', NULL, 'Contact content creators directly', 'Send Message', NULL, NULL)
ON CONFLICT (page_route) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cta_text = EXCLUDED.cta_text,
  empty_state_title = EXCLUDED.empty_state_title,
  empty_state_description = EXCLUDED.empty_state_description;

-- Add missing creator pages that weren't in the original seed data
INSERT INTO ux_messaging (page_route, page_name, account_type, title, subtitle, description, cta_text, empty_state_title, empty_state_description) VALUES
('/creators/titles', 'Manage Titles', 'creator', 'My Titles', NULL, 'Manage your published content', NULL, 'No titles published', 'Create your first title to share with buyers'),
('/creators/titles/:id/edit', 'Edit Title', 'creator', 'Edit Title', NULL, 'Update your content information', 'Update Title', NULL, NULL),
('/creators/requests', 'My Requests', 'creator', 'Incoming Requests', NULL, 'Manage buyer requests for your content', NULL, 'No requests received', 'Buyers will contact you about your content here'),
('/creators/send-message', 'Send Message', 'creator', 'Send Message', NULL, 'Contact buyers and industry professionals', 'Send Message', NULL, NULL),
('/creators/chat', 'AI Chat', 'creator', 'AI Chat Assistant', NULL, 'Get help with content creation and industry insights', NULL, 'Start a conversation', 'Ask me anything about content creation or the industry')
ON CONFLICT (page_route) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cta_text = EXCLUDED.cta_text,
  empty_state_title = EXCLUDED.empty_state_title,
  empty_state_description = EXCLUDED.empty_state_description;