import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { IncomeItem, TaxResult, TaxPayer } from '../types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatbotProps {
    incomes: IncomeItem[];
    taxResult: TaxResult | null;
    taxPayer?: TaxPayer;
}

const QUICK_PROMPTS = [
    "Deductions help",
    "Estimated refund?",
    "Tax bracket status"
];

export const Chatbot: React.FC<ChatbotProps> = ({ incomes, taxResult, taxPayer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Tax Assistant online. Secure connection established.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(prev => prev + ' ' + transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) {
            alert('Mic unavailable');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    }, [isListening]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: content.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const context = {
                incomes,
                taxResult,
                taxPayer,
                summary: {
                    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
                    totalWithholding: incomes.reduce((sum, i) => sum + (i.withholding || 0), 0),
                    itemCount: incomes.length
                }
            };

            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage], context })
            });

            if (!response.ok) {
                let errorDetails = `Error ${response.status}`;
                try {
                    const data = await response.json();
                    if (data.error) errorDetails = data.error;
                    else if (data.content) errorDetails = data.content;
                } catch (e) { }
                throw new Error(errorDetails);
            }

            const data = await response.json();
            setMessages(prev => [...prev, data]);
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: error.message || 'System error.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            {/* Toggle Button - Minimalist */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200"
                )}
            >
                <span className="material-symbols-outlined text-[24px]">{isOpen ? 'close' : 'smart_toy'}</span>
            </motion.button>

            {/* Chat Panel - Professional Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-24 right-6 w-[380px] h-[600px] z-50 flex flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white dark:bg-[#111]"
                    >
                        {/* Header - Strict Tool Look */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-[#111]/50 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">AI Assistant</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-mono">
                                    v2.5
                                </span>
                            </div>
                            <button
                                onClick={() => setMessages([{ role: 'assistant', content: 'History purged. Ready.' }])}
                                className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
                            </button>
                        </div>

                        {/* Messages Area - Clean Typography */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-[#111]">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[14px] text-neutral-500">smart_toy</span>
                                            </div>
                                        )}

                                        <div className={cn(
                                            "px-3.5 py-2.5 text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl rounded-br-sm"
                                                : "bg-transparent text-neutral-700 dark:text-neutral-300 rounded-none pl-0"
                                        )}>
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-current [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading State - Minimal Pulse */}
                            {isLoading && (
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[14px] text-neutral-500">smart_toy</span>
                                    </div>
                                    <div className="flex gap-1 h-6 items-center">
                                        <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full animate-pulse"></span>
                                        <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full animate-pulse delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full animate-pulse delay-150"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts - Subtle Pills */}
                        {messages.length < 3 && !isLoading && (
                            <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                                {QUICK_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => sendMessage(prompt)}
                                        className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area - Integrated */}
                        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#111]">
                            <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 px-2 py-1.5 transition-colors focus-within:border-neutral-300 dark:focus-within:border-neutral-700">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{isListening ? 'stop_circle' : 'mic'}</span>
                                </button>

                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 h-9"
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-1.5 rounded-md text-neutral-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
