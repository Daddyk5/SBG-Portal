import type { ReactNode } from "react";
import type { MemberProfile } from "@/lib/member";

/**
 * Applies a member's chosen theme (system/light/dark) and accent colour (red/blue/black & white)
 * to everything inside. The CSS in app/globals.css reacts to these data attributes.
 */
export function ThemeScope({
  theme,
  accent,
  children,
}: {
  theme: MemberProfile["theme"];
  accent: MemberProfile["accent"];
  children: ReactNode;
}) {
  return (
    <div className="themed" data-theme={theme === "system" ? undefined : theme} data-accent={accent}>
      {children}
    </div>
  );
}
