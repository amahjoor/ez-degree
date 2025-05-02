import * as React from "react";
import clsx from "clsx";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** Padding / text‑size preset */
  size?: "sm" | "md" | "lg";
}

/* -------------------------------------------------------------------------- */
/* Helper maps                                                                */
/* -------------------------------------------------------------------------- */

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-10 py-6 text-lg",
};

const VARIANT_CLASSES: Record<
  NonNullable<ButtonProps["variant"]>,
  string
> = {
  primary:
    "bg-primary-blue text-white hover:bg-primary-blue/90 focus-visible:ring-primary-blue",
  secondary:
    "bg-primary-green text-white hover:bg-primary-green/90 focus-visible:ring-primary-green",
  outline:
    "border border-primary-blue/40 text-primary-blue hover:bg-primary-blue/10 focus-visible:ring-primary-blue",
  ghost:
    "text-primary-blue hover:bg-primary-blue/10 focus-visible:ring-primary-blue",
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      size = "md",
      variant = "primary",
      type = "button",
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          // Base
          "inline-flex items-center justify-center rounded-full font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Dynamic
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          // External
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
