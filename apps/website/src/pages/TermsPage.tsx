import { Link } from "react-router-dom";
import UniversalHeader from "../components/UniversalHeader";
import Footer from "../components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <UniversalHeader />

      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-4">Terms of Use</h1>
          <p className="text-gray-600">
            <strong>Effective Date:</strong> November 12, 2025
            <br />
            <strong>Last Updated:</strong> November 12, 2025
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-hanok-teal hover:underline">1. Introduction & Acceptance</a>
            <a href="#definitions" className="block text-hanok-teal hover:underline">2. Definitions</a>
            <a href="#general-terms" className="block text-hanok-teal hover:underline">3. General Terms (All Users)</a>
            <a href="#creator-terms" className="block text-hanok-teal hover:underline">4. Terms for Creators</a>
            <a href="#buyer-terms" className="block text-hanok-teal hover:underline">5. Terms for Buyers</a>
            <a href="#transactions" className="block text-hanok-teal hover:underline">6. Transactions & Licensing</a>
            <a href="#fees-payment" className="block text-hanok-teal hover:underline">7. Fees & Payment</a>
            <a href="#intellectual-property" className="block text-hanok-teal hover:underline">8. Intellectual Property Rights</a>
            <a href="#prohibited-conduct" className="block text-hanok-teal hover:underline">9. Prohibited Conduct</a>
            <a href="#termination" className="block text-hanok-teal hover:underline">10. Account Termination & Suspension</a>
            <a href="#disclaimers" className="block text-hanok-teal hover:underline">11. Disclaimers & Warranties</a>
            <a href="#limitation-liability" className="block text-hanok-teal hover:underline">12. Limitation of Liability</a>
            <a href="#indemnification" className="block text-hanok-teal hover:underline">13. Indemnification</a>
            <a href="#dispute-resolution" className="block text-hanok-teal hover:underline">14. Dispute Resolution & Arbitration</a>
            <a href="#governing-law" className="block text-hanok-teal hover:underline">15. Governing Law</a>
            <a href="#changes" className="block text-hanok-teal hover:underline">16. Changes to These Terms</a>
            <a href="#contact" className="block text-hanok-teal hover:underline">17. Contact Information</a>
          </nav>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">

          {/* Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Introduction & Acceptance</h2>
            <p className="text-gray-700 mb-4">
              Welcome to KStoryBridge ("we," "us," "our," or "Platform"). These Terms of Use ("Terms") constitute a legally binding agreement between you and KStoryBridge governing your access to and use of our platform.
            </p>
            <p className="text-gray-700 mb-4">
              KStoryBridge is a two-sided marketplace connecting Korean content creators with global media buyers. Our platform facilitates connections, provides discovery tools (including AI-powered search), and supports licensing transactions.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.</strong> If you do not agree to these Terms, you may not access or use the Platform.
            </p>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-4">
              <p className="text-gray-700 mb-2"><strong>User-Specific Terms:</strong></p>
              <ul className="list-disc pl-6 text-gray-700">
                <li><strong>Creators:</strong> Section 4 applies to you in addition to all other sections</li>
                <li><strong>Buyers:</strong> Section 5 applies to you in addition to all other sections</li>
              </ul>
            </div>
            <p className="text-gray-700">
              Please also review our <Link to="/privacy" className="text-hanok-teal hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information.
            </p>
          </section>

          {/* Definitions */}
          <section id="definitions" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
            <p className="text-gray-700 mb-4">For purposes of these Terms:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>"Platform"</strong> means the KStoryBridge website, applications, and all related services</li>
              <li><strong>"Creator"</strong> means content creators, authors, artists, agents, or rights holders who list intellectual property on the Platform</li>
              <li><strong>"Buyer"</strong> means media buyers, producers, studios, executives, agents, or content scouts who search for and license content</li>
              <li><strong>"Content"</strong> means any webtoons, web novels, books, stories, scripts, or other creative works listed on the Platform</li>
              <li><strong>"User Content"</strong> means any information, data, text, images, or materials submitted by users</li>
              <li><strong>"Listing"</strong> means a Creator's submission of Content information to the Platform</li>
              <li><strong>"Transaction"</strong> means any licensing agreement, deal, or business relationship formed between Creators and Buyers</li>
              <li><strong>"Tier"</strong> means subscription levels for Buyers (basic, pro, or suite) with different access privileges</li>
            </ul>
          </section>

          {/* General Terms */}
          <section id="general-terms" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. General Terms (All Users)</h2>

            <h3 className="text-xl font-semibold mb-3">3.1 Eligibility</h3>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years old and capable of forming a binding contract to use this Platform. By using the Platform, you represent and warrant that you meet these requirements.
            </p>

            <h3 className="text-xl font-semibold mb-3">3.2 Account Creation & Security</h3>
            <p className="text-gray-700 mb-4">To access certain features, you must create an account by providing:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Accurate, current, and complete information</li>
              <li>A valid work email address (for Buyers) or email address (for Creators)</li>
              <li>Secure password or OAuth authentication (Google)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized access or security breach.
            </p>

            <h3 className="text-xl font-semibold mb-3">3.3 Platform Role & Relationship</h3>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-4">
              <p className="text-gray-700">
                <strong>IMPORTANT:</strong> KStoryBridge acts solely as an intermediary platform connecting Creators and Buyers. We are <strong>NOT</strong> a party to any transactions, licensing agreements, or business relationships between users. We do not own, control, or guarantee any Content, and we are not responsible for the accuracy, quality, legality, or availability of any Content or User Content.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3">3.4 User Conduct Standards</h3>
            <p className="text-gray-700 mb-4">All users must:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide truthful and accurate information</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect intellectual property rights</li>
              <li>Maintain professional and respectful communication</li>
              <li>Not misrepresent credentials, authority, or Content ownership</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.5 Privacy & Data Protection</h3>
            <p className="text-gray-700 mb-4">
              Your use of the Platform is subject to our <Link to="/privacy" className="text-hanok-teal hover:underline">Privacy Policy</Link>. By using the Platform, you consent to our collection, use, and sharing of your information as described in the Privacy Policy, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>AI processing of Content and conversations for recommendations</li>
              <li>Analytics tracking to improve platform features</li>
              <li>Sharing data with third-party service providers (Supabase, OpenAI, Stripe)</li>
            </ul>
          </section>

          {/* Creator Terms */}
          <section id="creator-terms" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Terms for Creators</h2>
            <p className="text-gray-700 mb-4">
              If you are a Creator listing Content on the Platform, the following additional terms apply to you:
            </p>

            <h3 className="text-xl font-semibold mb-3">4.1 Content Listing Requirements</h3>
            <p className="text-gray-700 mb-4">When submitting a Listing, you must provide:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Accurate title information (Korean and English names)</li>
              <li>Complete and truthful synopses and descriptions</li>
              <li>Correct author and artist credits</li>
              <li>Accurate genre, format, and content ratings</li>
              <li>Truthful platform metrics (views, ratings, chapters)</li>
              <li>Clear rights holder identification</li>
              <li>Supporting documents (pitch decks, sample chapters, promotional materials)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Rights & Representations</h3>
            <p className="text-gray-700 mb-4">By listing Content, you represent and warrant that:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>You own or control all rights to the Content necessary to list it on the Platform</li>
              <li>You have the authority to license or sell the rights you claim to offer</li>
              <li>The Content does not infringe any third-party intellectual property rights</li>
              <li>All information provided is accurate and not misleading</li>
              <li>You have obtained all necessary permissions for any collaborative works</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Content Obligations</h3>
            <p className="text-gray-700 mb-4">Creators must:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Maintain current and accurate Listings</li>
              <li>Promptly update availability and rights status</li>
              <li>Respond to Buyer inquiries in a timely and professional manner</li>
              <li>Fulfill any agreements or commitments made through the Platform</li>
              <li>Remove Listings if rights are no longer available</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.4 Invitation Status & Access</h3>
            <p className="text-gray-700 mb-4">
              Creator accounts may have different invitation statuses (invited, active, pending). Your access to certain features may depend on your status. We reserve the right to verify Creator credentials and Content ownership before granting full platform access.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.5 License Grant to Platform</h3>
            <p className="text-gray-700 mb-4">
              By submitting User Content (Listings, images, pitch decks), you grant KStoryBridge a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, display, and create derivative works of your User Content for the purposes of:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Operating and promoting the Platform</li>
              <li>Generating AI-powered recommendations and search results</li>
              <li>Creating marketing materials (with your approval)</li>
              <li>Improving our AI models and services</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>You retain all ownership rights to your Content.</strong> This license terminates when you remove the Content from the Platform, except for cached or archived copies.
            </p>
          </section>

          {/* Buyer Terms */}
          <section id="buyer-terms" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Terms for Buyers</h2>
            <p className="text-gray-700 mb-4">
              If you are a Buyer searching for and licensing Content, the following additional terms apply to you:
            </p>

            <h3 className="text-xl font-semibold mb-3">5.1 Account Tiers & Access</h3>
            <p className="text-gray-700 mb-4">
              The Platform offers multiple subscription tiers for Buyers, each providing different levels of access to features and content. Subscription tiers may include both free and paid options.
            </p>
            <p className="text-gray-700 mb-4">
              Features available to each tier may include (but are not limited to):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Content browsing and discovery tools</li>
              <li>AI-powered search and recommendations</li>
              <li>Access to pitch decks and proprietary materials</li>
              <li>Creator contact capabilities</li>
              <li>Advanced search and filtering</li>
              <li>Priority support and account management</li>
              <li>Custom research and early access to new features</li>
            </ul>
            <p className="text-gray-700 mb-4">
              The specific subscription tiers, features available in each tier, and current pricing are available at <a href="https://dashboard.kstorybridge.com/pricing" className="text-hanok-teal hover:underline">dashboard.kstorybridge.com/pricing</a>.
            </p>
            <p className="text-gray-700 mb-4">
              Access to features is determined by your current subscription tier. Tier upgrades take effect immediately upon payment confirmation. You may upgrade or downgrade your subscription tier at any time, subject to the terms in Section 7 (Fees & Payment).
            </p>

            <h3 className="text-xl font-semibold mb-3">5.2 Platform Features</h3>
            <p className="text-gray-700 mb-4">
              Subject to your subscription tier, Buyers may access features including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Search the catalog using text, filters, and AI-powered recommendations</li>
              <li>Use AI-powered tools to discover Content based on preferences</li>
              <li>View title information, synopses, metrics, and sample materials</li>
              <li>Save favorites and create custom collections</li>
              <li>Other features as described at <a href="https://dashboard.kstorybridge.com/pricing" className="text-hanok-teal hover:underline">dashboard.kstorybridge.com/pricing</a></li>
            </ul>
            <p className="text-gray-700 mb-4">
              The specific features available to you depend on your current subscription tier.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.3 Contact & Licensing Obligations</h3>
            <p className="text-gray-700 mb-4">When contacting Creators or pursuing licensing deals, Buyers must:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide accurate information about their company and intentions</li>
              <li>Communicate professionally and respectfully</li>
              <li>Respect Creator rights and confidentiality</li>
              <li>Not misuse or redistribute proprietary materials (pitch decks, samples)</li>
              <li>Negotiate licensing terms directly with Creators (Platform is not involved)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.4 AI Chatbot Usage</h3>
            <p className="text-gray-700 mb-4">
              Our AI chatbot is provided as a convenience tool to help you discover Content. Chatbot responses are generated by AI and may contain errors or inaccuracies. You should verify all information independently before making business decisions.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.5 Proprietary Information</h3>
            <p className="text-gray-700 mb-4">
              Pitch decks, sample chapters, and other proprietary materials shared by Creators remain the intellectual property of the Creator. Buyers may not:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Share materials with third parties without Creator permission</li>
              <li>Use materials for purposes other than evaluating licensing opportunities</li>
              <li>Reproduce, distribute, or create derivative works without authorization</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.6 Feature Availability & Changes</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify, add, or remove features from any subscription tier with notice. When we make material changes to feature availability:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We will update the pricing page at <a href="https://dashboard.kstorybridge.com/pricing" className="text-hanok-teal hover:underline">dashboard.kstorybridge.com/pricing</a></li>
              <li>Current subscribers will be notified via email</li>
              <li>If changes reduce features in your current tier, you may downgrade or cancel without penalty</li>
              <li>Changes take effect 30 days after notification</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We may also introduce new features, beta features, or experimental features that are available to select subscription tiers. Access to beta or experimental features may be removed at any time.
            </p>
          </section>

          {/* Transactions & Licensing */}
          <section id="transactions" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Transactions & Licensing</h2>

            <h3 className="text-xl font-semibold mb-3">6.1 Platform's Role</h3>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-4">
              <p className="text-gray-700 mb-4">
                <strong>KStoryBridge is NOT a party to any licensing agreements or transactions between Creators and Buyers.</strong> We provide a platform for connection and discovery only. All licensing negotiations, agreements, payments, and fulfillment are solely between Creators and Buyers.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-3">6.2 No Guarantee of Transactions</h3>
            <p className="text-gray-700 mb-4">
              We do not guarantee that Creators will find Buyers, or that Buyers will find suitable Content. We do not guarantee the success, completion, or terms of any licensing agreement.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.3 User Responsibility</h3>
            <p className="text-gray-700 mb-4">
              Users are solely responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Conducting due diligence on potential partners</li>
              <li>Negotiating licensing terms and agreements</li>
              <li>Verifying rights ownership and chain of title</li>
              <li>Handling payments and financial transactions</li>
              <li>Drafting and executing legal contracts</li>
              <li>Resolving disputes without Platform involvement</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">6.4 Recommendation: Legal Counsel</h3>
            <p className="text-gray-700 mb-4">
              We strongly recommend that all users consult with qualified legal counsel before entering into any licensing agreements or transactions involving intellectual property rights.
            </p>
          </section>

          {/* Fees & Payment */}
          <section id="fees-payment" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Fees & Payment</h2>

            <h3 className="text-xl font-semibold mb-3">7.1 Creator Accounts</h3>
            <p className="text-gray-700 mb-4">
              Creating a Creator account and listing Content on the Platform is currently <strong>free</strong>. We reserve the right to introduce fees for Creator services in the future with advance notice.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.2 Buyer Subscriptions</h3>
            <p className="text-gray-700 mb-4">
              Buyer subscriptions are processed through Stripe. Billing frequency and subscription pricing vary by tier and are available at <a href="https://dashboard.kstorybridge.com/pricing" className="text-hanok-teal hover:underline">dashboard.kstorybridge.com/pricing</a>. Some subscription tiers are free and require no payment.
            </p>
            <p className="text-gray-700 mb-4">
              Subscription fees are non-refundable. You may cancel your subscription at any time, and cancellation will take effect at the end of the current billing period. You will retain access to paid features until the end of the billing period.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.3 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              All payments are processed by Stripe, a third-party payment processor. By providing payment information, you agree to Stripe's terms of service. We do not store your complete payment card information on our servers.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.4 Taxes</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for all applicable taxes related to your use of the Platform or any transactions conducted through the Platform. Subscription fees do not include taxes unless explicitly stated.
            </p>

            <h3 className="text-xl font-semibold mb-3">7.5 Fee Changes</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to change our fees and pricing with 30 days' advance notice. When we change pricing:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We will notify you via email</li>
              <li>Current subscribers will be notified before their next billing cycle</li>
              <li>Continued use of the Platform after fee changes constitutes acceptance of the new pricing</li>
              <li>You may cancel your subscription before changes take effect</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold mb-3">8.1 Platform Ownership</h3>
            <p className="text-gray-700 mb-4">
              The Platform, including all software, design, text, graphics, logos, and other materials (excluding User Content), is owned by KStoryBridge and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.2 User Content Ownership</h3>
            <p className="text-gray-700 mb-4">
              You retain all ownership rights to your User Content. By submitting User Content, you grant KStoryBridge the license described in Section 4.5 (for Creators) or as necessary to operate the Platform.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.3 Trademark Policy</h3>
            <p className="text-gray-700 mb-4">
              "KStoryBridge" and our logos are trademarks of KStoryBridge. You may not use our trademarks without prior written permission.
            </p>

            <h3 className="text-xl font-semibold mb-3">8.4 Copyright Infringement Claims</h3>
            <p className="text-gray-700 mb-4">
              If you believe Content on the Platform infringes your copyright, please contact us at <a href="mailto:legal@kstorybridge.com" className="text-hanok-teal hover:underline">legal@kstorybridge.com</a> with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Description of the copyrighted work</li>
              <li>Location of the allegedly infringing material</li>
              <li>Your contact information</li>
              <li>Statement of good faith belief that use is unauthorized</li>
              <li>Statement that the information is accurate and you are authorized to act</li>
            </ul>
          </section>

          {/* Prohibited Conduct */}
          <section id="prohibited-conduct" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Prohibited Conduct</h2>
            <p className="text-gray-700 mb-4">You may not:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Violate any laws or regulations</li>
              <li>Infringe intellectual property rights of others</li>
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Attempt to gain unauthorized access to the Platform or user accounts</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Interfere with or disrupt Platform operations</li>
              <li>Upload malware, viruses, or harmful code</li>
              <li>Circumvent security features or access controls</li>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Collect user information without consent</li>
              <li>Engage in any conduct that damages the Platform's reputation</li>
            </ul>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Account Termination & Suspension</h2>

            <h3 className="text-xl font-semibold mb-3">10.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by contacting us at <a href="mailto:support@kstorybridge.com" className="text-hanok-teal hover:underline">support@kstorybridge.com</a>. Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your access to the Platform will be revoked</li>
              <li>Your User Content will be removed (subject to backup retention)</li>
              <li>Active subscriptions will be canceled (no refunds for partial periods)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">10.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without notice, if we believe you have:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Violated these Terms</li>
              <li>Engaged in fraudulent or illegal activity</li>
              <li>Provided false or misleading information</li>
              <li>Engaged in conduct harmful to the Platform or other users</li>
              <li>Failed to pay fees when due</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">10.3 Effect of Termination</h3>
            <p className="text-gray-700 mb-4">
              Upon termination, all rights and licenses granted to you under these Terms will immediately cease. Sections that by their nature should survive termination (including payment obligations, intellectual property provisions, disclaimers, and limitation of liability) will continue to apply.
            </p>
          </section>

          {/* Disclaimers */}
          <section id="disclaimers" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. Disclaimers & Warranties</h2>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-4">
              <p className="text-gray-700 mb-4">
                <strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong>
              </p>
              <p className="text-gray-700 mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, KSTORYBRIDGE DISCLAIMS ALL WARRANTIES, INCLUDING:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Warranties regarding accuracy, reliability, or availability of the Platform</li>
                <li>Warranties that the Platform will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding User Content, including accuracy, ownership, or legality</li>
                <li>Warranties regarding AI-generated recommendations or chatbot responses</li>
              </ul>
            </div>
            <p className="text-gray-700 mb-4">
              We do not warrant or guarantee:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>The accuracy, completeness, or reliability of any Content or User Content</li>
              <li>That any transactions will be successful or completed</li>
              <li>That the Platform will meet your specific requirements</li>
              <li>That security measures will prevent unauthorized access or breaches</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You use the Platform at your own risk. You are solely responsible for any damage to your computer or loss of data resulting from use of the Platform.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section id="limitation-liability" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6 mb-4">
              <p className="text-gray-700 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, KSTORYBRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF THE PLATFORM.</strong>
              </p>
              <p className="text-gray-700">
                <strong>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) $100 OR (B) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</strong>
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              This limitation applies to claims based on warranty, contract, tort, strict liability, or any other legal theory, even if we have been advised of the possibility of such damages.
            </p>
            <p className="text-gray-700 mb-4">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          {/* Indemnification */}
          <section id="indemnification" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless KStoryBridge, its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from or related to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your User Content or any infringement of third-party rights</li>
              <li>Your transactions or interactions with other users</li>
              <li>Your violation of any laws or regulations</li>
              <li>Any misrepresentation or breach of your warranties</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We reserve the right to assume exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with our defense.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section id="dispute-resolution" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">14. Dispute Resolution & Arbitration</h2>

            <h3 className="text-xl font-semibold mb-3">14.1 Informal Resolution</h3>
            <p className="text-gray-700 mb-4">
              Before filing any formal dispute, you agree to contact us at <a href="mailto:legal@kstorybridge.com" className="text-hanok-teal hover:underline">legal@kstorybridge.com</a> to attempt to resolve the issue informally. We will make good faith efforts to resolve disputes amicably.
            </p>

            <h3 className="text-xl font-semibold mb-3">14.2 Binding Arbitration</h3>
            <p className="text-gray-700 mb-4">
              If informal resolution fails, any dispute, claim, or controversy arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association (AAA).
            </p>
            <p className="text-gray-700 mb-4">
              Arbitration will be conducted by a single arbitrator in California, and the arbitrator's decision will be final and binding. You waive your right to a jury trial or to participate in a class action lawsuit.
            </p>

            <h3 className="text-xl font-semibold mb-3">14.3 Exceptions</h3>
            <p className="text-gray-700 mb-4">
              Either party may seek injunctive or equitable relief in court to protect intellectual property rights or prevent unauthorized use of the Platform.
            </p>

            <h3 className="text-xl font-semibold mb-3">14.4 User Disputes</h3>
            <p className="text-gray-700 mb-4">
              Disputes between Creators and Buyers regarding transactions are solely between those parties. KStoryBridge is not responsible for mediating or resolving user-to-user disputes.
            </p>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">15. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles.
            </p>
            <p className="text-gray-700 mb-4">
              Subject to the arbitration provisions above, you consent to the exclusive jurisdiction of courts located in California for any disputes not subject to arbitration.
            </p>
          </section>

          {/* Changes to Terms */}
          <section id="changes" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">16. Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. When we make changes, we will:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Update the "Last Updated" date at the top of these Terms</li>
              <li>Notify you via email if the changes are material</li>
              <li>Display a prominent notice on the Platform</li>
              <li>Provide at least 30 days' notice for material changes</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your continued use of the Platform after changes become effective constitutes your acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Platform and may terminate your account.
            </p>

            <h3 className="text-xl font-semibold mb-3">16.1 Additional Policies</h3>
            <p className="text-gray-700 mb-4">
              We may establish additional policies, rules, or guidelines from time to time. Such policies will be incorporated by reference into these Terms.
            </p>

            <h3 className="text-xl font-semibold mb-3">16.2 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy and any additional policies, constitute the entire agreement between you and KStoryBridge regarding use of the Platform, and supersede any prior agreements.
            </p>

            <h3 className="text-xl font-semibold mb-3">16.3 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold mb-3">16.4 No Waiver</h3>
            <p className="text-gray-700 mb-4">
              Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right to enforce it in the future.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">17. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have questions, concerns, or requests regarding these Terms, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-300 rounded-2xl p-6">
              <p className="text-gray-700 mb-2"><strong>General Support:</strong> <a href="mailto:support@kstorybridge.com" className="text-hanok-teal hover:underline">support@kstorybridge.com</a></p>
              <p className="text-gray-700 mb-2"><strong>Legal Inquiries:</strong> <a href="mailto:legal@kstorybridge.com" className="text-hanok-teal hover:underline">legal@kstorybridge.com</a></p>
              <p className="text-gray-700"><strong>Copyright Claims:</strong> <a href="mailto:legal@kstorybridge.com" className="text-hanok-teal hover:underline">legal@kstorybridge.com</a></p>
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

export default TermsPage;
