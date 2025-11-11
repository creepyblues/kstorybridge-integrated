import { Link } from "react-router-dom";
import UniversalHeader from "../components/UniversalHeader";
import Footer from "../components/Footer";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
          <p className="text-gray-600">
            <strong>Effective Date:</strong> January 11, 2025
            <br />
            <strong>Last Updated:</strong> January 11, 2025
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-hanok-teal hover:underline">1. Introduction</a>
            <a href="#information-we-collect" className="block text-hanok-teal hover:underline">2. Information We Collect</a>
            <a href="#how-we-use" className="block text-hanok-teal hover:underline">3. How We Use Your Information</a>
            <a href="#sharing" className="block text-hanok-teal hover:underline">4. How We Share Your Information</a>
            <a href="#data-retention" className="block text-hanok-teal hover:underline">5. Data Retention</a>
            <a href="#your-rights" className="block text-hanok-teal hover:underline">6. Your Rights and Choices</a>
            <a href="#security" className="block text-hanok-teal hover:underline">7. Security Measures</a>
            <a href="#cookies" className="block text-hanok-teal hover:underline">8. Cookies and Tracking Technologies</a>
            <a href="#international" className="block text-hanok-teal hover:underline">9. International Data Transfers</a>
            <a href="#children" className="block text-hanok-teal hover:underline">10. Children's Privacy</a>
            <a href="#california" className="block text-hanok-teal hover:underline">11. California Privacy Rights</a>
            <a href="#gdpr" className="block text-hanok-teal hover:underline">12. GDPR Rights (EU Users)</a>
            <a href="#changes" className="block text-hanok-teal hover:underline">13. Changes to This Privacy Policy</a>
            <a href="#contact" className="block text-hanok-teal hover:underline">14. Contact Us</a>
          </nav>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to KStoryBridge ("we," "us," or "our"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and share your personal information.
            </p>
            <p className="text-gray-700 mb-4">
              This Privacy Policy applies to all users of our platform, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Media Buyers:</strong> Professionals searching for Korean content to license and adapt</li>
              <li><strong>Creators:</strong> Authors, artists, and agents managing their intellectual property</li>
            </ul>
            <p className="text-gray-700">
              By using KStoryBridge, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section id="information-we-collect" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Personal Information You Provide</h3>

            <h4 className="text-lg font-semibold mb-2">For Media Buyers:</h4>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Email address (work email required)</li>
              <li>Full name</li>
              <li>Company name</li>
              <li>Job role (producer, executive, agent, content scout, or other)</li>
              <li>LinkedIn profile URL (optional)</li>
              <li>Account tier preferences (basic, pro, or suite)</li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">For Creators:</h4>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Email address</li>
              <li>Full name</li>
              <li>Pen name or studio name</li>
              <li>Role (author or agent)</li>
              <li>Company or publisher name (optional)</li>
              <li>Website URL (optional)</li>
            </ul>

            <h4 className="text-lg font-semibold mb-2">Content Data (Creators):</h4>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Title information (names in Korean and English, synopses, taglines, descriptions)</li>
              <li>Author and artist credits</li>
              <li>Genre, keywords, age ratings, and content format</li>
              <li>Platform metrics (views, likes, ratings, chapter counts)</li>
              <li>Rights holder information</li>
              <li>Story details (inspiration, themes, character details, plot structure)</li>
              <li>Achievements (awards, sales records, merchandise deals)</li>
              <li>Media files (title images, promotional materials)</li>
              <li>Pitch decks and supporting documents (PDFs, scripts, press releases)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Authentication Data</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Account credentials (email and password)</li>
              <li>OAuth provider data (if you sign up with Google)</li>
              <li>Session tokens and authentication status</li>
              <li>Email verification status</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Usage and Analytics Data</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>AI Chatbot Interactions:</strong> Full conversation history, messages, recommended titles, user feedback, and suggestions clicked</li>
              <li><strong>Search Activity:</strong> Search queries, search types, clicked results, search duration, and search patterns</li>
              <li><strong>Content Interactions:</strong> Titles viewed, favorited, or recommended to you</li>
              <li><strong>Page Analytics:</strong> Pages visited, time spent, navigation paths, and button clicks</li>
              <li><strong>Premium Feature Usage:</strong> Pitch deck views, contact creator requests, upgrade button clicks</li>
              <li><strong>Conversion Tracking:</strong> Pricing page views, upgrade intentions, and tier changes</li>
              <li><strong>Onboarding Progress:</strong> Completion status, steps completed, and whether onboarding was skipped</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.4 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and general location (country/region)</li>
              <li>Session duration and timestamps</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section id="how-we-use" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information for the following purposes:</p>

            <h3 className="text-xl font-semibold mb-3">3.1 Platform Services</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Creating and managing your account</li>
              <li>Authenticating your identity</li>
              <li>Providing access to platform features based on your account tier</li>
              <li>Processing subscription payments through Stripe</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 AI-Powered Features</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Generating personalized content recommendations using AI</li>
              <li>Powering our AI chatbot to answer questions about Korean content</li>
              <li>Analyzing pitch decks to extract structured information</li>
              <li>Creating marketing assets (images and promotional materials) using AI</li>
              <li>Generating vector embeddings for semantic search capabilities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Analytics and Improvement</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Understanding how users interact with our platform</li>
              <li>Measuring search performance and content discovery effectiveness</li>
              <li>Identifying popular content and user preferences</li>
              <li>Improving our AI recommendation algorithms</li>
              <li>Tracking conversion funnels and feature usage</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.4 Communications</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Sending welcome emails and onboarding communications</li>
              <li>Email verification and password reset notifications</li>
              <li>Tier upgrade notifications and payment confirmations</li>
              <li>Administrative messages about your account or our services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.5 Legal and Security</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Preventing fraud and abuse</li>
              <li>Enforcing our Terms of Service</li>
              <li>Complying with legal obligations</li>
              <li>Protecting our rights and the safety of our users</li>
            </ul>
          </section>

          {/* How We Share Your Information */}
          <section id="sharing" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-4">We share your information with the following third parties:</p>

            <h3 className="text-xl font-semibold mb-3">4.1 Service Providers</h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Supabase (Infrastructure Provider)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> Authentication, database hosting, file storage, serverless functions</li>
                <li><strong>Data Shared:</strong> All user data, content submissions, analytics, and authentication information</li>
                <li><strong>Purpose:</strong> Core platform infrastructure and data storage</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">OpenAI (AI Services)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> GPT-4 language models, DALL-E 3 image generation, text embeddings</li>
                <li><strong>Data Shared:</strong> Chat messages, title content, pitch deck content, search queries</li>
                <li><strong>Purpose:</strong> AI chatbot responses, content analysis, semantic search, marketing asset generation</li>
                <li><strong>Note:</strong> OpenAI may use data to improve their models. We only send data necessary for providing our AI features.</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Stripe (Payment Processing)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> Subscription management and payment processing</li>
                <li><strong>Data Shared:</strong> Email, name, payment information, subscription tier</li>
                <li><strong>Purpose:</strong> Processing subscription payments for pro and suite tiers</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Resend (Email Delivery)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> Transactional email delivery</li>
                <li><strong>Data Shared:</strong> Email addresses, names, email content</li>
                <li><strong>Purpose:</strong> Sending welcome emails, verification emails, and account notifications</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Google (OAuth and Analytics)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> OAuth authentication, Google Tag Manager, Google Analytics</li>
                <li><strong>Data Shared:</strong> OAuth profile data (during signup), usage analytics, page views, events</li>
                <li><strong>Purpose:</strong> Simplified login and comprehensive usage analytics</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Vercel (Hosting)</h4>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Services:</strong> Application hosting and serverless functions</li>
                <li><strong>Data Shared:</strong> Server logs, error tracking, performance metrics</li>
                <li><strong>Purpose:</strong> Platform hosting and performance monitoring</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law, legal process, or governmental request, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.3 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              If KStoryBridge is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.4 With Your Consent</h3>
            <p className="text-gray-700 mb-4">
              We may share your information for other purposes with your explicit consent.
            </p>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.1 Account Data</h3>
            <p className="text-gray-700 mb-4">
              User profiles, content submissions, and account preferences are retained indefinitely while your account is active. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it by law.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.2 Analytics Data</h3>
            <p className="text-gray-700 mb-4">
              Usage analytics, search history, and interaction data are retained to improve our services and may be retained indefinitely in aggregated or anonymized form.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.3 AI Training Data</h3>
            <p className="text-gray-700 mb-4">
              Chat conversations, vector embeddings, and AI-generated analysis are retained to improve our AI features and provide consistent recommendations.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.4 Session Data</h3>
            <p className="text-gray-700 mb-4">
              Temporary session data (such as OAuth state) is automatically cleared when you log out or close your browser.
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section id="your-rights" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Access and Update</h3>
            <p className="text-gray-700 mb-4">
              You can access and update your personal information at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.2 Data Deletion</h3>
            <p className="text-gray-700 mb-4">
              To delete your account and personal data, please contact us at <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a>. We will process your request within 30 days.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.3 Data Export</h3>
            <p className="text-gray-700 mb-4">
              To request a copy of your personal data in a portable format, please contact us at <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.4 Marketing Communications</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of marketing emails by clicking the "unsubscribe" link in any marketing email or by contacting us. Note that you will continue to receive transactional emails (such as password resets and payment confirmations).
            </p>

            <h3 className="text-xl font-semibold mb-3">6.5 Cookie Preferences</h3>
            <p className="text-gray-700 mb-4">
              You can manage your cookie preferences through our Cookie Settings tool (accessible via the footer link on all pages). You can also configure your browser to reject cookies, but this may limit your ability to use certain features.
            </p>
          </section>

          {/* Security Measures */}
          <section id="security" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Security Measures</h2>
            <p className="text-gray-700 mb-4">
              We take the security of your information seriously and implement industry-standard measures to protect it:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Encryption:</strong> All data transmitted to and from our platform uses HTTPS/TLS encryption</li>
              <li><strong>Authentication:</strong> Secure password hashing and OAuth 2.0 with PKCE flow</li>
              <li><strong>Access Controls:</strong> Row-level security policies ensure users can only access their own data</li>
              <li><strong>Infrastructure:</strong> Our database and authentication are managed by Supabase, which follows SOC 2 Type II standards</li>
              <li><strong>Credential Management:</strong> API keys and secrets are stored securely and never committed to our codebase</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Despite these measures, no system is 100% secure. If you believe your account has been compromised, please contact us immediately at <a href="mailto:security@kstorybridge.com" className="text-hanok-teal hover:underline">security@kstorybridge.com</a>.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section id="cookies" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>

            <h3 className="text-xl font-semibold mb-3">8.1 Types of Cookies We Use</h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Essential Cookies</h4>
              <p className="text-gray-700 mb-2">
                These cookies are necessary for the platform to function and cannot be disabled:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Authentication tokens (stored in localStorage)</li>
                <li>Session management</li>
                <li>Security and fraud prevention</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Analytics Cookies</h4>
              <p className="text-gray-700 mb-2">
                These cookies help us understand how users interact with our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Google Tag Manager and Google Analytics cookies</li>
                <li>Page view tracking</li>
                <li>Feature usage analytics</li>
                <li>Conversion tracking</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Third-Party Cookies</h4>
              <p className="text-gray-700 mb-2">
                Some third-party services may set their own cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Google OAuth (during authentication)</li>
                <li>Stripe (during payment processing)</li>
                <li>Supabase (for WebSocket connections)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-3">8.2 Managing Cookies</h3>
            <p className="text-gray-700 mb-4">
              You can control cookies through:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Our <Link to="/cookie-settings" className="text-hanok-teal hover:underline">Cookie Settings</Link> tool</li>
              <li>Your browser settings (most browsers allow you to refuse cookies)</li>
              <li>Third-party opt-out tools (e.g., <a href="https://optout.aboutads.info/" className="text-hanok-teal hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-Out</a>)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">8.3 Do Not Track</h3>
            <p className="text-gray-700 mb-4">
              Our platform does not currently respond to Do Not Track (DNT) browser signals, but you can use our Cookie Settings tool to manage your tracking preferences.
            </p>
          </section>

          {/* International Data Transfers */}
          <section id="international" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              KStoryBridge operates globally and may transfer your information to countries outside your country of residence, including the United States. These countries may have different data protection laws than your country.
            </p>
            <p className="text-gray-700 mb-4">
              When we transfer data internationally, we ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Our infrastructure provider (Supabase) complies with standard contractual clauses</li>
              <li>OpenAI is based in the United States and processes data under their privacy policy</li>
              <li>Stripe complies with international payment card industry standards</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section id="children" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
            </p>
            <p className="text-gray-700 mb-4">
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a>.
            </p>
          </section>

          {/* California Privacy Rights */}
          <section id="california" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 mb-4">
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
            </p>

            <h3 className="text-xl font-semibold mb-3">11.1 Right to Know</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request disclosure of the personal information we collect, use, disclose, and sell (if applicable).
            </p>

            <h3 className="text-xl font-semibold mb-3">11.2 Right to Delete</h3>
            <p className="text-gray-700 mb-4">
              You have the right to request deletion of your personal information, subject to certain exceptions.
            </p>

            <h3 className="text-xl font-semibold mb-3">11.3 Right to Opt-Out of Sale</h3>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. However, sharing data with third parties for analytics purposes may qualify as a "sale" under CCPA. You can opt out by visiting our <Link to="/do-not-sell" className="text-hanok-teal hover:underline">Do Not Sell My Personal Information</Link> page.
            </p>

            <h3 className="text-xl font-semibold mb-3">11.4 Right to Non-Discrimination</h3>
            <p className="text-gray-700 mb-4">
              We will not discriminate against you for exercising your CCPA rights.
            </p>

            <h3 className="text-xl font-semibold mb-3">11.5 How to Exercise Your Rights</h3>
            <p className="text-gray-700 mb-4">
              To exercise your CCPA rights, please contact us at <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a> or call us at [phone number]. We will verify your identity before processing your request.
            </p>

            <h3 className="text-xl font-semibold mb-3">11.6 Categories of Information Collected</h3>
            <p className="text-gray-700 mb-4">
              In the past 12 months, we have collected the following categories of personal information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Identifiers (name, email, account credentials)</li>
              <li>Commercial information (subscription tier, payment history)</li>
              <li>Internet activity (browsing history, search queries, interactions)</li>
              <li>Professional information (company, job role)</li>
              <li>Inferences (preferences, recommendations, behavior patterns)</li>
            </ul>
          </section>

          {/* GDPR Rights */}
          <section id="gdpr" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. GDPR Rights (European Union Users)</h2>
            <p className="text-gray-700 mb-4">
              If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have specific rights under the General Data Protection Regulation (GDPR):
            </p>

            <h3 className="text-xl font-semibold mb-3">12.1 Legal Basis for Processing</h3>
            <p className="text-gray-700 mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Contractual Necessity:</strong> To provide our services as outlined in our Terms of Service</li>
              <li><strong>Legitimate Interests:</strong> To improve our platform, prevent fraud, and conduct analytics</li>
              <li><strong>Consent:</strong> For marketing communications and certain analytics (where required)</li>
              <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">12.2 Your GDPR Rights</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restriction:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to certain types of processing (e.g., direct marketing)</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">12.3 How to Exercise Your Rights</h3>
            <p className="text-gray-700 mb-4">
              To exercise your GDPR rights, please contact us at <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a>. We will respond to your request within 30 days.
            </p>

            <h3 className="text-xl font-semibold mb-3">12.4 Right to Lodge a Complaint</h3>
            <p className="text-gray-700 mb-4">
              If you believe we have not handled your personal data properly, you have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          {/* Changes to This Privacy Policy */}
          <section id="changes" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or for other operational reasons. When we make changes, we will:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Update the "Last Updated" date at the top of this policy</li>
              <li>Notify you via email if the changes are material</li>
              <li>Display a prominent notice on our platform</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your continued use of our services after changes become effective constitutes your acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Contact Us */}
          <section id="contact" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">14. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> <a href="mailto:support@kstorybridge.com" className="text-hanok-teal hover:underline">support@kstorybridge.com</a></p>
              <p className="text-gray-700 mb-2"><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@kstorybridge.com" className="text-hanok-teal hover:underline">privacy@kstorybridge.com</a></p>
              <p className="text-gray-700"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@kstorybridge.com" className="text-hanok-teal hover:underline">dpo@kstorybridge.com</a></p>
            </div>
          </section>

        </div>

        {/* Back to Top */}
        <div className="mt-12 text-center">
          <a href="#introduction" className="text-hanok-teal hover:underline">
            Back to Top ↑
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
