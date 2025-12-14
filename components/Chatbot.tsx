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
    "What's my total income?",
    "How much will I owe?",
    "Am I getting a refund?",
    "What deductions can I claim?"
];

export const Chatbot: React.FC<ChatbotProps> = ({ incomes, taxResult, taxPayer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hey there! 👋 I\'m your AI tax assistant. Ask me anything about your return!' }
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
            alert('Speech recognition is not supported in your browser.');
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
            setMessages(prev => [...prev, { role: 'assistant', content: error.message || 'Something went wrong.' }]);
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
            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300",
                    isOpen
                        ? "bg-neutral-800 dark:bg-neutral-700"
                        : "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 hover:shadow-purple-500/40"
                )}
            >
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="material-symbols-outlined text-white text-3xl"
                >
                    {isOpen ? 'close' : 'chat'}
                </motion.span>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[550px] z-50 flex flex-col overflow-hidden rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="relative p-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">Tax AI Assistant</h3>
                                    <p className="text-xs text-purple-100 flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        Powered by Gemini 2.5
                                    </p>
                                </div>
                                <button
                                    onClick={() => setMessages([{ role: 'assistant', content: 'Chat cleared! How can I help?' }])}
                                    className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                                    title="Clear chat"
                                >
                                    <span className="material-symbols-outlined text-xl">refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-neutral-50/50 to-neutral-100/50 dark:from-neutral-900/50 dark:to-neutral-950/50">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-md",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm"
                                            : "bg-white dark:bg-neutral-800 text-text-main dark:text-white rounded-bl-sm border border-neutral-200/50 dark:border-neutral-700/50"
                                    )}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <span className="material-symbols-outlined text-white text-sm">person</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3 justify-start"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-white text-sm animate-pulse">smart_toy</span>
                                    </div>
                                    <div className="bg-white dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md border border-neutral-200/50 dark:border-neutral-700/50 flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Prompts */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border-t border-neutral-200/50 dark:border-neutral-800/50">
                                <p className="text-xs text-text-muted mb-2 font-medium">Suggested</p>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(prompt)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 bg-white/80 dark:bg-neutral-900/80 border-t border-neutral-200/50 dark:border-neutral-800/50 flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all",
                                    isListening
                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                                        : "bg-neutral-100 dark:bg-neutral-800 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                )}
                            >
                                <span className="material-symbols-outlined text-xl">{isListening ? 'graphic_eq' : 'mic'}</span>
                            </button>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Type a message..."}
                                className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 transition-all dark:text-white placeholder:text-neutral-400"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                            >
                                <span className="material-symbols-outlined text-xl">arrow_upward</span>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
