import CachedWeatherApp from "./CachedWeatherApp";
import CachedRssApp from "./CachedRssApp";
import CachedRandomImageApp from "./CachedRandomImageApp";
import CachedQuoteApp from "./CachedQuoteApp";

const AppRenderer = ({ appType, appConfig }: { appType: string; appConfig: any }) => {
  if (!appType) return null;

  switch (appType) {
    case "weather":
      return <CachedWeatherApp config={appConfig} refreshInterval={60} />;
    case "rss":
      return <CachedRssApp config={appConfig} refreshInterval={120} />;
    case "random_image":
      return <CachedRandomImageApp config={appConfig} refreshInterval={30} />;
    case "quote":
      return <CachedQuoteApp config={appConfig} refreshInterval={30} />;
    default:
      return <div className="text-white">App não suportado: {appType}</div>;
  }
};

export default AppRenderer;
