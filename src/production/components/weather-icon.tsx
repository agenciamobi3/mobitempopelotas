import type { WeatherIconName } from "@/production/lib/weather-data";

import "./weather-icon.css";

type WeatherIconProps = {
  name: WeatherIconName;
  className?: string;
  title?: string;
};

function SunGraphic({ behind = false }: { behind?: boolean }) {
  return (
    <g className={`weather-icon__sun${behind ? " weather-icon__sun--behind" : ""}`}>
      <g className="weather-icon__sun-rays" stroke="#f5a400" strokeLinecap="round" strokeWidth="2.2">
        <line x1="24" y1="5" x2="24" y2="10" />
        <line x1="24" y1="38" x2="24" y2="43" />
        <line x1="5" y1="24" x2="10" y2="24" />
        <line x1="38" y1="24" x2="43" y2="24" />
        <line x1="10.6" y1="10.6" x2="14.2" y2="14.2" />
        <line x1="33.8" y1="33.8" x2="37.4" y2="37.4" />
        <line x1="37.4" y1="10.6" x2="33.8" y2="14.2" />
        <line x1="14.2" y1="33.8" x2="10.6" y2="37.4" />
      </g>
      <circle className="weather-icon__sun-core" cx="24" cy="24" r="8.3" fill="#ffb300" stroke="#f5a400" strokeWidth="1.6" />
    </g>
  );
}

function MoonGraphic({ behind = false }: { behind?: boolean }) {
  return (
    <g className={`weather-icon__moon${behind ? " weather-icon__moon--behind" : ""}`}>
      <path
        className="weather-icon__moon-body"
        d="M31.7 7.5c-6.4 1.7-11.1 7.5-11.1 14.4 0 8.2 6.7 14.9 14.9 14.9 4.1 0 7.9-1.7 10.6-4.5a13.7 13.7 0 0 1-4.2.7c-7.5 0-13.6-6.1-13.6-13.6 0-4.5 2.2-8.5 5.6-11-.7-.3-1.4-.6-2.2-.9Z"
        fill="#ffb300"
        stroke="#f5a400"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path className="weather-icon__star weather-icon__star--one" d="m15 11 1.3 2.3 2.3 1.3-2.3 1.3L15 18.2l-1.3-2.3-2.3-1.3 2.3-1.3L15 11Z" fill="#ffb300" />
      <path className="weather-icon__star weather-icon__star--two" d="m39 7 1 1.8 1.8 1-1.8 1-1 1.8-1-1.8-1.8-1 1.8-1L39 7Z" fill="#ffb300" />
    </g>
  );
}

function CloudGraphic({ back = false }: { back?: boolean }) {
  if (back) {
    return (
      <path
        className="weather-icon__cloud weather-icon__cloud--back"
        d="M11 28.5c0-3.2 2.6-5.8 5.8-5.8.7 0 1.4.1 2 .4 1-3.5 4.2-6 8-6 4.4 0 8 3.2 8.6 7.4.5-.2 1.1-.2 1.7-.2 3.3 0 5.9 2.7 5.9 5.9S40.4 36 37.1 36H16.8c-3.2 0-5.8-2.6-5.8-5.8v-1.7Z"
        fill="#91c0f8"
        stroke="#fff"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    );
  }

  return (
    <path
      className="weather-icon__cloud weather-icon__cloud--front"
      d="M6.5 31.8c0-4.3 3.5-7.8 7.8-7.8.9 0 1.8.2 2.6.5 1.3-4.7 5.6-8.1 10.7-8.1 6 0 10.9 4.6 11.4 10.5.7-.2 1.5-.3 2.2-.3 4.5 0 8.1 3.6 8.1 8.1s-3.6 8.1-8.1 8.1H14.3c-4.3 0-7.8-3.5-7.8-7.8v-3.2Z"
      fill="#57a0ee"
      stroke="#fff"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  );
}

function RainDrops() {
  return (
    <g className="weather-icon__rain">
      <line className="weather-icon__rain-drop weather-icon__rain-drop--one" x1="17" y1="39" x2="15.8" y2="46" stroke="#91c0f8" strokeLinecap="round" strokeWidth="2.4" />
      <line className="weather-icon__rain-drop weather-icon__rain-drop--two" x1="27" y1="39" x2="25.8" y2="46" stroke="#91c0f8" strokeLinecap="round" strokeWidth="2.4" />
      <line className="weather-icon__rain-drop weather-icon__rain-drop--three" x1="37" y1="39" x2="35.8" y2="46" stroke="#91c0f8" strokeLinecap="round" strokeWidth="2.4" />
    </g>
  );
}

function Artwork({ name }: { name: Exclude<WeatherIconName, "wind"> }) {
  if (name === "sun") return <SunGraphic />;
  if (name === "moon") return <MoonGraphic />;
  if (name === "partly-cloudy") return <><SunGraphic behind /><CloudGraphic /></>;
  if (name === "partly-cloudy-night") return <><MoonGraphic behind /><CloudGraphic /></>;
  if (name === "cloud") return <><CloudGraphic back /><CloudGraphic /></>;
  if (name === "rain") return <><CloudGraphic /><RainDrops /></>;
  return <><CloudGraphic back /><CloudGraphic /><polygon className="weather-icon__lightning" points="25,33 33,33 29,39 34,39 23,49 27,41 22,41" fill="#ffb300" stroke="#fff" strokeLinejoin="round" strokeWidth="1" /></>;
}

function WindIcon({ className, title }: Pick<WeatherIconProps, "className" | "title">) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} focusable="false" data-weather-icon="wind">
      {title ? <title>{title}</title> : null}
      <g className="weather-icon__wind-lines" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h24c6 0 6-9 0-9-3.4 0-5.2 2.2-5.2 4.5" />
        <path d="M5 25h34c6 0 6 10 0 10-3.4 0-5.2-2.2-5.2-4.5" />
        <path d="M5 34h20" />
      </g>
    </svg>
  );
}

export function WeatherIcon({ name, className = "", title }: WeatherIconProps) {
  const iconClassName = ["weather-icon", name === "wind" ? "weather-icon--local" : "weather-icon--amcharts", `weather-icon--${name}`, className].filter(Boolean).join(" ");

  if (name === "wind") return <WindIcon className={iconClassName} title={title} />;

  return (
    <svg className={iconClassName} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} focusable="false" data-weather-icon={name}>
      {title ? <title>{title}</title> : null}
      <metadata>Weather icon artwork derived from amCharts, licensed under Creative Commons Attribution 4.0.</metadata>
      <g className="weather-icon__artwork"><Artwork name={name} /></g>
    </svg>
  );
}
