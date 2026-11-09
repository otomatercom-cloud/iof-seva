"use client";
import * as React from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;

export function DropdownContent({ className, align = "end", ...p }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        className={cn(
          "anim-pop z-50 min-w-52 rounded-xl border border-line bg-white p-1.5 shadow-pop",
          className,
        )}
        {...p}
      />
    </M.Portal>
  );
}

export function DropdownItem({ className, ...p }: React.ComponentProps<typeof M.Item>) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-brand-50 [&_svg]:size-4 [&_svg]:text-muted",
        className,
      )}
      {...p}
    />
  );
}

export const DropdownLabel = ({ className, ...p }: React.ComponentProps<typeof M.Label>) => (
  <M.Label className={cn("px-2.5 py-1.5 text-xs font-medium text-muted", className)} {...p} />
);
export const DropdownSeparator = () => <M.Separator className="my-1 h-px bg-line" />;
export const DropdownCheckbox = ({ className, children, ...p }: React.ComponentProps<typeof M.CheckboxItem>) => (
  <M.CheckboxItem
    className={cn(
      "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-brand-50",
      className,
    )}
    {...p}
  >
    <span className="flex size-4 items-center justify-center rounded border border-line data-[state=checked]:border-brand">
      <M.ItemIndicator>
        <span className="block size-2 rounded-sm bg-brand" />
      </M.ItemIndicator>
    </span>
    {children}
  </M.CheckboxItem>
);
