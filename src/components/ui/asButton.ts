import React from "react";

/**
 * Makes a non-button element behave like a button for keyboard and screen
 * reader users: focusable, activated with Enter or Space.
 */
export const asButton = (
  onActivate: () => void,
  options: { disabled?: boolean; label: string },
): React.HTMLAttributes<HTMLElement> => ({
  role: "button",
  tabIndex: options.disabled ? -1 : 0,
  "aria-label": options.label,
  "aria-disabled": options.disabled || undefined,
  onClick: () => {
    if (!options.disabled) onActivate();
  },
  onKeyDown: (event: React.KeyboardEvent) => {
    if (options.disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  },
});
