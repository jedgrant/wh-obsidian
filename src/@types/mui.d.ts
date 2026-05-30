/**
 * MUI type augmentations for the Obsidian plugin.
 * Mirrors the declarations in apps/word-addin/src/@types/mui.d.ts so shared
 * packages (e.g. @writinghabit/ui) compile correctly here too.
 *
 * IMPORTANT: The top-level import makes this a module file, which means
 * all `declare module` blocks are augmentations (merged), not replacements.
 */
import type { CSSProperties } from "react";

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    character: true;
    emotion: true;
    setting: true;
    structural: true;
    pov: true;
    custom: true;
    tertiary: true;
    grey: true;
    green: true;
    yellow: true;
    orange: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    tertiary: true;
    blue: true;
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    "text-sm": CSSProperties;
    "text-md": CSSProperties;
    "text-lg": CSSProperties;
    "text-xl": CSSProperties;
    "text-2xl": CSSProperties;
    "text-3xl": CSSProperties;
    "text-4xl": CSSProperties;
    "text-5xl": CSSProperties;
    "text-6xl": CSSProperties;
  }
  interface TypographyVariantsOptions {
    "text-sm"?: CSSProperties;
    "text-md"?: CSSProperties;
    "text-lg"?: CSSProperties;
    "text-xl"?: CSSProperties;
    "text-2xl"?: CSSProperties;
    "text-3xl"?: CSSProperties;
    "text-4xl"?: CSSProperties;
    "text-5xl"?: CSSProperties;
    "text-6xl"?: CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    "text-sm": true;
    "text-md": true;
    "text-lg": true;
    "text-xl": true;
    "text-2xl": true;
    "text-3xl": true;
    "text-4xl": true;
    "text-5xl": true;
    "text-6xl": true;
  }
}

