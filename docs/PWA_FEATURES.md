# Progressive Web App (PWA) Features

Comprehensive documentation for the PWA capabilities of the XPR Delegation Demo application.

## Overview

The XPR Delegation Demo is built as a Progressive Web App (PWA), providing users with a native app-like experience across all platforms. The PWA implementation includes offline capabilities, installability, push notifications, and background synchronization.

## PWA Architecture

### Core Components

#### 1. Web App Manifest (`public/manifest.json`)
```json
{
  "name": "XPR Delegation Demo",
  "short_name": "XPR Delegate",
  "description": "Delegate votes to Block Producers on XPR Network",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-US",
  "categories": ["finance", "business", "productivity"]
}
```

**Key Features:**
- **Standalone Display**: Runs without browser UI
- **Custom Theme**: Blue theme color (#2563eb) for branding
- **Portrait Orientation**: Optimized for mobile usage
- **App Categories**: Categorized as finance/business app

#### 2. Service Worker (`public/sw.js`)
```javascript
const CACHE_NAME = 'xpr-delegation-demo-cache-v1';

const FILES_TO_CACHE = [
  '/', 
  '/index.html', 
  '/manifest.json', 
  '/logo/favicon.ico',
  '/logo/favicon-16x16.png',
  '/logo/favicon-32x32.png',
  '/logo/logo-192x192.png',
  '/logo/logo-512x512.png',
  '/logo/logo-apple-touch-icon.png',
  '/logo/logo.png',
  '/logo/logo.svg'
];
```

**Caching Strategy:**
- **Static Assets**: HTML, CSS, JS, images cached for offline use
- **API Exclusion**: Blockchain API requests bypass cache for real-time data
- **Cache-First**: Serves cached content when available
- **Network Fallback**: Fetches from network when cache miss

#### 3. PWA Registration (`index.html`)
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

## Installation Features

### Automatic Install Prompts
```javascript
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button
  const installButton = document.createElement('div');
  installButton.innerHTML = '📱 Install XPR Delegation Demo';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #2563eb;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    z-index: 1000;
  `;
  
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      deferredPrompt = null;
      installButton.remove();
    });
  });
  
  document.body.appendChild(installButton);
  
  // Auto-hide after 10 seconds
  setTimeout(() => installButton.remove(), 10000);
});
```

### Installation Methods

#### Mobile Devices
- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: Automatic install prompt
- **Other Mobile Browsers**: Browser-specific installation methods

#### Desktop Browsers
- **Chrome/Edge**: Install button in address bar
- **Firefox**: Install button in address bar
- **Safari**: File → Add to Dock

## Offline Capabilities

### Cached Resources
- **Application Shell**: HTML, CSS, JavaScript files
- **Static Assets**: Images, fonts, icons
- **Configuration**: Manifest and service worker files

### Online Requirements
- **Blockchain Data**: Account info, vote status, token balances
- **Wallet Connection**: WebAuth/Anchor wallet integration
- **Transaction Submission**: Vote delegation and token transfers

### Graceful Degradation
- **Offline Mode**: App shell loads from cache
- **Limited Functionality**: Basic UI available without network
- **Error Handling**: Clear messaging for offline state

## App Shortcuts

### Quick Actions
```json
"shortcuts": [
  {
    "name": "Connect Wallet",
    "short_name": "Connect",
    "description": "Connect your XPR wallet to start delegating votes",
    "url": "/?action=connect",
    "icons": [
      {
        "src": "/logo/logo-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      }
    ]
  },
  {
    "name": "View Validators",
    "short_name": "Validators", 
    "description": "Browse available Block Producers",
    "url": "/?action=validators",
    "icons": [
      {
        "src": "/logo/logo-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      }
    ]
  }
]
```

### Context Menu Integration
- **Right-click**: Access shortcuts from context menu
- **App Icon**: Long-press for shortcut options
- **Desktop**: Right-click app icon for shortcuts

## Background Features

### Push Notifications
```javascript
self.addEventListener('push', event => {
  const title = 'XPR Delegation Demo';
  const options = {
    body: event.data ? event.data.text() : 'You have new updates!',
    icon: '/logo/logo-192x192.png',
    badge: '/logo/logo-72x72.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
```

### Background Sync
```javascript
self.addEventListener('sync', event => {
  if (event.tag === 'sync-new-votes') {
    console.log('[ServiceWorker] Background sync triggered');
    event.waitUntil(
      new Promise(resolve => {
        console.log('Simulating background vote sync...');
        setTimeout(() => {
          console.log('Background vote sync complete');
          resolve(true);
        }, 2000);
      })
    );
  }
});
```

### Update Management
- **Automatic Detection**: Service worker detects new versions
- **User Prompts**: Confirmation dialog for updates
- **Seamless Updates**: Background installation and activation

## Performance Benefits

### Loading Performance
- **Instant Loading**: Cached assets load immediately
- **Reduced Latency**: No network requests for static content
- **Bandwidth Savings**: Less data consumption on repeat visits

### User Experience
- **Native Feel**: App-like navigation and interactions
- **Offline Access**: Basic functionality without internet
- **Cross-Platform**: Consistent experience across devices

### Technical Advantages
- **Reduced Server Load**: Less requests to origin server
- **Better Reliability**: Works even with poor connectivity
- **Enhanced Security**: HTTPS required for PWA features

## Browser Support

### Full PWA Support
- **Chrome**: Complete PWA feature support
- **Edge**: Full PWA capabilities
- **Firefox**: Most PWA features supported
- **Safari**: Basic PWA support (iOS 11.3+)

### Feature Compatibility
- **Service Workers**: Supported in all modern browsers
- **Web App Manifest**: Universal support
- **Push Notifications**: Chrome, Firefox, Edge
- **Background Sync**: Chrome, Edge

## Development Considerations

### Testing PWA Features
```bash
# Test service worker
npm run dev
# Open DevTools → Application → Service Workers

# Test offline functionality
# DevTools → Network → Offline checkbox

# Test install prompts
# Chrome DevTools → Application → Manifest
```

### Debugging Tools
- **Chrome DevTools**: Application tab for PWA debugging
- **Lighthouse**: PWA audit and performance testing
- **Service Worker Inspector**: Real-time service worker debugging

### Best Practices
- **Cache Strategy**: Balance between freshness and performance
- **Update Handling**: Graceful updates without user disruption
- **Error Handling**: Robust offline and error states
- **Performance**: Optimize for mobile and slow connections

## Security Considerations

### HTTPS Requirement
- **Mandatory**: PWA features require HTTPS in production
- **Development**: Localhost allowed for testing
- **Certificate**: Valid SSL certificate required

### Content Security Policy
- **CSP Headers**: Configured for PWA compatibility
- **WebSocket Support**: Anchor Link WebSocket connections allowed
- **Font Loading**: Google Fonts integration supported

### Data Privacy
- **Local Storage**: Sensitive data encrypted
- **Cache Management**: Automatic cache cleanup
- **Session Handling**: Secure session management

## Future Enhancements

### Planned Features
- **Advanced Notifications**: Transaction-specific notifications
- **Background Processing**: Vote synchronization in background
- **Enhanced Offline**: More functionality without network
- **Performance Monitoring**: PWA performance analytics

### Integration Opportunities
- **Wallet Integration**: Enhanced wallet connectivity
- **Blockchain Sync**: Real-time blockchain data sync
- **User Preferences**: Personalized PWA experience
- **Analytics**: Usage tracking and optimization

This PWA implementation provides a robust foundation for delivering a native app-like experience while maintaining the flexibility and accessibility of web technologies.
