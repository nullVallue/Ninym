"use client"

import { useEffect, useRef, useState } from "react";

type VisualizerMode = 'loading' | 'playing' | 'idle';

interface ChatVisualizerProps {
    mode: VisualizerMode;
    audioData?: Uint8Array;
    className?: string;
    lineColor?: string;
}

type LookDirection = 'center' | 'left' | 'right' | 'up-left' | 'up-right' | 'up' | 'far-up-left' | 'far-up-right' | 'far-up';

const LOOK_OFFSETS: Record<LookDirection, number> = {
    'center': 0,
    'left': -3,
    'right': 3,
    'up-left': -2,
    'up-right': 2,
    'up': 0,
    'far-up-left': -2,
    'far-up-right': 2,
    'far-up': 0,
};

const LOOK_DIRECTIONS: LookDirection[] = ['center', 'left', 'right', 'up-left', 'up-right', 'up', 'far-up-left', 'far-up-right', 'far-up'];

const EYE_WIDTH = 6;
const EYE_HEIGHT = 7;
const BLINK_ROW = 3;

const EYE_WIDTH_LOADING = 9;
const EYE_HEIGHT_LOADING = 4;

export default function ChatVisualizer({ mode, audioData, className = "", lineColor = "text-primary" }: ChatVisualizerProps) {
    const [phase, setPhase] = useState(0);
    const [lookOffset, setLookOffset] = useState(0);
    const [lookYOffset, setLookYOffset] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);
    const [questionMarkPos, setQuestionMarkPos] = useState(0);
    const animationFrameRef = useRef<number>();
    const nextLookTimeRef = useRef<number>(0);
    const nextBlinkTimeRef = useRef<number>(0);
    const lastQuestionMarkMoveRef = useRef<number>(0);

    useEffect(() => {
        if (mode === 'loading') {
            const animate = () => {
                const now = Date.now();
                if (now - lastQuestionMarkMoveRef.current >= 500) {
                    setQuestionMarkPos((prev) => (prev + 1) % EYE_WIDTH_LOADING);
                    lastQuestionMarkMoveRef.current = now;
                }
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        } else {
            setPhase(0);
            setQuestionMarkPos(0);
        }
    }, [mode]);

    useEffect(() => {
        if (mode !== 'idle' && mode !== 'loading') {
            setLookOffset(0);
            setLookYOffset(0);
            setIsBlinking(false);
            return;
        }

        const updateIdleAnimation = () => {
            const now = Date.now();

            if (mode === 'idle' && now >= nextLookTimeRef.current) {
                const direction = LOOK_DIRECTIONS[Math.floor(Math.random() * LOOK_DIRECTIONS.length)];
                setLookOffset(LOOK_OFFSETS[direction]);
                if (direction.startsWith('far-up')) {
                    setLookYOffset(2);
                } else if (direction.includes('up')) {
                    setLookYOffset(1);
                } else {
                    setLookYOffset(0);
                }
                nextLookTimeRef.current = now + 2000 + Math.random() * 2000;
            }

            if (mode === 'idle' && now >= nextBlinkTimeRef.current) {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 150);
                nextBlinkTimeRef.current = now + 3000 + Math.random() * 2000;
            }

            animationFrameRef.current = requestAnimationFrame(updateIdleAnimation);
        };

        nextLookTimeRef.current = Date.now() + 1000;
        nextBlinkTimeRef.current = Date.now() + 2000;
        animationFrameRef.current = requestAnimationFrame(updateIdleAnimation);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [mode]);

    const ramp = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
    const ROWS = 11;
    const COLS = 48;

    const generateAscii = () => {
        let grid = "";

        const leftEyeX = 13 + lookOffset;
        const rightEyeX = 29 + lookOffset;
        const eyeY = 1 + lookYOffset;
        
        const playingLeftEyeX = 13;
        const playingRightEyeX = 29;

        for (let r = 0; r < ROWS; r++) {
            let rowText = "";
            for (let c = 0; c < COLS; c++) {
                let char = " ";

                if (mode === 'loading') {
                    const checkEye = (eyeX: number) => {
                        if (c >= eyeX && c < eyeX + EYE_WIDTH_LOADING) {
                            const localC = c - eyeX;
                            const localR = r - (eyeY + 3);

                            if (localR < 0 || localR >= EYE_HEIGHT_LOADING) {
                                return null;
                            }

                            const currentQuestionMarkPos = questionMarkPos;
                            
                            let eyeChars = "";
                            if (localR === 0 || localR === 1) {
                                if (localC === 0 || localC === 1 || localC === 7 || localC === 8) {
                                    eyeChars = "@@     @@";
                                } else {
                                    eyeChars = "         ";
                                }
                            } else if (localR === 2 || localR === 3) {
                                if (localC >= 1 && localC <= 7) {
                                    eyeChars = " @@@@@@@";
                                } else {
                                    eyeChars = "         ";
                                }
                            }

                            if (localC === currentQuestionMarkPos && eyeChars && eyeChars[localC] === '@') {
                                return "?";
                            }
                            
                            if (eyeChars && localC < eyeChars.length) {
                                return eyeChars[localC];
                            }
                        }
                        return null;
                    };

                    const leftChar = checkEye(leftEyeX);
                    const rightChar = checkEye(rightEyeX);
                    char = leftChar || rightChar || " ";
                } else if (mode === 'playing' && audioData) {
                    const data = Array.from(audioData.slice(0, audioData.length / 2));
                    const avg = data.reduce((a, b) => a + b, 0) / (data.length || 1);
                    const intensity = Math.min(avg / 128, 1);
                    const bounceOffset = Math.floor(intensity * 1.5);
                    const playingEyeY = 1 - bounceOffset;
                    
                    const checkEye = (eyeX: number) => {
                        if (c >= eyeX && c < eyeX + EYE_WIDTH) {
                            const localC = c - eyeX;
                            const localR = r - playingEyeY;
                            
                            if (localR < 0 || localR >= EYE_HEIGHT) {
                                return null;
                            }
                            
                            if (localR === 0 || localR === EYE_HEIGHT - 1) {
                                return " @@@@ "[localC] || null;
                            } else {
                                return "@@@@@@"[localC] || null;
                            }
                        }
                        return null;
                    };

                    const leftChar = checkEye(playingLeftEyeX);
                    const rightChar = checkEye(playingRightEyeX);
                    char = leftChar || rightChar || " ";
                } else if (mode === 'idle') {
                    const checkEye = (eyeX: number) => {
                        if (c >= eyeX && c < eyeX + EYE_WIDTH) {
                            const localC = c - eyeX;
                            const localR = r - eyeY;
                            
                            if (localR < 0 || localR >= EYE_HEIGHT) {
                                return null;
                            }
                            
                            let eyeChars = "";
                            if (isBlinking) {
                                if (localR === BLINK_ROW) {
                                    eyeChars = "@@@@@@";
                                } else {
                                    eyeChars = "";
                                }
                            } else {
                                if (localR === 0 || localR === EYE_HEIGHT - 1) {
                                    eyeChars = " @@@@ ";
                                } else {
                                    eyeChars = "@@@@@@";
                                }
                            }
                            
                            if (eyeChars && localC < eyeChars.length) {
                                return eyeChars[localC];
                            }
                        }
                        return null;
                    };

                    const leftChar = checkEye(leftEyeX);
                    const rightChar = checkEye(rightEyeX);
                    char = leftChar || rightChar || " ";
                }

                rowText += char;
            }
            grid += rowText + "\n";
        }

        return grid;
    };

    return (
        <div className={`w-full flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm border border-white/5 ${className}`}>
            <pre className={`font-mono text-[6px] leading-[6px] md:text-[8px] md:leading-[8px] font-bold ${lineColor} whitespace-pre transition-all duration-100`}>
                {generateAscii()}
            </pre>
        </div>
    );
}
