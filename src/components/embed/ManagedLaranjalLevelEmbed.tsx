import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import { isWidgetBlockVisible, type WidgetContentDefinition } from "@/lib/widgets/widget-content";

import { LaranjalLevelEmbed } from "./LaranjalLevelEmbed";
import "./ManagedLaranjalLevelEmbed.css";

export function ManagedLaranjalLevelEmbed({
  data,
  content,
}: {
  data: LaranjalLevelData;
  content: WidgetContentDefinition;
}) {
  return (
    <div
      className="managed-laranjal-level"
      data-show-movement={isWidgetBlockVisible(content, "movement") ? "true" : "false"}
      data-show-chart={isWidgetBlockVisible(content, "chart") ? "true" : "false"}
      data-show-updated-at={isWidgetBlockVisible(content, "updated-at") ? "true" : "false"}
    >
      <LaranjalLevelEmbed data={data} />
    </div>
  );
}
