import type { WeatherIconName } from "@/production/lib/weather-data";

import "./weather-icon.css";

type WeatherIconProps = {
  name: WeatherIconName;
  className?: string;
  title?: string;
};

const AMCHARTS_ICON_ROOT = "/weather-icons/amcharts";

const AMCHARTS_WEATHER_ICONS = {
  sun: `${AMCHARTS_ICON_ROOT}/day.svg`,
  moon: `${AMCHARTS_ICON_ROOT}/night.svg`,
  "partly-cloudy": `${AMCHARTS_ICON_ROOT}/cloudy-day-2.svg`,
  "partly-cloudy-night": `${AMCHARTS_ICON_ROOT}/cloudy-night-2.svg`,
  cloud: `${AMCHARTS_ICON_ROOT}/cloudy.svg`,
  rain: `${AMCHARTS_ICON_ROOT}/rainy-5.svg`,
  storm: `${AMCHARTS_ICON_ROOT}/thunder.svg`,
} satisfies Record<Exclude<WeatherIconName, "wind">, string>;

function WindIcon({ className, title }: Pick<WeatherIconProps, "className" | "title">) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      data-weather-icon="wind"
    >
      {title ? <title>{title}</title> : null}
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 35h47c10 0 10-16 0-16-6 0-9 4-9 8" />
        <path d="M12 50h66c10 0 10 17 0 17-6 0-9-4-9-8" />
        <path d="M12 65h36" />
      </g>
    </svg>
  );
}

export function WeatherIcon({ name, className = "", title }: WeatherIconProps) {
  if (name === "wind") {
    return <WindIcon className={className} title={title} />;
  }

  const iconClassName = ["weather-icon", "weather-icon--amcharts", `weather-icon--${name}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={iconClassName}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      data-weather-icon={name}
    >
      {title ? <title>{title}</title> : null}
      <metadata>
        Weather icon artwork by amCharts, licensed under Creative Commons Attribution 4.0.
      </metadata>
      <image
        className="weather-icon__asset"
        href={AMCHARTS_WEATHER_ICONS[name]}
        x="0"
        y="0"
        width="64"
        height="64"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
