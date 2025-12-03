import { useEffect, useState, useRef } from "react";

interface CachedWeatherAppProps {
  config: { latlon: string };
  refreshInterval?: number; // em segundos, padrão 60s
}

const CachedWeatherApp = ({ config, refreshInterval = 60 }: CachedWeatherAppProps) => {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<any>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchWeather = async () => {
    const now = Date.now();
    // Use cache if fresh (within refresh interval)
    if (
      cacheRef.current &&
      now - lastFetchRef.current < refreshInterval * 1000
    ) {
      setData(cacheRef.current);
      return;
    }

    if (!config?.latlon) return;
    const [lat, lon] = config.latlon.split(",").map((s: string) => s.trim());
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      cacheRef.current = json;
      lastFetchRef.current = now;
      setData(json);
      setError(null);
    } catch (e) {
      setError("Erro ao buscar tempo");
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config, refreshInterval]);

  if (error) return <div className="text-white">{error}</div>;
  if (!data) return <div className="text-white">Carregando tempo...</div>;

  const cw = data.current_weather;

  return (
    <div className="px-6 py-4 text-white text-center flex flex-col items-center justify-center h-full">
      <div className="text-5xl font-bold">{cw.temperature}°C</div>
      <div className="text-lg text-gray-200 mt-2">Vento: {cw.windspeed} km/h</div>
      <div className="text-xs text-gray-400 mt-4">Atualizado há {Math.floor((Date.now() - lastFetchRef.current) / 1000)}s</div>
    </div>
  );
};

export default CachedWeatherApp;
