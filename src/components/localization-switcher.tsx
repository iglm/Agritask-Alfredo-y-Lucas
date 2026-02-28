'use client';

import { useLocalization } from '@/context/localization-context';
import { currencies, appLanguages } from '@/lib/currencies';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages, Coins } from 'lucide-react';

export function LocalizationSwitcher() {
  const { language, setLanguage, currency, setCurrency } = useLocalization();

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Coins className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Change currency</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currencies.map((c) => (
            <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} disabled={c.code === currency.code}>
              {c.name} ({c.code})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Languages className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {appLanguages.map((lang) => (
            <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} disabled={lang.code === language}>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
