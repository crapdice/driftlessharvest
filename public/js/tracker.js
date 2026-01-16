/**
 * Analytics Tracker
 * Simple client-side tracking for page views and user events
 */

(function () {
    'use strict';

    // Generate or retrieve session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    // Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Track event
    function trackEvent(eventType, additionalData = {}) {
        const data = {
            session_id: getSessionId(),
            event_type: eventType,
            page_url: window.location.pathname,
            referrer: document.referrer || '',
            device_type: getDeviceType(),
            user_agent: navigator.userAgent,
            ...additionalData
        };

        // Send to server (fire and forget)
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true // Ensure request completes even if page unloads
        }).catch(err => {
            // Silently fail - don't disrupt user experience
            console.debug('[Analytics] Track failed:', err);
        });
    }

    // Track page view on load
    function trackPageView() {
        trackEvent('pageview');
    }

    // Track product view
    function trackProductView(productId) {
        trackEvent('product_view', { product_id: productId });
    }

    // Track add to cart
    function trackAddToCart(productId) {
        trackEvent('add_to_cart', { product_id: productId });
    }

    // Track checkout
    function trackCheckout() {
        trackEvent('checkout');
    }

    // Initialize tracking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
        trackPageView();
    }

    // Expose tracking functions globally for manual tracking
    window.analytics = {
        trackPageView,
        trackProductView,
        trackAddToCart,
        trackCheckout,
        trackEvent
    };

})();
