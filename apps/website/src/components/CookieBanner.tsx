import { useState, useEffect } from "react";
import { X, Cookie, Settings } from "lucide-react";
import { Link } from "react-router-dom";

type ConsentState = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

const CONSENT_KEY = "kstorybridge_cookie_consent";
const CONSENT_VERSION = "1.0";

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  });

  useEffect(() => {
    // Check if user has already provided consent
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (!savedConsent) {
      // Show banner after 1 second delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        // Check if consent is from current version
        if (parsed.version === CONSENT_VERSION) {
          applyConsent(parsed.consent);
        } else {
          // Old version, show banner again
          setShowBanner(true);
        }
      } catch (error) {
        console.error("Error parsing cookie consent:", error);
        setShowBanner(true);
      }
    }
  }, []);

  const applyConsent = (newConsent: ConsentState) => {
    setConsent(newConsent);

    // Apply Google Tag Manager consent mode
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': newConsent.analytics ? 'granted' : 'denied',
        'ad_storage': newConsent.marketing ? 'granted' : 'denied',
      });
    }

    // Save to localStorage
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      consent: newConsent,
    }));
  };

  const handleAcceptAll = () => {
    const newConsent: ConsentState = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    };
    applyConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptEssential = () => {
    const newConsent: ConsentState = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
    applyConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    const newConsent: ConsentState = {
      ...consent,
      essential: true, // Always true
      timestamp: Date.now(),
    };
    applyConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleToggle = (key: keyof ConsentState) => {
    if (key === 'essential') return; // Cannot disable essential cookies
    setConsent(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={() => setShowBanner(false)}
      />

      {/* Banner */}
      <div className="relative w-full max-w-4xl m-4 mb-6 bg-white border-2 border-gray-300 rounded-2xl shadow-2xl pointer-events-auto">
        {/* Close button */}
        <button
          onClick={() => setShowBanner(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {!showSettings ? (
            // Main banner view
            <>
              <div className="flex items-start space-x-4 mb-6">
                <Cookie className="w-8 h-8 text-hanok-teal flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">We Value Your Privacy</h2>
                  <p className="text-gray-700 mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze site traffic, and personalize content.
                    By clicking "Accept All," you consent to our use of cookies.
                  </p>
                  <p className="text-sm text-gray-600">
                    You can customize your preferences or choose to accept only essential cookies.
                    Learn more in our <Link to="/privacy" className="text-hanok-teal hover:underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-6 py-3 bg-hanok-teal text-white font-semibold rounded-lg hover:bg-hanok-teal/90 transition-colors"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="flex-1 px-6 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Essential Only
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
              </div>
            </>
          ) : (
            // Settings view
            <>
              <div className="flex items-start space-x-4 mb-6">
                <Settings className="w-8 h-8 text-hanok-teal flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-black mb-2">Cookie Preferences</h2>
                  <p className="text-gray-700">
                    Manage your cookie preferences. You can enable or disable different types of cookies below.
                  </p>
                </div>
              </div>

              {/* Cookie categories */}
              <div className="space-y-4 mb-6">
                {/* Essential Cookies */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-black">Essential Cookies</h3>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-500 text-white">
                        Always Active
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies are necessary for the website to function and cannot be disabled. They include authentication,
                    security, and basic functionality.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-black">Analytics Cookies</h3>
                    <button
                      onClick={() => handleToggle('analytics')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.analytics ? 'bg-hanok-teal' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={consent.analytics}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.analytics ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information
                    anonymously. Includes Google Analytics and usage tracking.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-black">Marketing Cookies</h3>
                    <button
                      onClick={() => handleToggle('marketing')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consent.marketing ? 'bg-hanok-teal' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={consent.marketing}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consent.marketing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies are used to track visitors across websites to display personalized ads and marketing messages.
                    Currently not used, but may be enabled in the future.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-6 py-3 bg-hanok-teal text-white font-semibold rounded-lg hover:bg-hanok-teal/90 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
