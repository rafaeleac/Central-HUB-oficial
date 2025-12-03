import { useEffect, useState, useRef } from "react";

interface CachedRandomImageAppProps {
  config?: any;
  refreshInterval?: number; // em segundos, padrão 30s
}

const CachedRandomImageApp = ({ config, refreshInterval = 30 }: CachedRandomImageAppProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const rotationTimerRef = useRef<NodeJS.Timeout>();

  const generateNewImage = () => {
    setUrl(`https://picsum.photos/1280/720?random=${Math.floor(Math.random() * 100000)}`);
  };

  useEffect(() => {
    generateNewImage();
    rotationTimerRef.current = setInterval(generateNewImage, refreshInterval * 1000);
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [refreshInterval]);

  if (!url) return <div className="text-white">Carregando imagem...</div>;

  return (
    <img
      src={url}
      alt="Imagem aleatória"
      className="w-full h-full object-cover"
    />
  );
};

export default CachedRandomImageApp;
