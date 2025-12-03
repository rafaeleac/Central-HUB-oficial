import { useEffect, useState } from "react";

interface WeatherAppProps {
  config: { latlon: string };
}

const WeatherApp = ({ config }: WeatherAppProps) => {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config?.latlon) return;
    const [lat, lon] = config.latlon.split(",").map((s: string) => s.trim());
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((e) => setError("Erro ao buscar tempo"));
  }, [config]);

  if (error) return <div className="text-white">{error}</div>;
  if (!data) return <div className="text-white">Carregando tempo...</div>;

  const cw = data.current_weather;

  return (
    <div className="px-6 py-4 text-white text-center">
      <div className="text-2xl font-bold">{cw.temperature}°C</div>
      <div className="text-sm text-gray-200">Vento: {cw.windspeed} km/h</div>
      <div className="text-xs text-gray-300">Fonte: Open-Meteo</div>
    </div>
  );
};

export default WeatherApp;
