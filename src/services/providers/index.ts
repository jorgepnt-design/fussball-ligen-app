import type { LeagueConfig, LeagueProvider } from "../../types";
import { apiFootballProvider } from "./apiFootballProvider";
import { openLigaProvider } from "./openLigaProvider";

const providers: Record<LeagueConfig["provider"], LeagueProvider> = {
  openliga: openLigaProvider,
  apifootball: apiFootballProvider,
};

export const getProvider = (league: LeagueConfig): LeagueProvider => providers[league.provider];
