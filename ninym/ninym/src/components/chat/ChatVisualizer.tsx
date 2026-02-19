"use client"

import { useEffect, useRef, useState } from "react";

type VisualizerMode = 'loading' | 'playing' | 'idle';

interface ChatVisualizerProps {
    mode: VisualizerMode;
    audioData?: Uint8Array;
    className?: string;
    lineColor?: string;
}

type LookDirection = 'center' | 'left' | 'right' | 'up-left' | 'up-right' | 'up';

const LOOK_OFFSETS: Record<LookDirection, number> = {
    'center': 0,
    'left': -3,
    'right': 3,
    'up-left': -2,
    'up-right': 2,
    'up': 0,
};

const LOOK_DIRECTIONS: LookDirection[] = ['center', 'left', 'right', 'up-left', 'up-right', 'up'];

const EYE_WIDTH = 6;
const EYE_HEIGHT = 7;
const BLINK_ROW = 3;

export default function ChatVisualizer({ mode, audioData, className = "", lineColor = "text-primary" }: ChatVisualizerProps) {
    const [phase, setPhase] = useState(0);
    const [lookOffset, setLookOffset] = useState(0);
    const [lookYOffset, setLookYOffset] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);
    const animationFrameRef = useRef<number>();
    const nextLookTimeRef = useRef<number>(0);
    const nextBlinkTimeRef = useRef<number>(0);

    useEffect(() => {
        if (mode === 'loading') {
            const animate = () => {
                setPhase((prev) => prev + 0.15);
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
        }
    }, [mode]);

    useEffect(() => {
        if (mode !== 'idle') {
            setLookOffset(0);
            setLookYOffset(0);
            setIsBlinking(false);
            return;
        }

        const updateIdleAnimation = () => {
            const now = Date.now();

            if (now >= nextLookTimeRef.current) {
                const direction = LOOK_DIRECTIONS[Math.floor(Math.random() * LOOK_DIRECTIONS.length)];
                setLookOffset(LOOK_OFFSETS[direction]);
                setLookYOffset(direction.includes('up') ? 1 : 0);
                nextLookTimeRef.current = now + 2000 + Math.random() * 2000;
            }

            if (now >= nextBlinkTimeRef.current) {
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
    const ROWS = 10;
    const COLS = 48;

    const generateAscii = () => {
        let grid = "";

        const leftEyeX = 13 + lookOffset;
        const rightEyeX = 29 + lookOffset;
        const eyeY = 2 + lookYOffset;

        for (let r = 0; r < ROWS; r++) {
            let rowText = "";
            for (let c = 0; c < COLS; c++) {
                let char = " ";

                if (mode === 'loading') {
                    const wave = Math.sin(c * 0.08 + phase) * 0.5 + 0.5;
                    const bounce = Math.sin(c * 0.05 + phase * 2) * 0.3;
                    const normalized = Math.max(0, Math.min(1, wave + bounce));
                    const rowThreshold = r / ROWS;
                    if (normalized > rowThreshold) {
                        const index = Math.floor(normalized * (ramp.length - 1));
                        char = ramp[index];
                    }
                } else if (mode === 'playing' && audioData) {
                    const data = Array.from(audioData.slice(0, audioData.length / 2));
                    const step = data.length / COLS;
                    
                    const start = Math.floor(c * step);
                    const end = Math.floor(start + step);
                    const avg = data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start || 1);
                    const normalized = Math.min(avg / 255, 1);
                    const rowThreshold = r / ROWS;
                    if (normalized > rowThreshold) {
                        const index = Math.floor(normalized * (ramp.length - 1));
                        char = ramp[index];
                    }
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
