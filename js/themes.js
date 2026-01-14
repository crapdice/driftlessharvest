export const THEMES = {
    legacy: {
        fontFamily: {
            serif: ['"Crimson Pro"', 'serif'],
            sans: ['"Work Sans"', 'sans-serif'],
        },
        colors: {
            nature: {
                // Mapping "Paper" palette to new "Nature" structure key for compatibility
                50: '#F7F5F0', 900: '#2C2825',
            },
            harvest: {
                green: '#4A6C47', gold: '#B85C38', red: '#D6D2C4',
            }
        },
        backgroundImage: {
            'hero-rustic': "none",
            'auth-farm': "none"
        }
    },
    nature: {
        fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
            nature: {
                50: '#f7f7f5', 100: '#efefe9', 200: '#e0e0d6', 300: '#c8c8bb',
                400: '#a8a898', 500: '#888876', 600: '#6d6d5d', 700: '#58584b',
                800: '#4a4a3f', 900: '#3e3e35', 950: '#23231d',
            },
            harvest: {
                green: '#2d4a22', gold: '#d4af37', red: '#782b2b',
            }
        },
        backgroundImage: {
            'hero-rustic': "url('/assets/images/hero_rustic.png')",
            'auth-farm': "url('/assets/images/auth_farm.png')",
        },
        animation: {
            'fade-in': 'fadeIn 1.2s ease-out forwards',
            'slide-up': 'slideUp 1s ease-out forwards',
        },
        keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }
        }
    },
    journal: {
        layout: 'editorial', // Signal to views to change layout
        fontFamily: {
            serif: ['"Libre Baskerville"', 'serif'],
            sans: ['"Source Sans 3"', 'sans-serif'],
        },
        colors: {
            nature: {
                // Aged Paper Palette
                50: '#F9F7F1', // Ivory / Old Paper
                100: '#F0EFE9',
                200: '#E6E4dc',
                300: '#D4D1C5',
                400: '#B8B4A6',
                500: '#9C988B',
                600: '#6E6B61',
                700: '#524F48',
                800: '#3D3B36', // Charcoal
                900: '#2C2B27', // Deep Ink
                950: '#1A1917',
            },
            harvest: {
                green: '#4D5E53', // Oxide Green
                gold: '#C2A878', // Antique Gold
                red: '#9A5B5B', // Faded Red
            }
        },
        backgroundImage: {
            'hero-rustic': "none",
            'auth-farm': "none",
        },
        boxShadow: {
            'sm': 'none',
            'md': 'none',
            'lg': 'none', // Flat look for print aesthetic
        },
        borderRadius: {
            'sm': '2px', // Very slight corner rounding
            'md': '2px',
            'lg': '2px',
            'xl': '2px',
            '2xl': '2px',
        }
    },
    heritage: {
        layout: 'heritage', // New layout mode for Staggered Grid
        fontFamily: {
            serif: ['"Cormorant Garamond"', 'serif'],
            sans: ['"Work Sans"', 'sans-serif'],
        },
        colors: {
            nature: {
                50: '#F5F2EB', // Linen
                100: '#EBE7DD',
                200: '#DBD5C5',
                300: '#C2BCAB',
                400: '#A39D8D',
                500: '#858071',
                600: '#635F53',
                700: '#4A473E', // Walnut
                800: '#33312B',
                900: '#1F1E1A',
                950: '#12110F',
            },
            harvest: {
                green: '#556B2F', // Olive
                gold: '#D4AF37', // Metallic Gold
                red: '#800020', // Burgundy
            }
        },
        backgroundImage: {
            // Enhanced noise with blend mode simulation via multiple backgrounds
            'hero-rustic': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.08\"/%3E%3C/svg%3E'), radial-gradient(circle at 50% 50%, #F5F2EB 0%, #D4CUA5 100%)",
            'auth-farm': "none",
        },
        borderRadius: {
            'sm': '255px 15px 225px 15px/15px 225px 15px 255px', // More erratic
            'md': '255px 15px 225px 15px/15px 225px 15px 255px',
            'lg': '255px 15px 225px 15px/15px 225px 15px 255px',
            'xl': '255px 15px 225px 15px/15px 225px 15px 255px',
            '2xl': '255px 15px 225px 15px/15px 225px 15px 255px',
        },
        boxShadow: {
            'sm': '1px 1px 2px rgba(44, 43, 39, 0.1)',
            'md': '3px 3px 0px rgba(44, 43, 39, 0.08)', // Soft offset
            'lg': '5px 5px 0px rgba(44, 43, 39, 0.08)',
            'xl': '8px 8px 0px rgba(44, 43, 39, 0.08)',
        }
    },
    sketch: {
        fontFamily: {
            serif: ['"Permanent Marker"', 'cursive'],
            sans: ['"Patrick Hand"', 'cursive'],
        },
        colors: {
            nature: {
                // Paper / Monochrome Palette
                50: '#fdfbf7', // Clean Paper
                100: '#f7f5f0',
                200: '#efefe9',
                300: '#dcdcd5', // Eraser marks
                400: '#d6d6d6',
                500: '#a3a3a3', // Pencil lead
                600: '#737373',
                700: '#525252',
                800: '#373737', // Graphite
                900: '#1a1a1a', // Sharpie
                950: '#000000',
            },
            harvest: {
                green: '#4a6c47', // Rough Pencil Green
                gold: '#e6c229', // Highlighter
                red: '#d14949', // Grading Pen
            }
        },
        borderRadius: {
            // Hand-drawn "wobbly" shapes
            'sm': '255px 15px 225px 15px/15px 225px 15px 255px',
            'md': '255px 15px 225px 15px/15px 225px 15px 255px',
            'lg': '255px 15px 225px 15px/15px 225px 15px 255px',
            'xl': '255px 15px 225px 15px/15px 225px 15px 255px',
            '2xl': '255px 15px 225px 15px/15px 225px 15px 255px',
            'full': '50%', // Keep circles circular logic or maybe 95%?
        },
        boxShadow: {
            // Rough shadow
            'sm': '2px 2px 0px 0px rgba(0,0,0,0.1)',
            'md': '3px 3px 0px 0px rgba(0,0,0,0.15)',
            'lg': '5px 5px 0px 0px rgba(0,0,0,0.15)',
        },
        backgroundImage: {
            'hero-rustic': "radial-gradient(circle, #fdfbf7 0%, #f7f5f0 100%)", // Paper vignette
            'auth-farm': "none",
        },
        animation: {
            'shake': 'shake 0.2s ease-in-out',
        },
        keyframes: {
            shake: {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-4px)' },
                '75%': { transform: 'translateX(4px)' }
            }
        }
    }
};
