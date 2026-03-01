import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { AiMessage } from '@/types/api';

interface Message {
  role: 'user' | 'model';
  text: string;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

export function NutriBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Bonjour ! Je suis NutriBot, votre assistant santé IA. Posez-moi vos questions sur la nutrition, les plats ivoiriens ou votre santé.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (userText: string) => {
      const history: AiMessage[] = messages.slice(-10).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      return api.chat({ message: userText, history });
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'model', text: data.response }]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [...prev, { role: 'model', text: `Erreur: ${err.message}` }]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    mutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-[200px] max-h-[320px] bg-black/20 rounded-xl mb-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'model' && (
              <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-ci-green/20">
                <Bot className="h-4 w-4 text-ci-green" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user'
                  ? 'bg-ci-orange text-white rounded-tr-sm'
                  : 'bg-[color:var(--glass-border)] text-gray-200 rounded-tl-sm'
                }`}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }}
            />
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-ci-green/20">
              <Bot className="h-4 w-4 text-ci-green" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-[color:var(--glass-border)] px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Que penses-tu du Foutou ?"
          disabled={mutation.isPending}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={mutation.isPending || !input.trim()}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
