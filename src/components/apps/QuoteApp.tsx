import { useEffect, useState } from "react";

const QuoteApp = ({ config }: { config?: any }) => {
  const [quote, setQuote] = useState<any | null>(null);

  useEffect(() => {
    fetch("https://api.quotable.io/random")
      .then((r) => r.json())
      .then((q) => setQuote(q))
      .catch(() => {
        // Fallback local
        setQuote({ content: "Siga sempre em frente.", author: "Autor Desconhecido" });
      });
  }, []);

  if (!quote) return <div className="text-white">Carregando citação...</div>;

  return (
    <div className="p-6 text-center text-white">
      <div className="text-xl italic">“{quote.content}”</div>
      <div className="text-sm text-gray-300 mt-2">— {quote.author}</div>
    </div>
  );
};

export default QuoteApp;
