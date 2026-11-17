import React from "react";
import { Relic } from "../../types/game";
import { asButton } from "./asButton";
import { ICON } from "./icons";

interface RelicTileProps {
  relic: Relic;
  size?: "normal" | "large";
  /** Shows the rarity under the name */
  showRarity?: boolean;
  /** Price tag, for shops */
  price?: number;
  affordable?: boolean;
  sold?: boolean;
  disabled?: boolean;
  /** Makes the tile a button */
  onActivate?: () => void;
  children?: React.ReactNode;
}

/** A relic: its name, what it does, and its rarity as the frame color. */
export const RelicTile: React.FC<RelicTileProps> = ({
  relic,
  size = "normal",
  showRarity = false,
  price,
  affordable = true,
  sold = false,
  disabled = false,
  onActivate,
  children,
}) => (
  <div
    className={sold ? "relic is-sold" : "relic"}
    data-rarity={relic.rarity}
    data-size={size}
    {...(onActivate
      ? asButton(onActivate, {
          disabled,
          label: `${relic.name}. ${relic.description}${
            price !== undefined ? ` Price: ${price} gold.` : ""
          }${sold ? " Sold." : ""}`,
        })
      : {})}
  >
    {price !== undefined && (
      <span className="card__price" data-affordable={affordable}>
        {price} {ICON.gold}
      </span>
    )}
    <div className="relic__name">{relic.name}</div>
    {showRarity && <div className="relic__rarity">{relic.rarity}</div>}
    <div className="relic__text">{relic.description}</div>
    {children}
    {sold && <div className="card__sold">SOLD</div>}
  </div>
);
