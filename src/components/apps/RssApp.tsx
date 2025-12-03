import { useEffect, useState } from "react";

interface RssAppProps {
  config: { url: string };
}

const parseRSS = (xmlText: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 5).map((it) => ({
      title: it.querySelector("title")?.textContent || "",
      link: it.querySelector("link")?.textContent || "",
      description: it.querySelector("description")?.textContent || "",
    }));
    return items;
  } catch (e) {
    return [];
  }
};

const RssApp = ({ config }: RssAppProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config?.url) return;
    // Use AllOrigins public proxy to avoid CORS issues
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(config.url)}`;

    fetch(proxy)
      .then((r) => r.text())
      .then((text) => setItems(parseRSS(text)))
      .catch((e) => setError("Erro ao buscar RSS"));
  }, [config]);

  if (error) return <div className="text-white">{error}</div>;
  if (!items.length) return <div className="text-white">Carregando feed...</div>;

  return (
    <div className="p-4 text-white">
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="text-left">
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm text-gray-300">{it.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RssApp;
