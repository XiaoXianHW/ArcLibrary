import { SiteHeader } from "@/components/SiteHeader";
import { HeroSimple } from "@/components/Hero";

export default function LocaleHome() {
  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="flex-1">
        <HeroSimple />
      </main>
    </div>
  );
}
