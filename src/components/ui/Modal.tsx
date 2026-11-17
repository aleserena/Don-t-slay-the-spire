import React, { useEffect } from "react";

export type Tone = "info" | "danger" | "accent" | "warning";

interface ModalProps {
  title: string;
  /** Color of the frame, by what the dialog is for */
  tone?: Tone;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A dialog over the current screen. Closes with its button, with Escape, or
 * by clicking outside it.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  tone = "info",
  onClose,
  children,
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="modal__panel"
        data-tone={tone}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};
