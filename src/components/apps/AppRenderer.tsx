import WeatherApp from "./WeatherApp";
import RssApp from "./RssApp";
import RandomImageApp from "./RandomImageApp";
import QuoteApp from "./QuoteApp";

const AppRenderer = ({ appType, appConfig }: { appType: string; appConfig: any }) => {
  if (!appType) return null;

  switch (appType) {
    case "weather":
      return <WeatherApp config={appConfig} />;
    case "rss":
      return <RssApp config={appConfig} />;
    case "random_image":
      return <RandomImageApp config={appConfig} />;
    case "quote":
      return <QuoteApp config={appConfig} />;
    default:
      return <div className="text-white">App não suportado: {appType}</div>;
  }
};

export default AppRenderer;
