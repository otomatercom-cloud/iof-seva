import { Fragment, type ReactNode } from "react";
import { parseInline, type Inline } from "./markup";

function render(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return <Fragment key={i}>{n.v}</Fragment>;
      case "br": return <br key={i} />;
      case "b": return <strong key={i}>{render(n.c)}</strong>;
      case "i": return <em key={i}>{render(n.c)}</em>;
      case "u": return <u key={i}>{render(n.c)}</u>;
      case "a": return (
        <a key={i} href={n.href} className="underline underline-offset-2"
          {...(/^https?:/i.test(n.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{render(n.c)}</a>
      );
    }
  });
}

export function Inlines({ source }: { source: string }) {
  return <>{render(parseInline(source))}</>;
}
