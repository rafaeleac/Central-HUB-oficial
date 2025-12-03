import { useEffect, useState, useRef } from "react";

interface CachedRssAppProps {
  config: { url: string };
  refreshInterval?: number; // em segundos, padrão 120s
}

const parseRSS = (xmlText: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 5).map((it) => ({
      title: it.querySelector("title")?.textContent || "",
      link: it.querySelector("link")?.textContent || "",
      description: it.querySelector("description")?.textContent || "",
      pubDate: it.querySelector("pubDate")?.textContent || "",
    }));
    return items;
  } catch (e) {
    return [];
  }
};

const CachedRssApp = ({ config, refreshInterval = 120 }: CachedRssAppProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cacheRef = useRef<any[]>([]);
  const lastFetchRef = useRef<number>(0);

  const fetchRss = async () => {
    const now = Date.now();
    // Use cache if fresh
    if (
      cacheRef.current.length > 0 &&
      now - lastFetchRef.current < refreshInterval * 1000
    ) {
      setItems(cacheRef.current);
      return;
    }

    if (!config?.url) return;
    const proxyUrl = `${window.location.origin}/functions/v1/proxy?url=${encodeURIComponent(config.url)}`;

    try {
      const res = await fetch(proxyUrl);
      const text = await res.text();
      const parsed = parseRSS(text);
      cacheRef.current = parsed;
      lastFetchRef.current = now;
      setItems(parsed);
      setError(null);
    } catch (e) {
      setError("Erro ao buscar RSS");
    }
  };

  useEffect(() => {
    fetchRss();
    const interval = setInterval(fetchRss, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config, refreshInterval]);

  // Rotation automática entre itens
  useEffect(() => {
    if (!items.length) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000); // 8 segundos por item
    return () => clearTimeout(timer);
  }, [currentIndex, items]);

  if (error) return <div className="text-white p-4">{error}</div>;
  if (!items.length) return <div className="text-white p-4">Carregando feed...</div>;

  const current = items[currentIndex];

  return (
    <div className="p-6 text-white h-full flex flex-col justify-center">
      <div className="font-bold text-2xl mb-2 line-clamp-2">{current.title}</div>
      <div className="text-sm text-gray-300 line-clamp-3">{current.description}</div>
      <div className="text-xs text-gray-500 mt-4">Item {currentIndex + 1} de {items.length}</div>
    </div>
  );
};

export default CachedRssApp;
