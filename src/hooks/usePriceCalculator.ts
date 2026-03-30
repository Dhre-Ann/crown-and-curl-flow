import { useState, useMemo } from "react";
import type { HairStyle } from "@/data/mockStyles";

export function usePriceCalculator(style: HairStyle) {
  const [partSize, setPartSize] = useState(style.partSizes[1]?.label || style.partSizes[0].label);
  const [length, setLength] = useState(style.lengths[0]);
  const [color, setColor] = useState(style.colors[0].name);

  const selectedPartPrice = style.partSizes.find(p => p.label === partSize)?.price || 0;
  const selectedColorExtra = style.colors.find(c => c.name === color)?.extraCost || 0;

  const totalPrice = useMemo(
    () => style.basePrice + selectedPartPrice + selectedColorExtra,
    [style.basePrice, selectedPartPrice, selectedColorExtra]
  );

  return {
    partSize, setPartSize,
    length, setLength,
    color, setColor,
    totalPrice,
    selectedPartPrice,
    selectedColorExtra,
  };
}
