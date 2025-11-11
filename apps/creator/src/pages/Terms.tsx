import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function Terms() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Terms of Use</h1>
          <p className="text-gray-600">Last Updated: January 11, 2025</p>
        </div>

        {/* Introduction */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Entity:</strong> The Story Bridge, LLC ("The Story Bridge," "we," "us," "our") operating the KStoryBridge service (the "Service" or "KStoryBridge").
            </p>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Use ("Terms") govern your access to and use of KStoryBridge. By creating an account or using the Service, you agree to these Terms and our{' '}
              <a
                href="https://kstorybridge.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black underline hover:text-gray-700"
              >
                Privacy Policy
              </a>. If you upload titles, you must also accept the Title Upload & Deal Terms (Section 12).
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Accounts & Eligibility */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">1. Accounts & Eligibility</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">1.1 Eligibility</h3>
                <p className="text-gray-700 leading-relaxed">
                  You must be at least 18 (or age of majority where you live) and able to form a binding contract.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-2">1.2 Account Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for accurate registration info, safeguarding credentials, and all activity under your account. Notify us promptly of unauthorized use.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-2">1.3 Business Use</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you use the Service for an entity, you represent you're authorized to bind that entity; "you" includes that entity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Our Role */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">2. Our Role</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">2.1 Marketplace Only</h3>
                <p className="text-gray-700 leading-relaxed">
                  KStoryBridge facilitates discovery and introductions between creators and industry professionals. We are not an agent, manager, attorney, or fiduciary and are not a party to user-to-user deals. Users are solely responsible for due diligence and decisions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-2">2.2 No Professional Advice</h3>
                <p className="text-gray-700 leading-relaxed">
                  We do not provide legal, financial, or business advice. Consult independent counsel before entering any deal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: User Content & License */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">3. User Content & License</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">3.1 Ownership</h3>
                <p className="text-gray-700 leading-relaxed">
                  Except for the limited license below, you retain ownership of content you submit ("User Content").
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-2">3.2 License to The Story Bridge</h3>
                <p className="text-gray-700 leading-relaxed">
                  To operate and promote the Service, you grant The Story Bridge a worldwide, non-exclusive, royalty-free license to host, store, reproduce, transcode, display, and publicly perform your User Content on/through the Service, and to use the Title/series name, thumbnails, and loglines in platform marketing/editorial (including email and social) solely to promote your listing and the Service. This license ends when you delete the content, except for (i) reasonable backups and (ii) uses already committed (e.g., previously sent emails).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-2">3.3 Feedback</h3>
                <p className="text-gray-700 leading-relaxed">
                  You grant us a perpetual, irrevocable, royalty-free license to use feedback and suggestions without restriction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Acceptable Use */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You will not:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Upload unlawful/infringing/defamatory/obscene content</li>
              <li>Misrepresent identity, ownership, or chain of title</li>
              <li>Scrape or interfere with security</li>
              <li>Bypass platform features or fees</li>
              <li>Spam or harass</li>
              <li>Upload others' copyrighted works without permission</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Repeat infringement may result in termination.
            </p>
          </CardContent>
        </Card>

        {/* Section 5: Third-Party Services */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Links and communications may point to third-party sites/services. We do not control or endorse third-party content and are not responsible for it.
            </p>
          </CardContent>
        </Card>

        {/* Section 6: Fees; Taxes */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">6. Fees; Taxes</h2>
            <p className="text-gray-700 leading-relaxed">
              If parts of the Service require fees, you agree to pay listed amounts and applicable taxes. Fees are non-refundable unless required by law.
            </p>
          </CardContent>
        </Card>

        {/* Section 7: IP Complaints (DMCA) */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">7. IP Complaints (DMCA)</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Agent:</strong> DMCA Agent</p>
              <p><strong>Email:</strong> <a href="mailto:support@kstorybridge.com" className="text-black underline hover:text-gray-700">support@kstorybridge.com</a></p>
              <p><strong>Address:</strong> 1401 21ST ST STE R SACRAMENTO CA 95811</p>
              <p><strong>Phone:</strong> 650-539-9021</p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              We may remove content and, when appropriate, terminate repeat infringers.
            </p>
          </CardContent>
        </Card>

        {/* Section 8: Disclaimers */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">8. Disclaimers</h2>
            <p className="text-gray-700 leading-relaxed uppercase">
              The service is provided "as is" without warranties of any kind (including merchantability, fitness for a particular purpose, or non-infringement). We do not warrant deal outcomes or user content.
            </p>
          </CardContent>
        </Card>

        {/* Section 9: Limitation of Liability */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed uppercase">
              To the maximum extent permitted by law, The Story Bridge will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages. Our total liability for claims relating to the service will not exceed the greater of (a) fees you paid to us in the 12 months before the claim or (b) USD $500.
            </p>
          </CardContent>
        </Card>

        {/* Section 10: Indemnity */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">10. Indemnity</h2>
            <p className="text-gray-700 leading-relaxed">
              You will defend, indemnify, and hold harmless The Story Bridge, its affiliates, officers, directors, employees, and agents from claims, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from your User Content, your use of the Service, or your breach of these Terms.
            </p>
          </CardContent>
        </Card>

        {/* Section 11: Termination; Suspension */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">11. Termination; Suspension</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend/terminate accounts or remove content for breach, suspected infringement, legal request, or risk to users. You may delete your account at any time; certain terms survive termination.
            </p>
          </CardContent>
        </Card>

        {/* Section 12: Extra Terms for Uploading Titles */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">12. Extra Terms for Uploading Titles</h2>
            <p className="text-gray-700 leading-relaxed">
              Uploading any title requires agreeing to the separate Title Upload & Deal Terms (per-title rights grant, commission & anti-circumvention, takedowns, and audits). If there's a conflict, those specific terms control for that title.
            </p>
          </CardContent>
        </Card>

        {/* Section 13: Dispute Resolution; Arbitration; Class-Action Waiver */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">13. Dispute Resolution; Arbitration; Class-Action Waiver</h2>
            <p className="text-gray-700 leading-relaxed">
              Except for small-claims and injunctive relief, disputes must be resolved by binding arbitration administered by JAMS before a single arbitrator in Los Angeles, California under the JAMS Streamlined or Comprehensive Rules (as applicable). No class actions or class arbitrations. Both parties waive jury trial rights.
            </p>
          </CardContent>
        </Card>

        {/* Section 14: Governing Law */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">14. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              California law (conflict-of-laws excluded); the Federal Arbitration Act governs arbitrability.
            </p>
          </CardContent>
        </Card>

        {/* Section 15: Changes */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">15. Changes</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms; for material changes, we'll provide notice (e.g., email or in-product). Changes take effect 30 days after notice.
            </p>
          </CardContent>
        </Card>

        {/* Section 16: Miscellaneous */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-black mb-4">16. Miscellaneous</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Entire Agreement; Assignment (you need our consent; we may assign); Severability; No Waiver; Force Majeure; Electronic Communications & Signatures; Survival (Sections 2, 3.2–3.3, 7–13, 16).
            </p>
            <p className="text-gray-700 leading-relaxed font-semibold">
              By creating an account, you agree to these Terms.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
