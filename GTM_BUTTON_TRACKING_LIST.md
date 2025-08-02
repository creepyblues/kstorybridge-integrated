# Complete Button Tracking List for GTM Configuration

## Website App Buttons (kstorybridge.com)

### Homepage (/)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **SIGN IN** | Header Desktop | Navigate to /signin | `header_signin_click` | High |
| **SIGN UP** | Header Desktop | Navigate to /signup | `header_signup_click` | High |
| **CREATORS** | Header Desktop | Navigate to /creators | `nav_creators_click` | Medium |
| **BUYERS** | Header Desktop | Navigate to /buyers | `nav_buyers_click` | Medium |
| **ABOUT** | Header Desktop | Navigate to /about | `nav_about_click` | Medium |
| **Mobile Menu Toggle** | Header Mobile | Toggle mobile menu | `mobile_menu_toggle` | Low |

### Creators Page (/creators)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Get Started** | Hero Section | Navigate to /signup/creator | `creators_hero_get_started` | High |
| **Create Account** | Call-to-Action Section | Navigate to /signup/creator | `creators_cta_create_account` | High |
| **Get Started** | Final CTA | Navigate to /signup/creator | `creators_final_get_started` | High |

### Buyers Page (/buyers)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Request VIP Access** | Hero Section | Navigate to /signup | `buyers_hero_vip_access` | High |
| **Join to View Full Catalogue** | Featured Section | Navigate to /signup | `buyers_catalogue_join` | High |
| **Start Free** | Basic Plan | Navigate to /signup | `buyers_plan_start_free` | High |
| **Start Pro Trial** | Pro Plan | Navigate to /signup | `buyers_plan_start_pro` | High |
| **Contact Sales** | Enterprise Plan | Navigate to /signup | `buyers_plan_contact_sales` | Medium |
| **Scout Catalogue Now** | Final CTA | Navigate to /signup | `buyers_final_scout_catalogue` | High |

### Signup Forms (/signup/buyer, /signup/creator)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Create Account** | Buyer Signup Form | Submit buyer signup | `buyer_signup_submit` | Critical |
| **Create Account** | Creator Signup Form | Submit creator signup | `creator_signup_submit` | Critical |
| **Continue with Google** | Both Forms | Google OAuth signup | `google_signup_click` | High |

### Signin Page (/signin)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Sign In** | Signin Form | Submit login form | `signin_submit` | High |
| **Continue with Google** | Signin Form | Google OAuth login | `google_signin_click` | High |

### Header (All Pages)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Sign In** | Auth Section | Navigate to /signin | `header_signin_click` | High |
| **Get Started** | Auth Section | Navigate to /signup | `header_get_started_click` | High |
| **Sign Out** | Auth Section (when logged in) | Sign out user | `header_signout_click` | Medium |
| **EN/KR Toggle** | Language Selector | Change language | `language_change_click` | Medium |

---

## Dashboard App Buttons (dashboard.kstorybridge.com)

### Main Dashboard (/dashboard)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **All** | Content Filter | Filter all content | `dashboard_filter_all` | Medium |
| **Webtoons** | Content Filter | Filter webtoons | `dashboard_filter_webtoons` | Medium |
| **Series** | Content Filter | Filter series | `dashboard_filter_series` | Medium |
| **Movies** | Content Filter | Filter movies | `dashboard_filter_movies` | Medium |

### Title Detail Page (/title/:id)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Contact Creator** | Title Actions | Contact title owner | `title_contact_creator` | High |
| **Request a Pitch Deck** | Title Actions | Request premium content | `title_request_pitch_deck` | Critical |
| **Add to Favorites** | Title Actions | Add to user favorites | `title_add_favorites` | High |
| **Remove from Favorites** | Title Actions | Remove from favorites | `title_remove_favorites` | Medium |

### Premium Feature Popup
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Request Premium Access** | Premium Popup | Submit premium request | `premium_request_submit` | Critical |
| **Cancel** | Premium Popup | Close popup | `premium_popup_cancel` | Low |

### Title Management (Creator Dashboard)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Edit Title** | Title Card | Open title editor | `creator_edit_title` | High |
| **Delete Title** | Title Card | Delete title | `creator_delete_title` | Medium |
| **Add New Title** | Content Management | Create new title | `creator_add_title` | High |

### Header/Navigation (All Dashboard Pages)
| Button Name | Location | Action | GTM Event Name | Priority |
|-------------|----------|--------|----------------|----------|
| **Sign Out** | Header | Sign out user | `dashboard_signout_click` | Medium |
| **Browse** | Navigation | Navigate to browse | `nav_browse_click` | Medium |
| **Favorites** | Navigation | Navigate to favorites | `nav_favorites_click` | Medium |
| **Deals** | Navigation | Navigate to deals | `nav_deals_click` | Medium |

---

## GTM Configuration Setup

### 1. Create Button Click Triggers

For each button, create a GTM trigger:

**Trigger Type**: Click - All Elements
**Trigger Conditions**:
- Click Element matches CSS selector
- Page URL matches regex pattern

### 2. CSS Selectors by Button Type

```css
/* Website Header Buttons */
button[onclick*="signin"], a[href="/signin"] 
button[onclick*="signup"], a[href="/signup"]

/* CTA Buttons */
button:contains("Get Started"), a:contains("Get Started")
button:contains("Request VIP Access")
button:contains("Start Free")
button:contains("Start Pro Trial")

/* Dashboard Action Buttons */
button:contains("Request a Pitch Deck")
button:contains("Contact Creator")
button:contains("Add to Favorites")

/* Form Submission Buttons */
button[type="submit"]
button:contains("Create Account")
button:contains("Sign In")
```

### 3. GTM Event Structure

```javascript
{
  'event': 'button_click',
  'button_name': '{{Button Text}}',
  'button_location': '{{Page Path}}',
  'button_category': 'navigation|cta|action|form',
  'user_type': 'anonymous|buyer|creator',
  'app_section': 'website|dashboard'
}
```

### 4. Priority Implementation Order

**Critical (Implement First)**:
1. Signup form submissions
2. Premium feature requests
3. Main CTA buttons

**High (Implement Second)**:
1. Navigation buttons
2. Content interaction buttons
3. Authentication buttons

**Medium (Implement Third)**:
1. Filter buttons
2. Secondary actions

### 5. URL Patterns for Triggers

**Website**:
- `kstorybridge.com/*`
- `localhost:5173/*` (development)

**Dashboard**:
- `dashboard.kstorybridge.com/*`
- `localhost:8081/*` (development)

### 6. Test Events to Verify

Once configured in GTM, test these key conversion events:

1. **Website Signup Flow**: Homepage → Creators/Buyers → Signup Form → Submit
2. **Dashboard Engagement**: Browse → Title Detail → Premium Request
3. **User Journey**: Website Signup → Dashboard Login → Content Interaction

This comprehensive list covers all major user interaction points for conversion and engagement tracking in Google Analytics via GTM.