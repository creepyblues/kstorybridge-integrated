# Complete Button Tracking List for GTM Configuration (Updated with Button IDs)

## Website App Buttons (kstorybridge.com)

### Homepage (/)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **SIGN IN** | Header Desktop | Navigate to /signin | `header_signin_click` | `header-signin-btn` | High |
| **GET STARTED** | Header Desktop | Navigate to /signup | `header_signup_click` | `header-get-started-btn` | High |
| **CREATORS** | Header Desktop | Navigate to /creators | `nav_creators_click` | `nav-creators-btn` | Medium |
| **BUYERS** | Header Desktop | Navigate to /buyers | `nav_buyers_click` | `nav-buyers-btn` | Medium |
| **ABOUT** | Header Desktop | Navigate to /about | `nav_about_click` | `nav-about-btn` | Medium |
| **Mobile Menu Toggle** | Header Mobile | Toggle mobile menu | `mobile_menu_toggle` | `mobile-menu-toggle-btn` | Low |
| **BROWSE NOW** | Hero Section | Navigate to /signup | `homepage_browse_now_click` | `homepage-browse-now-btn` | High |
| **SIGN OUT** | Auth Section (when logged in) | Sign out user | `header_signout_click` | `header-signout-btn` | Medium |

### Creators Page (/creators)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Get Started** | Hero Section | Navigate to /signup/creator | `creators_hero_get_started` | `creators-hero-get-started-btn` | High |
| **Create Account** | Features Section | Navigate to /signup/creator | `creators_features_create_account` | `creators-features-create-account-btn` | High |
| **Get Started** | Final CTA | Navigate to /signup/creator | `creators_final_get_started` | `creators-cta-get-started-btn` | High |

### Buyers Page (/buyers)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Request VIP Access** | Hero Section | Navigate to /signup | `buyers_hero_vip_access` | `buyers-hero-request-vip-btn` | High |
| **Join to View Full Catalogue** | Featured Section | Navigate to /signup | `buyers_catalogue_join` | `buyers-catalogue-join-btn` | High |
| **Start Free** | Free Plan | Navigate to /signup | `buyers_plan_start_free` | `buyers-pricing-free-btn` | High |
| **Start Pro Trial** | Pro Plan | Navigate to /signup | `buyers_plan_start_pro` | `buyers-pricing-pro-btn` | High |
| **Contact Sales** | Enterprise Plan | Navigate to /signup | `buyers_plan_contact_sales` | `buyers-pricing-enterprise-btn` | Medium |
| **Scout Catalogue Now** | Final CTA | Navigate to /signup | `buyers_final_scout_catalogue` | `buyers-cta-scout-catalogue-btn` | High |

### Signup Forms (/signup/buyer, /signup/creator)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Create Account** | Signup Form | Submit signup | `signup_form_submit` | `signup-form-submit-btn` | Critical |
| **Continue with Google** | Signup Form | Google OAuth signup | `google_signup_click` | `signup-google-btn` | High |
| **Switch Account Type** | Form Header | Toggle buyer/creator | `signup_switch_account_type` | `signup-switch-account-type-btn` | Medium |

### Signin Page (/signin)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Sign In** | Signin Form | Submit login form | `signin_submit` | `signin-form-submit-btn` | High |
| **Continue with Google** | Signin Form | Google OAuth login | `google_signin_click` | `signin-google-btn` | High |

### Pricing Page (/pricing)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Creator Free Plan** | Creator Pricing | Select free plan | `pricing_creators_free` | `pricing-creators-free-btn` | Medium |
| **Creator Premium Plan** | Creator Pricing | Select premium plan | `pricing_creators_premium` | `pricing-creators-premium-btn` | High |
| **Buyer Free Plan** | Buyer Pricing | Select free plan | `pricing_buyers_free` | `pricing-buyers-free-btn` | Medium |
| **Buyer Pro Plan** | Buyer Pricing | Select pro plan | `pricing_buyers_pro` | `pricing-buyers-pro-btn` | High |
| **Enterprise Plan** | Enterprise Pricing | Contact sales | `pricing_buyers_enterprise` | `pricing-buyers-enterprise-btn` | Medium |

---

## Dashboard App Buttons (dashboard.kstorybridge.com)

### Main Dashboard (/dashboard)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **All** | Content Filter | Filter all content | `dashboard_filter_all` | `dashboard-filter-all-btn` | Medium |
| **Webtoons** | Content Filter | Filter webtoons | `dashboard_filter_webtoons` | `dashboard-filter-webtoons-btn` | Medium |
| **Series** | Content Filter | Filter series | `dashboard_filter_series` | `dashboard-filter-series-btn` | Medium |
| **Movies** | Content Filter | Filter movies | `dashboard_filter_movies` | `dashboard-filter-movies-btn` | Medium |

### Browse Page (/browse)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Search** | Search Bar | Execute search | `browse_search` | `browse-search-btn` | High |
| **Genre Filter** | Filter Section | Filter by genre | `browse_genre_filter` | `browse-genre-filter-btn` | Medium |
| **Format Filter** | Filter Section | Filter by format | `browse_format_filter` | `browse-format-filter-btn` | Medium |
| **Sort Filter** | Filter Section | Sort results | `browse_sort_filter` | `browse-sort-filter-btn` | Medium |

### Title Detail Page (/title/:id)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Contact Creator** | Title Actions | Contact title owner | `title_contact_creator` | `title-detail-contact-creator-btn` | High |
| **Request a Pitch Deck** | Title Actions | Request premium content | `title_request_pitch_deck` | `title-detail-request-pitch-btn` | Critical |
| **Add to Favorites** | Title Actions | Add to user favorites | `title_add_favorites` | `title-detail-favorite-toggle-btn` | High |
| **Remove from Favorites** | Title Actions | Remove from favorites | `title_remove_favorites` | `title-detail-favorite-toggle-btn` | Medium |
| **View Pitch** | Title Actions | View pitch document | `title_view_pitch` | `title-detail-view-pitch-btn` | High |

### Premium Feature Popup
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Request Premium Access** | Premium Popup | Submit premium request | `premium_request_submit` | `premium-popup-request-btn` | Critical |
| **Cancel** | Premium Popup | Close popup | `premium_popup_cancel` | `premium-popup-cancel-btn` | Low |

### Creator Dashboard
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Overview Tab** | Navigation | Switch to overview | `creator_dashboard_overview` | `creator-dashboard-overview-tab-btn` | Medium |
| **My Titles Tab** | Navigation | Switch to titles | `creator_dashboard_titles` | `creator-dashboard-titles-tab-btn` | Medium |
| **Analytics Tab** | Navigation | Switch to analytics | `creator_dashboard_analytics` | `creator-dashboard-analytics-tab-btn` | Medium |
| **Create New Title** | Overview/Titles | Create new title | `creator_add_title` | `creator-dashboard-create-new-title-btn` | High |
| **Manage Titles** | Overview | Manage titles | `creator_manage_titles` | `creator-dashboard-manage-titles-btn` | High |
| **View Analytics** | Overview | View analytics | `creator_view_analytics` | `creator-dashboard-view-analytics-btn` | Medium |

### Title Management (Creator)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Edit Title** | Title Card | Open title editor | `creator_edit_title` | `creator-title-edit-btn` | High |
| **Delete Title** | Title Card | Delete title | `creator_delete_title` | `creator-title-card-delete-btn` | Medium |
| **Title Actions Menu** | Title Card | Open actions menu | `creator_title_actions_menu` | `creator-title-card-actions-menu-btn` | Medium |
| **View Analytics** | Title Card | View title analytics | `creator_title_analytics` | `creator-title-analytics-btn` | Medium |

### Favorites Page (/favorites)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Remove from Favorites** | Favorites List | Remove title | `favorites_remove` | `favorites-remove-btn` | Medium |

### Header/Navigation (All Dashboard Pages)
| Button Name | Location | Action | GTM Event Name | Button ID | Priority |
|-------------|----------|--------|----------------|-----------|----------|
| **Sign Out** | Header | Sign out user | `dashboard_signout_click` | `cms-header-sign-out-btn` | Medium |

---

## GTM Configuration Setup

### 1. Create Button Click Triggers

For each button, create a GTM trigger:

**Trigger Type**: Click - All Elements
**Trigger Conditions**:
- Click Element matches CSS selector using Button ID
- Page URL matches regex pattern

### 2. CSS Selectors by Button ID

```css
/* Website Header Buttons */
#header-signin-btn
#header-get-started-btn
#header-signout-btn

/* Navigation Buttons */
#nav-creators-btn
#nav-buyers-btn
#nav-about-btn

/* Homepage CTA Buttons */
#homepage-browse-now-btn

/* Creator Page CTAs */
#creators-hero-get-started-btn
#creators-features-create-account-btn
#creators-cta-get-started-btn

/* Buyer Page CTAs */
#buyers-hero-request-vip-btn
#buyers-catalogue-join-btn
#buyers-pricing-free-btn
#buyers-pricing-pro-btn
#buyers-pricing-enterprise-btn
#buyers-cta-scout-catalogue-btn

/* Form Submission Buttons */
#signup-form-submit-btn
#signin-form-submit-btn
#signup-google-btn
#signin-google-btn

/* Dashboard Action Buttons */
#title-detail-request-pitch-btn
#title-detail-contact-creator-btn
#title-detail-favorite-toggle-btn
#premium-popup-request-btn

/* Dashboard Filter Buttons */
#dashboard-filter-all-btn
#dashboard-filter-webtoons-btn
#dashboard-filter-series-btn
#dashboard-filter-movies-btn
```

### 3. GTM Event Structure

```javascript
{
  'event': 'button_click',
  'button_id': '{{Button ID}}',
  'button_name': '{{Button Text}}',
  'button_location': '{{Page Path}}',
  'button_category': 'navigation|cta|action|form',
  'user_type': 'anonymous|buyer|creator',
  'app_section': 'website|dashboard'
}
```

### 4. Priority Implementation Order

**Critical (Implement First)**:
1. `#signup-form-submit-btn` - Signup form submissions
2. `#premium-popup-request-btn` - Premium feature requests
3. `#title-detail-request-pitch-btn` - Premium content requests

**High (Implement Second)**:
1. All CTA buttons (get-started, request-vip, browse-now)
2. Main navigation buttons
3. Content interaction buttons

**Medium (Implement Third)**:
1. Filter buttons
2. Secondary actions
3. Tab navigation

### 5. URL Patterns for Triggers

**Website**:
- `kstorybridge.com/*`
- `localhost:5173/*` (development)

**Dashboard**:
- `dashboard.kstorybridge.com/*`
- `localhost:8081/*` (development)

### 6. Enhanced GTM Configuration Examples

**Signup Button Trigger**:
```
Trigger Name: Signup Form Submit
Trigger Type: Click - All Elements
Click Element: #signup-form-submit-btn
Page URL: matches RegEx .*/(signup|signup/buyer|signup/creator).*
```

**Premium Request Trigger**:
```
Trigger Name: Premium Feature Request
Trigger Type: Click - All Elements  
Click Element: #premium-popup-request-btn
Page URL: matches RegEx dashboard\..*
```

**CTA Buttons Trigger**:
```
Trigger Name: Website CTA Buttons
Trigger Type: Click - All Elements
Click Element: matches CSS selector #homepage-browse-now-btn, #creators-hero-get-started-btn, #buyers-hero-request-vip-btn
Page URL: matches RegEx (kstorybridge\.com|localhost:5173).*
```

### 7. Test Events to Verify

Once configured in GTM, test these key conversion events:

1. **Website Signup Flow**: Homepage → Creators/Buyers → Signup Form → Submit
2. **Dashboard Engagement**: Browse → Title Detail → Premium Request  
3. **User Journey**: Website Signup → Dashboard Login → Content Interaction

This comprehensive list covers all major user interaction points with unique button IDs for precise tracking in Google Analytics via GTM.