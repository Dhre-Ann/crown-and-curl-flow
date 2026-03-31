import { useState, useMemo, useEffect } from "react";
import type { CatalogStyle, StyleCustomizationOption } from "@/types/style";

const OPTION_TYPE_ORDER = ["size", "length", "color"];

function groupByType(options: StyleCustomizationOption[]): Record<string, StyleCustomizationOption[]> {
  return options.reduce<Record<string, StyleCustomizationOption[]>>((acc, o) => {
    const key = o.optionType;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});
}

function orderedCustomizationTypes(style: CatalogStyle): string[] {
  const types = [...new Set(style.customizationOptions.map((o) => o.optionType))];
  return types.sort((a, b) => {
    const ia = OPTION_TYPE_ORDER.indexOf(a);
    const ib = OPTION_TYPE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function humanizeOptionType(optionType: string): string {
  if (optionType === "size") return "Part size";
  if (optionType === "length") return "Length";
  if (optionType === "color") return "Hair color";
  return optionType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function usePriceCalculator(style: CatalogStyle) {
  const grouped = useMemo(
    () => groupByType(style.customizationOptions),
    [style.customizationOptions]
  );

  const types = useMemo(() => orderedCustomizationTypes(style), [style]);

  const [selectedIdByType, setSelectedIdByType] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const t of types) {
      const opts = grouped[t];
      if (opts?.length) next[t] = opts[0].id;
    }
    setSelectedIdByType(next);
  }, [style.id, style.customizationOptions, grouped, types]);

  const setSelectedForType = (optionType: string, optionId: string) => {
    setSelectedIdByType((prev) => ({ ...prev, [optionType]: optionId }));
  };

  const totalPrice = useMemo(() => {
    let total = style.basePrice;
    for (const id of Object.values(selectedIdByType)) {
      const opt = style.customizationOptions.find((o) => o.id === id);
      if (opt) total += opt.priceModifier;
    }
    return total;
  }, [style.basePrice, style.customizationOptions, selectedIdByType]);

  function summaryNameForType(optionType: string): string {
    const id = selectedIdByType[optionType];
    return style.customizationOptions.find((o) => o.id === id)?.name ?? "";
  }

  const partSize = summaryNameForType("size");
  const length = summaryNameForType("length");
  const color = summaryNameForType("color");

  return {
    types,
    grouped,
    humanizeOptionType,
    selectedIdByType,
    setSelectedForType,
    totalPrice,
    partSize,
    length,
    color,
  };
}
