import ReactECharts from "echarts-for-react";
import { createLineChartOption } from "@/lib/charts/theme";
import { formatEur } from "@/lib/money";
import type { NetWorthPoint } from "@/db/repositories/networth";

interface NetWorthLineChartProps {
  data: NetWorthPoint[];
}

function formatLabel(iso: string): string {
  const [year, month] = iso.split("-");
  return `${month}/${year.slice(2)}`;
}

export function NetWorthLineChart({ data }: NetWorthLineChartProps) {
  const labels = data.map((d) => formatLabel(d.period));
  const values = data.map((d) => d.cents);
  const summary = `Vermögensentwicklung von ${formatEur(data[0]?.cents ?? 0)} bis ${formatEur(
    data[data.length - 1]?.cents ?? 0,
  )}`;

  return (
    <div>
      <div className="h-[100px]" role="img" aria-label={summary}>
        <ReactECharts
          option={createLineChartOption({ labels, values })}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>
      <span className="sr-only">{summary}</span>
    </div>
  );
}
