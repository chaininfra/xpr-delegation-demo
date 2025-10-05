# Production Deployment Guide

Comprehensive guide for deploying the XPR Delegation Demo to production environments with enterprise-grade security, performance, and reliability standards.

## Pre-Deployment Assessment

### Environment Preparation

#### System Requirements
- **Node.js**: Version 18.x or higher
- **Memory**: Minimum 512MB RAM for application server
- **Storage**: Minimum 1GB for application deployment
- **Network**: Stable internet connection with DNS resolution
- **SSL/TLS**: Valid SSL certificates for HTTPS communication

#### Infrastructure Checklist
- [ ] Node.js 18+ runtime environment installed
- [ ] SSL certificates provisioned and configured
- [ ] Environment variables configured for production
- [ ] Reverse proxy or load balancer configured (Nginx/HAProxy)
- [ ] Monitoring and logging infrastructure deployed
- [ ] Backup and disaster recovery procedures established

#### Security Validation
- [ ] Security audit completed using `npm run security:audit`
- [ ] Zero known vulnerabilities in dependencies
- [ ] Content Security Policy headers configured
- [ ] Console logs removed from production build configuration
- [ ] Sensitive data encryption implemented
- [ ] Production secrets not hardcoded in source

### Build Configuration

#### Production Build Process
```bash
# Install dependencies
npm ci --only=production

# Run quality checks
npm run quality

# Security audit
npm run security:audit

# TypeScript compilation check
npm run type-check

# Production build with optimizations
npm run build:prod
```

#### Build Optimization Parameters
```javascript
// production.config.js optimization settings
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          blockchain: ['@proton/web-sdk'],
          ui: ['lucide-react', 'tailwindcss']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
};
```

## Deployment Environments

### Static Site Deployment

#### Vercel Deployment

**Prerequisites:**
- Vercel account (free tier available)
- GitHub repository connected to Vercel
- Domain name (optional, Vercel provides free subdomain)

**Configuration:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/logo/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.js)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.css)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Deployment Steps:**
1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project directory
   vercel
   ```

2. **Environment Variables:**
   ```bash
   # Set production environment
   vercel env add NODE_ENV production
   
   # Optional: Add custom domain
   vercel domains add your-domain.com
   ```

3. **Build Configuration:**
   ```json
   // package.json
   {
     "scripts": {
       "vercel-build": "npm run build:prod"
     }
   }
   ```

**Features:**
- **Automatic HTTPS**: SSL certificates provided automatically
- **Global CDN**: Fast loading worldwide
- **PWA Support**: Service Worker and manifest properly served
- **Security Headers**: Comprehensive security configuration
- **Caching Strategy**: Optimized caching for static assets
- **Custom Domain**: Easy custom domain setup
- **Preview Deployments**: Automatic previews for pull requests

#### Netlify Deployment
```toml
# netlify.toml configuration
[build]
  publish = "dist"
  command = "npm run build:prod"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: https://api.protonnz.com https://testnet-api.chaininfra.net;"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Server Deployment

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/xpr-delegation-demo
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # CSP Header
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: https://api.protonnz.com https://testnet-api.chaininfra.net;" always;

    # Application Root
    root /var/www/xpr-delegation-demo/dist;
    index index.html index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri $uri/ =404;
    }

    # Application Routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers for all routes
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Error Pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /var/www/xpr-delegation-demo/dist;
    }
    
    location = /50x.html {
        root /var/www/xpr-delegation-demo/dist;
    }
}
```

#### Docker Deployment
```dockerfile
# Dockerfile for production deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build:prod

# Production stage
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nextjs && adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set permissions
RUN chown -R nextjs:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Kubernetes Deployment

#### Deployment Manifest
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xpr-delegation-demo
  labels:
    app: xpr-delegation-demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: xpr-delegation-demo
  template:
    metadata:
      labels:
        app: xpr-delegation-demo
    spec:
      containers:
      - name: xpr-delegation-demo
        image: your-registry/xpr-delegation-demo:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: xpr-delegation-demo-service
spec:
  selector:
    app: xpr-delegation-demo
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: xpr-delegation-demo-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: ssl-secret
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: xpr-delegation-demo-service
            port:
              number: 80
```

## Environment Configuration

### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
VITE_NETWORK_TYPE=mainnet
VITE_APP_NAME=XPR Delegation Demo
VITE_MAINNET_ENDPOINTS=https://api.protonnz.com
VITE_TESTNET_ENDPOINTS=https://testnet-api.chaininfra.net
VITE_MAINNET_CHAIN_ID=384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0
VITE_TESTNET_CHAIN_ID=71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2ceaf3f3d64
```

### Security Configuration
```javascript
// security.config.js for production
export default {
  cors: {
    origin: ['https://your-domain.com'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:", "https://api.protonnz.com", "https://testnet-api.chaininfra.net"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
```

## Monitoring and Observability

### Application Monitoring Setup
```javascript
// monitoring.js production configuration
import { createClient } from '@vercel/postgres';

const client = createClient({
  connectionString: process.env.DATABASE_URL,
});

export const logError = async (error: Error, context: any) => {
  try {
    await client.sql`
      INSERT INTO error_logs (error_message, stack_trace, context, timestamp)
      VALUES (${error.message}, ${error.stack}, ${JSON.stringify(context)}, NOW())
    `;
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

export const logTransaction = async (transactionId: string, type: string, userId: string) => {
  try {
    await client.sql`
      INSERT INTO transaction_logs (transaction_id, type, user_id, timestamp)
      VALUES (/|{transactionId}, ${type}, ${userId}, NOW())
    `;
  } catch (logError) {
    console.error('Failed to log transaction:', logError);
  }
};
```

### Performance Monitoring
```javascript
// performance-monitoring.js
export class PerformanceMonitor {
  static trackPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_load_time', {
            value: Math.round(loadTime),
            custom_map_dimension1: window.location.pathname
          });
        }
      });
    }
  }

  static trackTransactionDuration(startTime: number, transactionType: string) {
    const duration = performance.now() - startTime;
    
    // Log slow transactions
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow transaction detected: ${transactionType} took ${duration}ms`);
    }
    
    return duration;
  }
}
```

## Deployment Validation

### Post-Deployment Checklist
- [ ] Application accessible via HTTPS
- [ ] All static assets loading correctly
- [ ] Health check endpoint responding
- [ ] Blockchain RPC connections functional
- [ ] Security headers present in HTTP responses
- [ ] Performance metrics within acceptable ranges
- [ ] Error logging functional
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested

### Automated Deploy Script
```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

echo "Starting deployment process..."

# Pre-deployment checks
echo "Running pre-deployment checks..."
npm run quality
npm run security:audit

# Build application
echo "Building application..."
npm ci --only=production
npm run build:prod

# Validate build
echo "Validating build..."
if [ ! -d "dist" ]; then
  echo "Build failed: dist directory not found"
  exit 1
fi

# Deploy to server
echo "Deploying to server..."
rsync -av --delete dist/ user@server:/var/www/xpr-delegation-demo/
ssh user@server "sudo systemctl reload nginx"

# Post-deployment validation
echo "Running post-deployment validation..."
curl -f https://your-domain.com/health || {
  echo "Health check failed"
  exit 1
}

echo "Deployment completed successfully!"
```

## Maintenance and Updates

### Update Procedures
1. **Testing**: Test updates in staging environment
2. **Backup**: Create backup of current deployment
3. **Deployment**: Deploy updates during maintenance window
4. **Validation**: Verify functionality and performance
5. **Rollback Plan**: Prepare rollback procedure if needed

### Monitoring Metrics
- **Availability**: Target 99.9% uptime
- **Response Time**: Average response time < 2 seconds
- **Error Rate**: Error rate < 0.1%
- **Security**: Zero security incidents
- **Performance**: Core Web Vitals scores in good range

This deployment guide provides comprehensive procedures for deploying the XPR Delegation Demo to production environments with enterprise-grade reliability and security standards.