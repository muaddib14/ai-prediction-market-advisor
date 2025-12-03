/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1440px',
			},
		},
		extend: {
			colors: {
				// Background surfaces
				'bg-base': '#000000',
				'bg-primary': '#0a0a0a',
				'bg-elevated': '#141414',
				'bg-hover': '#1e1e1e',
				'bg-tooltip': '#282828',
				
				// Text colors
				'text-primary': '#e4e4e7',
				'text-secondary': '#a1a1aa',
				'text-tertiary': '#71717a',
				
				// Accent colors (Aqua)
				accent: {
					DEFAULT: '#00f0d2',
					primary: '#00f0d2',
					hover: '#00e5cc',
					muted: '#00c4b0',
					glow: 'rgba(0, 240, 210, 0.5)',
					subtle: 'rgba(0, 240, 210, 0.1)',
				},
				
				// Semantic colors
				success: {
					DEFAULT: '#22c55e',
					muted: '#16a34a',
				},
				error: {
					DEFAULT: '#ef4444',
					muted: '#dc2626',
				},
				warning: {
					DEFAULT: '#f59e0b',
				},
				info: {
					DEFAULT: '#3b82f6',
				},
				
				// Borders
				'border-subtle': 'rgba(255, 255, 255, 0.08)',
				'border-default': 'rgba(255, 255, 255, 0.12)',
				'border-strong': 'rgba(255, 255, 255, 0.2)',
				'border-accent': 'rgba(0, 240, 210, 0.3)',
				
				// Legacy support
				border: 'rgba(255, 255, 255, 0.12)',
				input: '#1e1e1e',
				ring: '#00f0d2',
				background: '#0a0a0a',
				foreground: '#e4e4e7',
				primary: {
					DEFAULT: '#00f0d2',
					foreground: '#000000',
				},
				secondary: {
					DEFAULT: '#141414',
					foreground: '#e4e4e7',
				},
				destructive: {
					DEFAULT: '#ef4444',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: '#1e1e1e',
					foreground: '#a1a1aa',
				},
				popover: {
					DEFAULT: '#141414',
					foreground: '#e4e4e7',
				},
				card: {
					DEFAULT: '#141414',
					foreground: '#e4e4e7',
				},
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
			},
			fontSize: {
				'hero': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
				'h1': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
				'h2': ['28px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
				'h3': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
				'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
				'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
				'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
				'sm': ['14px', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],
				'xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
			},
			spacing: {
				'1': '4px',
				'2': '8px',
				'3': '12px',
				'4': '16px',
				'5': '24px',
				'6': '32px',
				'8': '48px',
				'10': '64px',
				'12': '96px',
			},
			borderRadius: {
				'sm': '4px',
				'md': '8px',
				'lg': '12px',
				'xl': '16px',
				'full': '9999px',
			},
			boxShadow: {
				'glow-sm': '0 0 8px rgba(0, 240, 210, 0.3)',
				'glow': '0 0 16px rgba(0, 240, 210, 0.4), 0 0 32px rgba(0, 240, 210, 0.2)',
				'glow-lg': '0 0 24px rgba(0, 240, 210, 0.5), 0 0 48px rgba(0, 240, 210, 0.3)',
				'card': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.5)',
				'modal': '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.7)',
			},
			transitionDuration: {
				'fast': '150ms',
				'normal': '250ms',
				'slow': '400ms',
				'pulse': '2000ms',
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 8px rgba(0, 240, 210, 0.3)' },
					'50%': { boxShadow: '0 0 16px rgba(0, 240, 210, 0.6)' },
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'slide-in': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' },
				},
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
			},
			animation: {
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.2s ease-out',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
