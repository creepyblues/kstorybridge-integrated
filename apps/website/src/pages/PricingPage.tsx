
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const PricingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 mb-12">
                Choose the perfect plan for creators or buyers. No hidden fees, cancel anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Tables */}
        <section className="py-0 pb-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="creators" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
                  <TabsTrigger value="creators">Creator Plans</TabsTrigger>
                  <TabsTrigger value="buyers">Buyer Plans</TabsTrigger>
                </TabsList>
                
                {/* Creator Plans */}
                <TabsContent value="creators">
                  <div className="grid md:grid-cols-2 gap-8">
                    <Card className="relative">
                      <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Listing</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                        <div className="text-gray-600 mb-8">Forever free</div>
                        <ul className="text-left space-y-4 text-gray-600 mb-8">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Basic IP listing
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            AI-generated pitch deck
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Verified rights badge
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Basic analytics
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Community support
                          </li>
                        </ul>
                        <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                          Start Free
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="relative border-primary border-2">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                      <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Insights</h3>
                        <div className="text-5xl font-bold text-primary mb-2">$299</div>
                        <div className="text-gray-600 mb-8">per title / year</div>
                        <ul className="text-left space-y-4 text-gray-600 mb-8">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Everything in Free
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Detailed viewer analytics
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Executive contact information
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Priority listing placement
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Direct messaging with buyers
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Advanced pitch deck features
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Priority support
                          </li>
                        </ul>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                          Upgrade to Premium
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Buyer Plans */}
                <TabsContent value="buyers">
                  <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="text-center">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Preview</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                        <div className="text-gray-600 mb-8">Limited access</div>
                        <ul className="text-left space-y-4 text-gray-600 mb-8">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Browse public catalogue
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Basic content information
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Limited contact access
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Community support
                          </li>
                        </ul>
                        <Button variant="outline" className="w-full border-gray-300">
                          Start Free
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="relative border-primary border-2">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                      <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro Scout</h3>
                        <div className="text-5xl font-bold text-primary mb-2">$199</div>
                        <div className="text-gray-600 mb-8">per month</div>
                        <ul className="text-left space-y-4 text-gray-600 mb-8">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Full catalogue access
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Advanced search & filters
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Live performance analytics
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Direct creator contact
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Deal room access
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Priority support
                          </li>
                        </ul>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                          Start 14-Day Trial
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="text-center">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-2">Custom</div>
                        <div className="text-gray-600 mb-8">Contact sales</div>
                        <ul className="text-left space-y-4 text-gray-600 mb-8">
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Everything in Pro Scout
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Custom integrations
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            Dedicated account manager
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            White-label options
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            SLA guarantees
                          </li>
                          <li className="flex items-start">
                            <span className="text-primary mr-3 mt-1">✓</span>
                            24/7 premium support
                          </li>
                        </ul>
                        <Button variant="outline" className="w-full border-gray-900 text-gray-900">
                          Contact Sales
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    How does the verification process work?
                  </h3>
                  <p className="text-gray-600">
                    Our team reviews ownership documents, publication contracts, or other proof of IP rights. Most verifications are completed within 24-48 hours.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What types of IP can I list?
                  </h3>
                  <p className="text-gray-600">
                    We accept webtoons, web novels, light novels, games, manhwa, and other Korean digital content with proven audience engagement.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Do you take a commission on deals?
                  </h3>
                  <p className="text-gray-600">
                    No, Story Bridge doesn't take any commission on licensing deals. We operate purely on subscription fees.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Can I cancel my subscription anytime?
                  </h3>
                  <p className="text-gray-600">
                    Yes, all plans can be cancelled at any time. Your listings remain active until your current billing period ends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
