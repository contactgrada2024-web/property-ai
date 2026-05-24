import { useI18n, type Lang } from "@/lib/i18n";

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n();

  const options: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-card/60 border border-border/50 rounded-lg p-0.5 text-[10px] font-semibold uppercase tracking-wider">
      {options.map((opt, i) => (
        <button
          key={opt.code}
          onClick={() => setLang(opt.code)}
          className={`px-2 py-1 rounded transition-all ${
            lang === opt.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch to ${opt.code === "en" ? t("english") : t("spanish")}`}
          title={opt.code === "en" ? t("english") : t("spanish")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
