import React, { useState, useRef, useEffect } from 'react';
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
        { role: 'assistant', content: 'Hi! I can help you with your tax return. Ask me anything about your income, deductions, or general tax questions.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
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

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            setMessages(prev => [...prev, data]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
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
                            <div>
                                <h3 className="font-bold">Tax Assistant</h3>
                                <p className="text-xs text-indigo-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
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
                                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
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
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about your taxes..."
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
