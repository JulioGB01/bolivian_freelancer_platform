"use client";

// ⌘K / Ctrl+K command menu (cmdk): jump to an entrance or page, verify an agreement by number,
// switch language or mode. Any button can open it with openCommandMenu().
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, FilePlus2, Home, Languages, SearchCheck, ToggleLeft } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ENTRANCES, SWATCH } from "@/lib/entrance";
import { setLang, useT, type MsgKey } from "@/lib/i18n";
import { setMode, useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "bfe:open-command";

export function openCommandMenu() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function CommandMenu() {
  const { t, lang } = useT();
  const mode = useMode();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const id = query.trim().replace(/^#/, "");
  const isId = /^\d{1,9}$/.test(id);

  const pages: { href: string; label: MsgKey; icon: typeof Home }[] = [
    { href: "/", label: "nav.home", icon: Home },
    { href: "/como-funciona", label: "nav.how", icon: BookOpen },
    { href: "/verificar", label: "nav.verify", icon: SearchCheck },
    { href: "/app/nuevo", label: "nav.new", icon: FilePlus2 },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={t("nav.search")} description={t("cmd.placeholder")} className="border-ink sm:max-w-xl">
      <CommandInput placeholder={t("cmd.placeholder")} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t("cmd.empty")}</CommandEmpty>
        {isId && (
          <CommandGroup heading={t("nav.verify")}>
            <CommandItem value={`verify ${id}`} onSelect={() => go(`/verificar/${id}`)}>
              <SearchCheck />
              {t("cmd.verifyN", { n: id })}
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading={t("cmd.entrances")}>
          {ENTRANCES.map((e) => (
            <CommandItem key={e.id} value={`${t(e.name)} ${e.id}`} onSelect={() => go(e.href)}>
              <span className={cn("size-2.5", SWATCH[e.color].dot)} aria-hidden />
              {t(e.cta)}
              <CommandShortcut className="font-mono">{e.n}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("cmd.pages")}>
          {pages.map((p) => (
            <CommandItem key={p.href} value={t(p.label)} onSelect={() => go(p.href)}>
              <p.icon />
              {t(p.label)}
              <ArrowUpRight className="ml-auto opacity-40" />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("cmd.prefs")}>
          <CommandItem value="language idioma" onSelect={() => { setLang(lang === "es" ? "en" : "es"); setOpen(false); }}>
            <Languages />
            {t("cmd.lang")}
          </CommandItem>
          <CommandItem value="mode modo demo testnet" onSelect={() => setMode(mode === "demo" ? "testnet" : "demo")}>
            <ToggleLeft />
            {mode === "demo" ? t("cmd.toTestnet") : t("cmd.toDemo")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
