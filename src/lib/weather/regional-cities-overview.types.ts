import type { RegionalCity } from "@/lib/regional-cities";

export type RegionalOverviewItemStatus = "live" | "partial" | "unavailable";

export type RegionalCityOverviewItem = {
  city: RegionalCity;
  status: RegionalOverviewItemStatus;
  temperature: number | null;
  condition: string;
  minimum: number | null;
  maximum: number | null;
  rainChance: number | null;
  windSpeed: number | null;
  validAt: string | null;
};

export type RegionalCitiesOverview = {
  status: RegionalOverviewItemStatus;
  fetchedAt: string;
  items: RegionalCityOverviewItem[];
  source: {
    name: "Open-Meteo";
  };
  message: string | null;
};
