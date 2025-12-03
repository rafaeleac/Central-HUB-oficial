import { useEffect, useState } from "react";

const RandomImageApp = ({ config }: { config?: any }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Picsum provides random images. Use size 1280x720.
    setUrl(`https://picsum.photos/1280/720?random=${Math.floor(Math.random() * 10000)}`);
  }, []);

  if (!url) return <div className="text-white">Carregando imagem...</div>;

  return (
    <img src={url} alt="Imagem aleatória" className="w-full h-full object-cover" />
  );
};

export default RandomImageApp;
