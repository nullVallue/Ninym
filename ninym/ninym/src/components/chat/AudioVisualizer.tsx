"use client"

interface AudioVisualizerProps {
    audioData: Uint8Array;
    className?: string;
    lineColor?: string;
}

export default function AudioVisualizer({ audioData, className = "", lineColor = "text-primary" }: AudioVisualizerProps) {
    
    // ASCII character ramp from low density to high density
    const ramp = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"];
    
    const ROWS = 8;
    const COLS = 48; // Increased columns for detail

    // Process audio data into a grid of ASCII characters
    const generateAscii = () => {
        // Use a subset of the frequency data (first half as voice is low/mid heavy)
        const data = Array.from(audioData.slice(0, audioData.length / 2));
        const step = data.length / COLS;
        
        let grid = "";
        
        for (let r = ROWS - 1; r >= 0; r--) {
            let rowText = "";
            for (let c = 0; c < COLS; c++) {
                // Average data in the step range
                const start = Math.floor(c * step);
                const end = Math.floor(start + step);
                const avg = data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start || 1);
                
                // Normalized value (0 to 1)
                const normalized = Math.min(avg / 255, 1);
                
                // Determine if this "pixel" should be lit
                const rowThreshold = r / ROWS;
                
                if (normalized > rowThreshold) {
                    // Pick a character based on density relative to the intensity
                    const index = Math.floor(normalized * (ramp.length - 1));
                    rowText += ramp[index];
                } else {
                    rowText += " ";
                }
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
