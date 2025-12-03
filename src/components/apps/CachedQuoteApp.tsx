import { useEffect, useState, useRef } from "react";

interface CachedQuoteAppProps {
  config?: any;
  refreshInterval?: number; // em segundos, padrão 30s
}

interface Quote {
  content: string;
  author: string;
}

const CachedQuoteApp = ({ config, refreshInterval = 30 }: CachedQuoteAppProps) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const cacheRef = useRef<Quote[]>([]);
  const lastFetchRef = useRef<number>(0);

  const fetchQuote = async () => {
    const now = Date.now();
    // Use cache if fresh
    if (
      cacheRef.current.length > 0 &&
      now - lastFetchRef.current < refreshInterval * 1000
    ) {
      const random = cacheRef.current[Math.floor(Math.random() * cacheRef.current.length)];
      setQuote(random);
      return;
    }

    try {
      const res = await fetch("https://api.quotable.io/random");
      const q = await res.json();
      cacheRef.current.push(q);
      lastFetchRef.current = now;
      setQuote(q);
    } catch {
      // Fallback local
      setQuote({ content: "Siga sempre em frente.", author: "Autor Desconhecido" });
    }
  };

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!quote) return <div className="text-white">Carregando citação...</div>;

  return (
    <div className="p-6 text-center text-white h-full flex flex-col justify-center items-center">
      <div className="text-2xl italic">"{quote.content}"</div>
      <div className="text-sm text-gray-300 mt-4">— {quote.author}</div>
    </div>
  );
};

export default CachedQuoteApp;
