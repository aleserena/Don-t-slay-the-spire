import React from "react";
import { useShallow } from "zustand/react/shallow";
import { BRANDING } from "../config/branding";
import { useGameStore } from "../store/gameStore";
import { MapNode, NodeType } from "../types/map";
import { MAP_WIDTH } from "../utils/mapGeneration";
import { UnifiedHeader } from "./UnifiedHeader";
import { asButton } from "./ui/asButton";
import { NODE_ICON, NODE_LABEL } from "./ui/icons";

/** Size of one grid cell of the map, in pixels (matches `--cell`). */
const CELL = 100;

/** The map of the run: the player picks the next node on their route. */
export const MapView: React.FC = () => {
  const { map, selectNode } = useGameStore(
    useShallow((state) => ({
      map: state.map,
      selectNode: state.selectNode,
    })),
  );

  if (!map) return null;

  const maxFloor = Math.max(...map.nodes.map((node) => node.y));
  // The first floor is at the bottom
  const rowOf = (node: MapNode) => maxFloor - node.y;
  const centre = (node: MapNode) => ({
    x: node.x * CELL + CELL / 2,
    y: rowOf(node) * CELL + CELL / 2,
  });
  const byId = new Map(map.nodes.map((node) => [node.id, node]));

  const describeState = (node: MapNode) =>
    node.completed
      ? "completed"
      : node.available
        ? "available"
        : "not reachable yet";

  return (
    <main className="page" aria-label="Map">
      <UnifiedHeader />

      <div className="map">
        <h1 className="page__title">
          {BRANDING.mapName} - Floor {map.floor + 1}
        </h1>

        <div
          className="map__board"
          style={
            {
              "--columns": MAP_WIDTH,
              "--rows": maxFloor + 1,
            } as React.CSSProperties
          }
        >
          <svg className="map__lines" aria-hidden="true">
            {map.nodes.flatMap((node) =>
              node.connections.map((connectionId) => {
                const target = byId.get(connectionId);
                if (!target) return null;
                const from = centre(node);
                const to = centre(target);
                return (
                  <line
                    key={`${node.id}-${connectionId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                  />
                );
              }),
            )}
          </svg>

          {map.nodes.map((node) => {
            const selectable = node.available && !node.completed;
            return (
              <div
                key={node.id}
                className={[
                  "map-node",
                  selectable && "is-available",
                  node.completed && "is-completed",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-node={node.type}
                style={
                  { "--x": node.x, "--row": rowOf(node) } as React.CSSProperties
                }
                {...asButton(() => selectNode(node.id), {
                  disabled: !selectable,
                  label: `${node.type} node, floor ${node.y + 1}, ${describeState(
                    node,
                  )}`,
                })}
              >
                <span className="map-node__icon" aria-hidden="true">
                  {NODE_ICON[node.type]}
                </span>
                <span className="map-node__label">{NODE_LABEL[node.type]}</span>
                {node.completed && (
                  <span className="map-node__done" aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <aside className="panel map__legend" aria-label="Legend">
          <h2 className="panel__title">Legend</h2>
          <ul className="map__legend-list">
            {Object.values(NodeType).map((type) => (
              <li key={type}>
                <span aria-hidden="true">{NODE_ICON[type]}</span>
                {NODE_LABEL[type]}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
};
