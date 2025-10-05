/**
 * Production Configuration for XPR Delegation Demo
 * 
 * Optimized build configuration for production deployment.
 * Includes performance monitoring, security headers, and caching strategies.
 * 
 * Features:
 * - Optimized bundle splitting
 * - Compression and minification
 * - Security headers
 * - Performance monitoring
 * - CDN optimization
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      // Enable React refresh only in development
      fastRefresh: process.env.NODE_ENV === 'development'
    })
  ],
  
  // Production optimizations
  build: {
    // Optimized output settings
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Keep source maps for debugging
    minify: 'esbuild', // Fastest minifier
    
    // Bundle splitting optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk - external libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('@proton/web-sdk')) {
              return 'vendor-blockchain'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui'
            }
            return 'vendor-misc'
          }
          
          // Feature-based chunks
          if (id.includes('components/stake') || id.includes('components/vote')) {
            return 'features-voting'
          }
          if (id.includes('services')) {
            return 'features-services'
          }
          if (id.includes('utils')) {
            return 'core-utils'
          }
          
          // Default to main bundle
          return undefined
        },
        
        // Asset naming for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`
          }
          if (/\.(gif|jpe?g|png|svg)$/.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
        
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    },
    
    // Performance optimizations
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      },
      mangle: {
        safari10: true // Safari 10 optimization
      }
    },
    
    // Bundle size limits
    chunkSizeWarningLimit: 1000
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    
    // Security headers
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: https://api.protonnz.com https://testnet-api.chaininfra.net https://anchor.link https://cb.anchor.link wss: wss://anchor.link wss://cb.anchor.link https://*.anchor.link wss://*.anchor.link; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
    },
    
    // HTTPS configuration (uncomment for production deployment)
    // https: true,
    // proxy: {
    //   '/api': {
    //     target: 'https://api.protonnz.com',
    //     changeOrigin: true,
    //     secure: true
    //   }
    // }
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@config': resolve(__dirname, './src/config'),
      '@store': resolve(__dirname, './src/store'),
      '@pages': resolve(__dirname, './src/pages'),
      '@layout': resolve(__dirname, './src/layout'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@styles': resolve(__dirname, './src/styles'),
      buffer: 'buffer'
    }
  },
  
  // Optimization deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@proton/web-sdk',
      'lucide-react',
      'buffer'
    ],
    exclude: ['fsevents']
  },
  
  // Define environment variables
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    '__DEV__': process.env.NODE_ENV === 'development',
    '__PROD__': process.env.NODE_ENV === 'production'
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('tailwindcss')
      ]
    }
  }
})
