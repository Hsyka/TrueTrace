import React, { useEffect, useRef, useState } from 'react';

export default function Landing() {
  const [isSticky, setIsSticky] = useState(false);
  const secondaryHeaderRef = useRef(null);
  const sentinelRef = useRef(null);

  // Heights used for offsets
  const MAIN_HEADER_HEIGHT = 64; // matches top-16, ~64px

    useEffect(() => {
        // Observe when the sentinel (just below the hero) crosses the main header area.
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            // If the sentinel is NOT intersecting with the top margin area, hero is scrolled past => sticky
            setIsSticky(!entry.isIntersecting);
        },
        {
            root: null,
            // When the sentinel is within the top 64px, consider it intersecting (i.e., still in hero zone)
            rootMargin: `-${MAIN_HEADER_HEIGHT}px 0px 0px 0px`,
            threshold: 0,
        }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
}, []);

// Scrolls to correct section for Second Header
    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate current offsets
        const main = 64; // main header height
        const secondary = isSticky // second stickey header height
        const offset = main + secondary + 12

        window.scrollTo({
        top: rect.top + scrollTop - offset,
        behavior: 'smooth',
        });
    };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Header - Always visible */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 transition-all h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        {/* Top Title/Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            True Trace
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {/* Features Tab - FUTURE IMPLEMENTATION 
            <a href="#features" className="text-gray-700 hover:text-blue-500 transition">Features</a> */}
            {/* Capabilities Tab - FUTURE IMPLEMENTATION 
            <a href="#capabilities" className="text-gray-700 hover:text-blue-500 transition">Capabilities</a> */}
            {/* Benefits Tab - FUTURE IMPLEMENTATION 
            <a href="#benefits" className="text-gray-700 hover:text-blue-500 transition">Benefits</a>*/}
            {/* Resources Tab - FUTURE IMPLEMENTATION 
            <a href="#resources" className="text-gray-700 hover:text-blue-500 transition">Resources</a>*/}
            {/* Pricing Tab - FUTURE IMPLEMENTATION 
            <a href="/pricing" className="text-gray-700 hover:text-blue-500 transition">Pricing</a>*/}
            {/* Login Button */}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 transition">Login</Link>
            {/* Demo Button */}
            <Link to="/demo" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
              Try it free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Gradient */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-300 via-sky-100 to-green-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete Asset Visibility,<br />Uncompromising Accountability
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Track every asset movement with precision—from storage to sale, with full audit trails and intelligent alerts that keep your inventory transparent and compliant.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/signup" className="bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition shadow-lg">
              Start Free Trial
            </Link>
            <Link to="/demo" className="bg-white text-blue-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition border-2 border-blue-500">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Sentinel placed right after the hero to control sticky state */}
      <div ref={sentinelRef} aria-hidden="true"></div>

      {/* Secondary Header - Static until it reaches the main header; sticky while past hero; un-sticks when returning into hero */}
      <div
        ref={secondaryHeaderRef}
        className={`${isSticky ? 'fixed top-16 shadow-lt' : 'relative'} w-full bg-white border-b border-gray-200 z-40 transition-all`}
      >
        <div className="px-6 py-5">
          <nav className="flex justify-center space-x-8 text-base">
            <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-blue-500 transition font-medium">
              Features
            </button>
            <button onClick={() => scrollToSection('capabilities')} className="text-gray-700 hover:text-blue-500 transition font-medium">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('benefits')} className="text-gray-700 hover:text-blue-500 transition font-medium">
              Benefits
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-blue-500 transition font-medium">
              Pricing
            </button>
          </nav>
        </div>
      </div>

      {/* Spacer when sticky to prevent layout jump */}
      {isSticky && <div className="h-14"></div>}

      {/* Features Overview */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From asset intake to disposal, True Trace gives your teams complete visibility and control—all in one intelligent platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Monitor every asset movement instantly with automated updates and location tracking across all storage facilities.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Audit Trails</h3>
              <p className="text-gray-600">
                Every action is logged and timestamped. Full paper-trailing for compliance, accountability, and peace of mind.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-gray-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Alerts</h3>
              <p className="text-gray-600">
                Stay ahead with smart notifications for low stock, expiring assets, unauthorized movements, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-green-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Inventory Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">75%</div>
              <div className="text-blue-100">Faster Asset Audits</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Audit Trail Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">60%</div>
              <div className="text-blue-100">Reduction in Losses</div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              True Trace Capabilities
            </h2>
            <p className="text-xl text-gray-600">
              Powerful asset management with intuitive design and built-in intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Asset Lifecycle Management', desc: 'Track assets from acquisition to disposal with complete visibility at every stage.' },
              { title: 'Advanced Filtering', desc: 'Find exactly what you need with powerful search and filter capabilities across all asset attributes.' },
              { title: 'Custom Workflows', desc: 'Automate approval processes for asset movements, transfers, and disposals.' },
              { title: 'Multi-Location Support', desc: 'Manage inventory across multiple warehouses, stores, and facilities from one platform.' },
              { title: 'Barcode & RFID Integration', desc: 'Seamlessly integrate with scanning technology for instant asset identification.' },
              { title: 'Compliance Reporting', desc: 'Generate audit-ready reports with complete chain of custody documentation.' }
            ].map((capability, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{capability.title}</h3>
                <p className="text-gray-600 text-sm">{capability.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Clean representation with powerful insights
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Visual Dashboard</h3>
                    <p className="text-gray-600">See your entire inventory at a glance with intuitive visualizations and real-time updates.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Unbreakable Audit Trail</h3>
                    <p className="text-gray-600">Every movement, sale, or disposal is permanently logged with user, timestamp, and reason.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Smart Alerts</h3>
                    <p className="text-gray-600">Proactive notifications keep you informed of critical events before they become problems.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-32 h-32 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

 {/* Pricing Preview Section */}
    <section className="py-20 bg-white" id="pricing">
    <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
        <p className="text-gray-600 mt-3">Start free. Upgrade when you scale.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
        {[
            {name: 'Starter', price: '$0', desc: 'For small teams validating workflows', features: ['Up to 500 assets', '1 location', 'Email support']},
            {name: 'Growth', price: '$49', desc: 'Best for multi-location ops', features: ['10k assets', '5 locations', 'RFID/Barcode', 'Audit reports']},
            {name: 'Scale', price: 'Custom', desc: 'Advanced security & controls', features: ['Unlimited assets', 'SSO/SAML', 'Custom workflows', 'Priority support']},
        ].map((p, i) => (
            <div key={i} className={`rounded-2xl border p-8 ${i===1 ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{p.name}</h3>
                <div className="text-3xl font-bold text-gray-900">{p.price}</div>
            </div>
            <p className="text-gray-600 mt-2">{p.desc}</p>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
                {p.features.map((f, j) => (
                <li key={j} className="flex items-center">
                    <span className="w-6 h-6 mr-3 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">✓</span>
                    {f}
                </li>
                ))}
            </ul>
            <Link to="/signup" className={`mt-6 inline-flex justify-center w-full py-3 rounded-lg font-semibold ${i===1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                {i===2 ? 'Contact Sales' : 'Get Started'}
            </Link>
            </div>
        ))}
        </div>
    </div>
    </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-green-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Get started with True Trace
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Join thousands of companies managing their assets with confidence
          </p>
        </div>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup" className="bg-white text-blue-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg w-full sm:w-auto">
              Start Free Trial
            </Link>
            <Link to="/demo" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-500 transition w-full sm:w-auto">
              Book a Demo
            </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">True Trace</div>
              <p className="text-sm text-gray-400">
                Complete asset visibility and accountability for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center text-gray-400">
            © 2025 True Trace. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}