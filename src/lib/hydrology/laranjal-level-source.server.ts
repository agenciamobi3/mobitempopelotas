import { fetchCiexFurgPelotasLevelData } from "./ciex-furg-pelotas.server";
import { fetchLastKnownLaranjalLevelData } from "./laranjal-last-known.server";
import { fetchLaranjalLevelData, type LaranjalLevelData } from "./laranjal-level.server";
import { selectLaranjalLevelSource } from "./laranjal-level-selector";

type FetchSelectedLaranjalOptions = {
  deadlineMs?: number;
};

export async function fetchSelectedLaranjalLevelData(
  options: FetchSelectedLaranjalOptions = {},
): Promise<LaranjalLevelData> {
  const [lab, ciexFurg, lastKnownLab] = await Promise.all([
    fetchLaranjalLevelData({ deadlineMs: options.deadlineMs }),
    fetchCiexFurgPelotasLevelData({ deadlineMs: options.deadlineMs }),
    fetchLastKnownLaranjalLevelData(),
  ]);

  return selectLaranjalLevelSource({ lab, ciexFurg, lastKnownLab });
}
