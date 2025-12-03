import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve buffer imports to the buffer package in node_modules
      "buffer": path.resolve(__dirname, "node_modules/buffer/index.js"),
      "buffer/": path.resolve(__dirname, "node_modules/buffer/"),
    },
  },
  define: {
    // Define globals for browser environment
    'process.env': {},
    'global': 'globalThis',
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about unresolved imports from wallet adapters
        if (warning.code === 'UNRESOLVED_IMPORT') {
          return;
        }
        // Suppress circular dependency warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        // Suppress eval warnings
        if (warning.code === 'EVAL') {
          return;
        }
        warn(warning);
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    target: 'esnext',
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      'buffer',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-phantom',
      '@solana/web3.js',
    ],
    exclude: [
      '@solana/wallet-adapter-wallets',
    ],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
  },
})
