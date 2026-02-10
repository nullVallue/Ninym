import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {

		      // // Primary Spiderman Colours
      // colors: {
      //   primary: "#E10600",
      //   secondary: "#00A8FF",
      //   background: "#0B1026",
      //   accent: {
      //     secondary: "#FFD400",
      //     primary: "#FF2DAF",
      //   },
      // }

      
      // // Neon Night Set Colours
      // colors: {
      //   primary: "#6C2BD9",
      //   secondary: "#FF3CAC",
      //   background: "#1A1F3C",
      //   accent: {
      //     secondary: "#00F5D4",
      //     primary: "#B8B8FF",
      //   },
      // }


      // // Print / Halftone Set (Retro Comic Feel) 
      // colors: {
      //   primary: "#FFE600",
      //   secondary: "#FF0090",
      //   background: "#111111",
      //   light: "#F4F1E8",
      //   accent: "#00B7EB",
      // }



  		colors: {
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        dark: "rgb(var(--dark) / <alpha-value>)",
        light: "rgb(var(--light) / <alpha-value>)",
        accent: {
          primary: "rgb(var(--accent-primary) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
        },



  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		// borderRadius: {
  		// 	lg: 'var(--radius)',
  		// 	md: 'calc(var(--radius) - 2px)',
  		// 	sm: 'calc(var(--radius) - 4px)'
  		// }
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
