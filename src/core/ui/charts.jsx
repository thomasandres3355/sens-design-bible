import { T } from "@core/theme/theme";

const fmt = (v, decimals = 1) => {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v < 0 ? "(" : "") + "$" + (abs / 1e9).toFixed(decimals) + "B" + (v < 0 ? ")" : "");
  if (abs >= 1e6) return (v < 0 ? "(" : "") + "$" + (abs / 1e6).toFixed(decimals) + "M" + (v < 0 ? ")" : "");
  if (abs >= 1e3) return (v < 0 ? "(" : "") + "$" + (abs / 1e3).toFixed(decimals) + "K" + (v < 0 ? ")" : "");
  return "$" + v.toFixed(decimals);
};

// ─── SVG Line Chart with target & threshold lines ───
export const LineChart = ({ series, labels, height = 200, width = "100%", showGrid = true, yFormat, targetLine, thresholdLine, targetLabel, thresholdLabel }) => {
  const allValues = series.flatMap(s => s.data.filter(v => v != null));
  if (targetLine != null) allValues.push(targetLine);
  if (thresholdLine != null) allValues.push(thresholdLine);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const svgW = 800;
  const svgH = height;
  const padL = 70, padR = 20, padT = 20, padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toX = (i, len) => padL + (i / (len - 1)) * plotW;
  const toY = (v) => padT + plotH - ((v - min) / range) * plotH;

  const yTicks = 5;
  const yFmt = yFormat || (v => fmt(v, 1));

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width, height: "auto" }}>
      {showGrid && Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = min + (range / yTicks) * i;
        const y = toY(v);
        return <g key={i}>
          <line x1={padL} x2={svgW - padR} y1={y} y2={y} stroke={T.border} strokeWidth=".5" />
          <text x={padL - 8} y={y + 4} textAnchor="end" fill={T.textDim} fontSize="10">{yFmt(v)}</text>
        </g>;
      })}
      {min < 0 && <line x1={padL} x2={svgW - padR} y1={toY(0)} y2={toY(0)} stroke={T.textDim} strokeWidth="1" strokeDasharray="4,3" />}

      {/* Target line — dashed green */}
      {targetLine != null && (
        <g>
          <line x1={padL} x2={svgW - padR} y1={toY(targetLine)} y2={toY(targetLine)} stroke={T.green} strokeWidth="1.5" strokeDasharray="6,4" opacity={0.8} />
          <text x={svgW - padR + 4} y={toY(targetLine) + 4} fill={T.green} fontSize="9" fontWeight="600">{targetLabel || `Target: ${yFmt(targetLine)}`}</text>
        </g>
      )}

      {/* Threshold / fail line — dashed red */}
      {thresholdLine != null && (
        <g>
          <line x1={padL} x2={svgW - padR} y1={toY(thresholdLine)} y2={toY(thresholdLine)} stroke={T.danger} strokeWidth="1.5" strokeDasharray="4,3" opacity={0.7} />
          <text x={svgW - padR + 4} y={toY(thresholdLine) + 4} fill={T.danger} fontSize="9" fontWeight="600">{thresholdLabel || `Fail: ${yFmt(thresholdLine)}`}</text>
        </g>
      )}

      {series.map((s, si) => {
        const pts = s.data.map((v, i) => v != null ? `${toX(i, s.data.length)},${toY(v)}` : null).filter(Boolean);
        return <polyline key={si} points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />;
      })}
      {labels && labels.filter((_, i) => i % Math.ceil(labels.length / 12) === 0).map((l, i, arr) => (
        <text key={i} x={toX(i * Math.ceil(labels.length / 12), labels.length)} y={svgH - 4} textAnchor="middle" fill={T.textDim} fontSize="9">{l}</text>
      ))}

      {/* Legend */}
      {series.length > 1 && series.map((s, si) => (
        <g key={`legend-${si}`}>
          <line x1={padL + si * 120} x2={padL + si * 120 + 14} y1={8} y2={8} stroke={s.color} strokeWidth="2" />
          <text x={padL + si * 120 + 18} y={11} fill={T.textMid} fontSize="9">{s.label || `Series ${si + 1}`}</text>
        </g>
      ))}
    </svg>
  );
};
