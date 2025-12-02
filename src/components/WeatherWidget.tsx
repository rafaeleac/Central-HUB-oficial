import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface Props {
  city?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  apiKey?: string;
}

export function WeatherWidget({ city = "São Paulo", latitude, longitude, className = "", apiKey }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = "";

        // Se tiver API key, usa OpenWeatherMap
        if (apiKey) {
          if (latitude && longitude) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=pt_br&appid=${apiKey}`;
          } else {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=pt_br&appid=${apiKey}`;
          }

          const response = await fetch(url);
          if (!response.ok) throw new Error("Erro ao buscar clima");

          const data = await response.json();
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].main,
            city: data.name,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 3.6), // m/s para km/h
            icon: data.weather[0].icon,
          });
        } else {
          // Fallback: usar uma API pública que não requer key (Open-Meteo)
          let geoUrl = "";
          if (latitude && longitude) {
            geoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          } else {
            // Usar geocodificação (simplificado para São Paulo)
            const cityCoords: { [key: string]: [number, number] } = {
              "São Paulo": [-23.5505, -46.6333],
              "Rio de Janeiro": [-22.9068, -43.1729],
              "Brasília": [-15.7975, -47.8919],
              "Salvador": [-12.9714, -38.5014],
              "Belo Horizonte": [-19.9191, -43.9386],
              "Recife": [-8.0476, -34.877],
              "Manaus": [-3.1226, -60.0021],
              "Curitiba": [-25.4284, -49.2733],
              "Fortaleza": [-3.7319, -38.5267],
              "Goiânia": [-15.8267, -48.9385],
            };

            const coords = cityCoords[city] || cityCoords["São Paulo"];
            geoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          }

          const response = await fetch(geoUrl);
          if (!response.ok) throw new Error("Erro ao buscar clima");

          const data = await response.json();
          const current = data.current;

          // Traduzir weather codes para descrições
          const weatherDescriptions: { [key: number]: string } = {
            0: "Ensolarado",
            1: "Nublado",
            2: "Parcialmente Nublado",
            3: "Nublado",
            45: "Nevoeiro",
            48: "Nevoeiro com geada",
            51: "Chuva leve",
            53: "Chuva moderada",
            55: "Chuva forte",
            61: "Chuva",
            63: "Chuva moderada",
            65: "Chuva forte",
            71: "Neve leve",
            73: "Neve",
            75: "Neve forte",
            77: "Granizo",
            80: "Chuva leve",
            81: "Chuva",
            82: "Chuva forte",
            85: "Neve leve",
            86: "Neve moderada",
            95: "Trovoada",
            96: "Trovoada com granizo",
            99: "Trovoada com granizo forte",
          };

          setWeather({
            temp: Math.round(current.temperature_2m),
            description: weatherDescriptions[current.weather_code] || "Nublado",
            city: city,
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            icon: current.weather_code < 3 ? "01d" : current.weather_code < 50 ? "02d" : "09d",
          });
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Não foi possível carregar o clima");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Recarregar a cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city, latitude, longitude, apiKey]);

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-12 h-12" />;

    const desc = weather.description.toLowerCase();
    if (desc.includes("chuva") || desc.includes("trovoada")) {
      return <CloudRain className="w-12 h-12 text-blue-400" />;
    }
    if (desc.includes("ensolarado")) {
      return <Sun className="w-12 h-12 text-yellow-400" />;
    }
    return <Cloud className="w-12 h-12 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-pulse text-white">Carregando clima...</div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg ${className}`}>
        <div className="text-center text-gray-300 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg text-white ${className}`}>
      <div className="text-sm text-gray-300 mb-2">{weather.city}</div>

      <div className="flex items-center justify-center mb-3">{getWeatherIcon()}</div>

      <div className="text-5xl font-bold mb-2">{weather.temp}°C</div>

      <div className="text-base text-gray-200 mb-4">{weather.description}</div>

      <div className="w-full grid grid-cols-2 gap-2 text-xs text-gray-300">
        <div className="flex items-center justify-center gap-1">
          <span>💧</span>
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}
