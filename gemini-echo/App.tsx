
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { ConnectionStatus, ChatMessage } from './types';
import { encode, decode, decodeAudioData } from './utils/audio';
import Visualizer from './components/Visualizer';
import { Mic, MicOff, PhoneOff, MessageSquare, Settings, Info, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<{user: string, ai: string}>({user: '', ai: ''});

  // Audio Contexts & Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscription]);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setStatus(ConnectionStatus.DISCONNECTED);
  }, []);

  const handleConnect = async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Init Audio
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      outputAnalyserRef.current = outputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 512;
      outputAnalyserRef.current.fftSize = 512;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(inputAnalyserRef.current!);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setCurrentTranscription(prev => ({ ...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '') }));
            } else if (message.serverContent?.inputTranscription) {
              setCurrentTranscription(prev => ({ ...prev, user: prev.user + (message.serverContent?.inputTranscription?.text || '') }));
            }

            if (message.serverContent?.turnComplete) {
              setMessages(prev => [
                ...prev,
                { role: 'user', text: currentTranscription.user, timestamp: Date.now() },
                { role: 'model', text: currentTranscription.ai, timestamp: Date.now() }
              ]);
              setCurrentTranscription({ user: '', ai: '' });
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              
              source.connect(outputAnalyserRef.current!);
              outputAnalyserRef.current!.connect(ctx.destination);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setStatus(ConnectionStatus.ERROR);
            cleanup();
          },
          onclose: () => {
            setStatus(ConnectionStatus.DISCONNECTED);
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are Gemini Echo, a sophisticated, calm, and empathetic AI assistant. Your goal is to have deep, meaningful, and natural conversations through voice. Keep responses concise and human-like.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus(ConnectionStatus.ERROR);
      cleanup();
    }
  };

  const handleDisconnect = () => {
    cleanup();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-black transition-colors duration-700">
      {/* Header */}
      <header className="flex items-center justify-between p-8 z-10">
        <div className="flex items-center space-x-3">
            <h1 className="text-sm font-medium tracking-[0.6em] uppercase opacity-20 hover:opacity-100 transition-opacity cursor-default">Echo</h1>
        </div>
        <div className="flex items-center space-x-6">
            <button 
                onClick={() => setShowTranscript(!showTranscript)}
                className={`p-1 transition-all ${showTranscript ? 'text-black' : 'text-gray-300 hover:text-black'}`}
                title="Toggle Transcript"
            >
                <MessageSquare size={20} strokeWidth={1.5} />
            </button>
            <button className="p-1 text-gray-300 hover:text-black transition-all">
                <Settings size={20} strokeWidth={1.5} />
            </button>
        </div>
      </header>

      {/* Main Visual Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6">
        <Visualizer 
            analyser={outputAnalyserRef.current || inputAnalyserRef.current} 
            isActive={status === ConnectionStatus.CONNECTED}
        />
        
        <div className="absolute bottom-40 text-center pointer-events-none">
            {status === ConnectionStatus.DISCONNECTED && (
                <p className="text-gray-300 text-[10px] tracking-[0.4em] uppercase font-light">Standby</p>
            )}
            {status === ConnectionStatus.CONNECTING && (
                 <div className="flex items-center space-x-3 text-black">
                    <Loader2 className="animate-spin" size={12} strokeWidth={2} />
                    <span className="text-[10px] tracking-[0.4em] uppercase font-medium">Link in progress</span>
                 </div>
            )}
            {status === ConnectionStatus.CONNECTED && (
                <p className="text-black text-[10px] uppercase tracking-[0.8em] font-medium animate-pulse">Active</p>
            )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-16 flex items-center justify-center z-10">
        <div className="flex items-center space-x-16">
            {status === ConnectionStatus.CONNECTED && (
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`transition-all duration-300 ${isMuted ? 'text-gray-200' : 'text-gray-400 hover:text-black'}`}
                >
                    {isMuted ? <MicOff size={24} strokeWidth={1.5} /> : <Mic size={24} strokeWidth={1.5} />}
                </button>
            )}

            <button 
                onClick={status === ConnectionStatus.CONNECTED ? handleDisconnect : handleConnect}
                disabled={status === ConnectionStatus.CONNECTING}
                className={`group p-10 rounded-full transition-all duration-700 flex items-center justify-center border
                    ${status === ConnectionStatus.CONNECTED 
                        ? 'bg-black border-black' 
                        : 'bg-white border-black/10 hover:border-black'}
                `}
            >
                {status === ConnectionStatus.CONNECTED ? (
                    <PhoneOff size={28} className="text-white" strokeWidth={1.5} />
                ) : (
                    <Mic size={28} className="text-black group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                )}
            </button>

            {status === ConnectionStatus.CONNECTED && (
                <div className="text-gray-400">
                    <Info size={24} strokeWidth={1.5} className="opacity-20 hover:opacity-100 cursor-help transition-opacity" />
                </div>
            )}
        </div>
      </footer>

      {/* Transcript Sidebar Overlay */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white transform transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-black/5 z-20 ${showTranscript ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full shadow-2xl">
            <div className="p-10 flex justify-between items-center">
                <h3 className="text-[10px] font-medium text-black uppercase tracking-[0.3em]">Log</h3>
                <button onClick={() => setShowTranscript(false)} className="text-gray-300 hover:text-black transition-colors text-xs uppercase tracking-widest">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-12 scrollbar-hide">
                {messages.length === 0 && !currentTranscription.user && !currentTranscription.ai && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <p className="text-[10px] uppercase tracking-[0.5em] font-light">Void</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className="flex flex-col space-y-3">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-gray-400">{msg.role === 'user' ? 'In' : 'Out'}</span>
                        <div className={`text-sm leading-relaxed ${
                            msg.role === 'user' ? 'text-black' : 'text-gray-500 font-light'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {(currentTranscription.user || currentTranscription.ai) && (
                    <div className="space-y-8">
                        {currentTranscription.user && (
                            <div className="flex flex-col space-y-3">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-gray-200">Listening...</span>
                                <div className="text-sm leading-relaxed text-gray-400">
                                    {currentTranscription.user}
                                </div>
                            </div>
                        )}
                        {currentTranscription.ai && (
                            <div className="flex flex-col space-y-3">
                                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-black">Responding...</span>
                                <div className="text-sm leading-relaxed text-black italic font-light">
                                    {currentTranscription.ai}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={transcriptEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
