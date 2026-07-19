import type { EChartsOption } from "echarts";
import { formatEur } from "@/lib/money";

export const chartColors = {
  petrol: "#123138",
  petrolLight: "#1d4750",
  sage: "#6f9a6d",
  brick: "#b6503a",
  gold: "#b79a5b",
  slate: "#6b7a80",
};

interface LineSeriesInput {
  labels: string[];
  values: number[];
  name?: string;
}

/** D2 Standard/Groß: beschriftete Y-Achse, Hover-Tooltip je Datenpunkt, echte Datenpunkte. */
export function createLineChartOption({ labels, values, name }: LineSeriesInput): EChartsOption {
  return {
    grid: { left: 56, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: chartColors.slate } },
      axisLabel: { color: chartColors.slate, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: chartColors.slate,
        fontSize: 11,
        formatter: (v: number) => formatEur(v),
      },
      splitLine: { lineStyle: { color: "#e7e0d0" } },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v) => formatEur(Number(v)),
    },
    series: [
      {
        name,
        type: "line",
        data: values,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: chartColors.petrol, width: 2 },
        itemStyle: { color: chartColors.petrol },
        areaStyle: { color: "rgba(18, 49, 56, 0.08)" },
      },
    ],
  };
}

/** D2 Sparkline: keine Achsen, kein Hover, rein dekorativ. */
export function createSparklineOption(values: number[]): EChartsOption {
  const rising = values.length >= 2 && values[values.length - 1] >= values[0];
  return {
    grid: { left: 2, right: 2, top: 2, bottom: 2 },
    xAxis: { type: "category", show: false, data: values.map((_, i) => i) },
    yAxis: { type: "value", show: false, min: "dataMin", max: "dataMax" },
    tooltip: { show: false },
    series: [
      {
        type: "line",
        data: values,
        smooth: false,
        symbol: "none",
        silent: true,
        lineStyle: { color: rising ? chartColors.sage : chartColors.brick, width: 1.5 },
      },
    ],
  };
}
