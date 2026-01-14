module.exports = {
    theme: {
        extend: {
            colors: {
                nature: {
                    50: '#f7f7f5', // Sand / Worn Paper
                    100: '#efefe9',
                    200: '#e0e0d6',
                    300: '#c8c8bb',
                    400: '#a8a898',
                    500: '#888876', // Stone
                    600: '#6d6d5d',
                    700: '#58584b',
                    800: '#4a4a3f',
                    900: '#3e3e35', // Deep Loam
                    950: '#23231d',
                },
                harvest: {
                    green: '#2d4a22', // Kale
                    gold: '#d4af37', // Wheat
                    red: '#782b2b', // Beetroot
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', 'serif'], // Hero typography
                sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'], // Body text
            },
            backgroundImage: {
                'hero-rustic': "url('/assets/images/hero_rustic.png')",
                'auth-farm': "url('/assets/images/auth_farm.png')",
            },
            animation: {
                'fade-in': 'fadeIn 1s ease-out forwards',
                'slide-up': 'slideUp 0.8s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        }
    }
}
