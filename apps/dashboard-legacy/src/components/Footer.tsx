const Footer = () => {
  const handleCookieSettings = () => {
    // Clear consent to show banner again
    localStorage.removeItem('kstorybridge_cookie_consent');
    window.location.reload();
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-600">
            © 2025 KStoryBridge
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <a
              href="https://kstorybridge.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              Privacy Policy
            </a>
            <button
              onClick={handleCookieSettings}
              className="hover:text-black transition-colors"
            >
              Cookie Settings
            </button>
            <a
              href="mailto:support@kstorybridge.com"
              className="hover:text-black transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
