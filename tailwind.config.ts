import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        serif: ["Georgia", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideIn: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 3s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 0.3s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
      spacing: {
        "18": "4.5rem",
        "72": "18rem",
        "84": "21rem",
        "96": "24rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      boxShadow: {
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "outline-primary": "0 0 0 2px hsl(var(--primary))",
        "outline-destructive": "0 0 0 2px hsl(var(--destructive))",
      },
      backdropBlur: {
        xs: "2px",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "hsl(var(--foreground))",
            '[class~="lead"]': {
              color: "hsl(var(--muted-foreground))",
            },
            a: {
              color: "hsl(var(--primary))",
              textDecoration: "underline",
              "&:hover": {
                color: "hsl(var(--primary))",
              },
            },
            strong: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            "ol[type='A']": {
              "--list-counter-style": "upper-alpha",
            },
            "ol[type='a']": {
              "--list-counter-style": "lower-alpha",
            },
            "ol[type='A' s]": {
              "--list-counter-style": "upper-alpha",
            },
            "ol[type='a' s]": {
              "--list-counter-style": "lower-alpha",
            },
            "ol[type='I']": {
              "--list-counter-style": "upper-roman",
            },
            "ol[type='i']": {
              "--list-counter-style": "lower-roman",
            },
            "ol[type='I' s]": {
              "--list-counter-style": "upper-roman",
            },
            "ol[type='i' s]": {
              "--list-counter-style": "lower-roman",
            },
            "ol[type='1']": {
              "--list-counter-style": "decimal",
            },
            h1: {
              color: "hsl(var(--foreground))",
              fontWeight: "800",
            },
            h2: {
              color: "hsl(var(--foreground))",
              fontWeight: "700",
            },
            h3: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            h4: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            blockquote: {
              color: "hsl(var(--foreground))",
              borderLeftColor: "hsl(var(--border))",
            },
            hr: {
              borderColor: "hsl(var(--border))",
            },
            thead: {
              color: "hsl(var(--foreground))",
              borderBottomColor: "hsl(var(--border))",
            },
            "tbody tr": {
              borderBottomColor: "hsl(var(--border))",
            },
            pre: {
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--muted))",
            },
            code: {
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--muted))",
              fontWeight: "400",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: 'class',
    }),
  ],
} satisfies Config;
