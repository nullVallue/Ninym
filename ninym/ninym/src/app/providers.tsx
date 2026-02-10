"use client"

import { ThemeProvider } from "next-themes";


export function Providers({ children } : {children: React.ReactNode}){

    return (
        <>
            <ThemeProvider
                attribute="class"
                defaultTheme="retro"
                enableSystem={false}
                themes={["retro", "neonnight", "spiderman"]}
            >
                {children}
            </ThemeProvider>
        </>
    );

}