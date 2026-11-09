"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...p }: React.ComponentProps<typeof T.List>) {
  return (
    <T.List
      className={cn("flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]", className)}
      {...p}
    />
  );
}

export function TabsTrigger({ className, ...p }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px cursor-pointer whitespace-nowrap border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink data-[state=active]:border-brand data-[state=active]:text-brand-dark",
        className,
      )}
      {...p}
    />
  );
}

export function TabsContent({ className, ...p }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("anim-fade pt-5 focus-visible:outline-none", className)} {...p} />;
}
