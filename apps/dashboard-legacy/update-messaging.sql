-- Update UX Messaging with Real Content from Page Components
-- Generated from extracted and cleaned messaging data
-- Date: 2025-01-27

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

-- Update My Requests (/buyers/requests)
UPDATE ux_messaging
SET
  title = 'My Requests',
  subtitle = NULL,
  description = 'Track your content requests and deals',
  cta_text = NULL,
  empty_state_title = 'No requests yet',
  empty_state_description = 'Submit a request to connect with content creators'
WHERE page_route = '/buyers/requests';

-- Update My Deals (/buyers/deals)
UPDATE ux_messaging
SET
  title = 'My Deals',
  subtitle = NULL,
  description = 'Manage your active deals and negotiations',
  cta_text = NULL,
  empty_state_title = 'No active deals',
  empty_state_description = 'Your completed deals will appear here'
WHERE page_route = '/buyers/deals';

-- Update Browse Content (/buyers/browse)
UPDATE ux_messaging
SET
  title = 'Browse Content',
  subtitle = NULL,
  description = 'Discover Korean content across all genres',
  cta_text = NULL,
  empty_state_title = 'No content found',
  empty_state_description = 'Try different search terms or browse categories'
WHERE page_route = '/buyers/browse';

-- Update Media Center (/buyers/media)
UPDATE ux_messaging
SET
  title = 'Media Center',
  subtitle = NULL,
  description = 'Access your media files and downloads',
  cta_text = NULL,
  empty_state_title = 'No media files',
  empty_state_description = 'Your downloaded content will appear here'
WHERE page_route = '/buyers/media';

-- Update User Management (/buyers/users)
UPDATE ux_messaging
SET
  title = 'User Management',
  subtitle = NULL,
  description = 'Manage team members and permissions',
  cta_text = NULL,
  empty_state_title = 'No team members',
  empty_state_description = 'Invite team members to collaborate'
WHERE page_route = '/buyers/users';

-- Update Settings (/buyers/settings)
UPDATE ux_messaging
SET
  title = 'Settings',
  subtitle = NULL,
  description = 'Configure your account preferences',
  cta_text = NULL,
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/buyers/settings';

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

-- Update Send Message (/buyers/send-message)
UPDATE ux_messaging
SET
  title = 'Send Message',
  subtitle = NULL,
  description = 'Contact content creators directly',
  cta_text = 'Send Message',
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/buyers/send-message';

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

-- Update Manage Titles (/creators/titles)
UPDATE ux_messaging
SET
  title = 'My Titles',
  subtitle = NULL,
  description = 'Manage your published content',
  cta_text = NULL,
  empty_state_title = 'No titles published',
  empty_state_description = 'Create your first title to share with buyers'
WHERE page_route = '/creators/titles';

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

-- Update Edit Title (/creators/titles/:id/edit)
UPDATE ux_messaging
SET
  title = 'Edit Title',
  subtitle = NULL,
  description = 'Update your content information',
  cta_text = 'Update Title',
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/creators/titles/:id/edit';

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

-- Update My Requests (/creators/requests)
UPDATE ux_messaging
SET
  title = 'Incoming Requests',
  subtitle = NULL,
  description = 'Manage buyer requests for your content',
  cta_text = NULL,
  empty_state_title = 'No requests received',
  empty_state_description = 'Buyers will contact you about your content here'
WHERE page_route = '/creators/requests';

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

-- Update Send Message (/creators/send-message)
UPDATE ux_messaging
SET
  title = 'Send Message',
  subtitle = NULL,
  description = 'Contact buyers and industry professionals',
  cta_text = 'Send Message',
  empty_state_title = NULL,
  empty_state_description = NULL
WHERE page_route = '/creators/send-message';

-- Update AI Chat (/creators/chat)
UPDATE ux_messaging
SET
  title = 'AI Chat Assistant',
  subtitle = NULL,
  description = 'Get help with content creation and industry insights',
  cta_text = NULL,
  empty_state_title = 'Start a conversation',
  empty_state_description = 'Ask me anything about content creation or the industry'
WHERE page_route = '/creators/chat';

-- Verification: Show updated records
SELECT page_route, account_type, title, description, empty_state_title
FROM ux_messaging
WHERE page_route LIKE '/buyers/%' OR page_route LIKE '/creators/%'
ORDER BY account_type, page_route;