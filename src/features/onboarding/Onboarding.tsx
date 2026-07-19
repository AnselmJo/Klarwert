import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StepDots } from "@/components/StepDots";
import { X } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUiStore } from "@/stores/uiStore";
import { createPerson } from "@/db/repositories/persons";

const CURRENCIES = ["EUR", "USD", "CHF", "GBP"];

type Step = 0 | 1 | 2;

export function Onboarding() {
  const [step, setStep] = useState<Step>(0);
  const [primaryName, setPrimaryName] = useState("");
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const [currency, setCurrency] = useState("EUR");
  const [submitting, setSubmitting] = useState(false);

  const setCurrencySetting = useSettingsStore((s) => s.setCurrency);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const requestOpenCreateAsset = useUiStore((s) => s.requestOpenCreateAsset);

  async function handleSkip() {
    setSubmitting(true);
    try {
      await createPerson({ name: "Ich" });
      await completeOnboarding();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePersonsSubmit() {
    const names = [primaryName, ...extraNames].map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    setSubmitting(true);
    try {
      await setCurrencySetting(currency);
      for (const name of names) {
        await createPerson({ name });
      }
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAccount() {
    setSubmitting(true);
    try {
      await completeOnboarding();
      requestOpenCreateAsset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-[480px] rounded-standard border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <StepDots total={3} current={step} variant="cumulative" />
        </div>

        {step === 0 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-2xl text-charcoal">
                Willkommen bei Klarwert
              </h1>
              <p className="mt-2 text-sm text-slate">
                100 % lokal – deine Finanzdaten bleiben auf diesem Gerät. Kein
                Login, keine Cloud.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setStep(1)} disabled={submitting}>
                Los geht's
              </Button>
              <Button variant="ghost" onClick={handleSkip} disabled={submitting}>
                Überspringen
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="ghost" disabled className="w-full">
                      Mit Demo-Daten erkunden
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Demo-Modus folgt in einer späteren Phase.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {step === 1 && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void handlePersonsSubmit();
            }}
          >
            <div>
              <h1 className="font-heading text-xl text-charcoal">Wer bist du?</h1>
              <p className="mt-1 text-sm text-slate">
                Personen dienen nur der Zuordnung, es gibt keine Zugriffsrechte.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primary-name">Dein Name</Label>
              <Input
                id="primary-name"
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                required
                maxLength={60}
                autoFocus
              />
            </div>

            {extraNames.map((name, i) => (
              <div className="flex items-end gap-2" key={i}>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`extra-name-${i}`}>Weitere Person</Label>
                  <Input
                    id={`extra-name-${i}`}
                    value={name}
                    maxLength={60}
                    onChange={(e) => {
                      const next = [...extraNames];
                      next[i] = e.target.value;
                      setExtraNames(next);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Weitere Person entfernen"
                  onClick={() => setExtraNames(extraNames.filter((_, idx) => idx !== i))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExtraNames([...extraNames, ""])}
            >
              + weitere Person
            </Button>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Währung</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !primaryName.trim()}>
              Weiter
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-xl text-charcoal">
                Leg dein erstes Konto an
              </h1>
              <p className="mt-2 text-sm text-slate">
                Damit Klarwert deine Finanzen anzeigen kann, brauchst du
                mindestens ein Konto oder einen Vermögenswert.
              </p>
            </div>
            <Button className="w-full" onClick={handleCreateAccount} disabled={submitting}>
              Konto anlegen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
