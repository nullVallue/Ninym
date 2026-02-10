"use client"

import { useEffect, useState } from "react";
import { SunMoon } from "./animate-ui/icons/sun-moon";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";


export default function Navbar() {

    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentTheme, setCurrentTheme] = useState("");
    const { theme, setTheme } = useTheme();


    const onMouseLeaveNavbar = () => {
        setShowThemeMenu(false);
    }

    const handleSetTheme = (themename: string) => {
        setTheme(themename);
        setCurrentTheme(themename);
    }


    type ThemeMenuItemProps = {
        children?: React.ReactNode
        themename: string
    }

    const ThemeMenuItem : React.FC<ThemeMenuItemProps> = ({ children, themename}) => {

        return(


            <div
                onClick={() => {handleSetTheme(themename)}}
                className="
                    py-3
                    px-5
                    my-2
                    cursor-pointer

                    group/thememenu

                    transition-all
                    duration-300
                    ease-in-out

                    relative
                "
            >

                <div>

                    {
                        children
                    }

                </div>

                {
                    (themename == currentTheme) && (
                        <>



                            <div
                                className="
                                    absolute
                                    bg-dark
                                    h-full
                                    w-full
                                    left-0
                                    top-0

                                    opacity-0
                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:translate-y-0.5
                                    group-hover/thememenu:translate-x-1.5

                                    -z-20

                                    transition-all
                                    duration-200
                                    ease-in-out
                                "
                            />

                            <div
                                className="
                                    absolute
                                    bg-accent-primary
                                    h-full
                                    w-full
                                    left-0
                                    top-0

                                    opacity-0
                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:-translate-y-0.5
                                    group-hover/thememenu:translate-x-0.5

                                    -z-20

                                    transition-all
                                    duration-150
                                    ease-in-out
                                "
                            />



                            <div 
                                className="
                                    absolute
                                    bg-secondary
                                    h-full
                                    w-full
                                    left-0
                                    top-0
                                    -z-20

                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:translate-y-1
                                    group-hover/thememenu:-translate-x-0.5

                                    transition-all
                                    duration-200
                                    ease-in-out
                                "
                            />


                        </>
                    )

                }


                {
                    (themename != currentTheme) && (


                        <>

                            <div
                                className="
                                    absolute
                                    bg-dark
                                    h-full
                                    w-full
                                    left-0
                                    top-0

                                    opacity-0
                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:translate-y-0.5
                                    group-hover/thememenu:translate-x-1.5

                                    -z-20

                                    transition-all
                                    duration-200
                                    ease-in-out
                                "
                            />

                            <div
                                className="
                                    absolute
                                    bg-accent-primary
                                    h-full
                                    w-full
                                    left-0
                                    top-0

                                    opacity-0
                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:-translate-y-0.5
                                    group-hover/thememenu:translate-x-0.5

                                    -z-20

                                    transition-all
                                    duration-150
                                    ease-in-out
                                "
                            />


                            <div
                                className="
                                    absolute
                                    bg-secondary
                                    h-full
                                    w-full
                                    left-0
                                    top-0

                                    opacity-0
                                    group-hover/thememenu:opacity-100
                                    group-hover/thememenu:translate-y-1
                                    group-hover/thememenu:-translate-x-0.5

                                    -z-20

                                    transition-all
                                    duration-200
                                    ease-in-out
                                "
                            />

                        </>

                    )
                }

            </div>


        );




    }


    useEffect(() => {
        setMounted(true)
        setCurrentTheme(theme??"");
    }, []);

    if(!mounted) return null;


    return(
        <>

            <div
                className="
                    fixed
                    h-screen
                    w-[30px]
                    z-40
                    group/navbar
                "
                onMouseLeave={onMouseLeaveNavbar}
            >

                <nav
                    className="
                        fixed
                        h-screen
                        w-[70px]
                        bg-secondary
                        z-50
                        flex
                        flex-col
                        justify-between
                        items-center
                        py-5


                        -translate-x-full
                        group-hover/navbar:translate-x-0

                        transition-all
                        ease-in-out
                        duration-300
                    "
                >

                    <div>

                    </div>

                    
                    {/* section to change themes */}
                    <div
                        className="relative"
                    >
                        <AnimatePresence>
                        {
                            showThemeMenu && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: "80%",
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: "100%",
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: "80%",
                                    }}

                                    onMouseLeave={() => {
                                        setShowThemeMenu(false);
                                    }}

                                    className="
                                        absolute
                                        overflow-hidden
                                        bottom-full
                                        left-full
                                        bg-primary
                                        p-4
                                    "
                                >


                                    <ThemeMenuItem themename="retro">
                                        {
                                            (currentTheme != "retro") && (
                                                <>

                                                    <span
                                                        className="
                                                            text-dark
                                                            group-hover/thememenu:text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Retro
                                                    </span>

                                                </>
                                            )
                                        }


                                        {
                                            (currentTheme == "retro") && (
                                                <>
                                                    <span
                                                        className="
                                                            text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Retro
                                                    </span>
                                                </>
                                            )

                                        }
                                    </ThemeMenuItem> 



                                    <ThemeMenuItem themename="neonnight">
                                        {
                                            (currentTheme != "neonnight") && (
                                                <>

                                                    <span
                                                        className="
                                                            text-dark
                                                            group-hover/thememenu:text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Neon-Night
                                                    </span>

                                                </>
                                            )
                                        }


                                        {
                                            (currentTheme == "neonnight") && (
                                                <>
                                                    <span
                                                        className="
                                                            text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Neon-Night
                                                    </span>
                                                </>
                                            )

                                        }
                                    </ThemeMenuItem> 


                                    <ThemeMenuItem themename="spiderman">
                                        {
                                            (currentTheme != "spiderman") && (
                                                <>

                                                    <span
                                                        className="
                                                            text-dark
                                                            group-hover/thememenu:text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Spider-Man
                                                    </span>

                                                </>
                                            )
                                        }


                                        {
                                            (currentTheme == "spiderman") && (
                                                <>
                                                    <span
                                                        className="
                                                            text-light
                                                            text-nowrap
                                                        "
                                                    >
                                                        Spider-Man
                                                    </span>
                                                </>
                                            )

                                        }
                                    </ThemeMenuItem> 



                                </motion.div>
                            )

                        }
                        </AnimatePresence>

                        <SunMoon 
                            animateOnHover
                            onMouseEnter={() => {setShowThemeMenu(true)}}
                            className="
                                cursor-pointer
                                text-light
                            "
                        />

                    </div>

                </nav>

            </div>

        </>
    );



}