/**
 * Shared interface pieces. They carry no game content and take their look
 * from `src/styles/theme.css`.
 */
import React from "react";

type ButtonVariant = "neutral" | "primary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  large?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "neutral",
  large = false,
  className,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={[
      "btn",
      variant !== "neutral" && `btn--${variant}`,
      large && "btn--large",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
);

interface ScreenProps {
  /** Announced to screen readers as the name of the screen. */
  label: string;
  children: React.ReactNode;
}

/** A full-page screen with its content centred. */
export const Screen: React.FC<ScreenProps> = ({ label, children }) => (
  <main className="screen" aria-label={label}>
    {children}
  </main>
);

interface StatProps {
  label: string;
  value: React.ReactNode;
}

/** A labelled number, e.g. in a run summary. */
export const Stat: React.FC<StatProps> = ({ label, value }) => (
  <div className="stat">
    <div className="stat__label">{label}</div>
    <div className="stat__value">{value}</div>
  </div>
);

export const StatGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="stat-grid">{children}</div>;
