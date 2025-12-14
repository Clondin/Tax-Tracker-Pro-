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

export const Chatbot: React.FC<ChatbotProps> = ({ incomes, taxResult, taxPayer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I can help you with your tax return. Ask me anything about your income, deductions, or general tax questions. You can also use the microphone!' }
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

    // Initialize Speech Recognition
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

                recognitionRef.current.onerror = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
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
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context
                })
            });

            if (!response.ok) {
                let errorDetails = `Error ${response.status}: ${response.statusText}`;
                try {
                    const data = await response.json();
                    if (data.error) errorDetails = data.error;
                    else if (data.content) errorDetails = data.content;
                } catch (e) {
                    const text = await response.text();
                    if (text) errorDetails += ` - ${text.substring(0, 100)}`;
                }
                throw new Error(errorDetails);
            }

            const data = await response.json();
            setMessages(prev => [...prev, data]);
        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMessage = error.message || 'Sorry, I encountered an error.';
            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-primary/50 transition-all"
            >
                <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'smart_toy'}</span>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-border-light dark:border-neutral-700 z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <span className="material-symbols-outlined">smart_toy</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold">Tax Assistant</h3>
                                <p className="text-xs text-indigo-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    {isListening ? 'Listening...' : 'Online'}
                                </p>
                            </div>
                            <button onClick={() => setMessages([{ role: 'assistant', content: 'History cleared. How can I help?' }])} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-white rounded-br-none"
                                            : "bg-white dark:bg-neutral-800 text-text-main dark:text-white rounded-bl-none border border-border-light dark:border-neutral-700"
                                    )}>
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl rounded-bl-none border border-border-light dark:border-neutral-700 flex gap-1">
                                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-neutral-900 border-t border-border-light dark:border-neutral-700 flex gap-2">
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    isListening
                                        ? "bg-red-500 text-white animate-pulse"
                                        : "bg-neutral-100 dark:bg-neutral-800 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                )}
                            >
                                <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
                            </button>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Ask about your taxes..."}
                                className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
