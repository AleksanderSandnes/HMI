import { Ionicons } from "@expo/vector-icons";
import { show } from "@hmi/core";
import { Text, View } from "react-native";

import { cn } from "../../lib/cn";
import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";
import type { DashboardModel } from "../../lib/useDashboardData";
import { WindDialFace } from "../charts/dials/WindDial";
import { GlassCard } from "../ui/GlassCard";

type IonName = keyof typeof Ionicons.glyphMap;

/**
 * `compact` — landscape phones: everything shrinks so the card fits the short
 * viewport. `rich` — portrait tablets: bigger type, a 2×2 metric grid beside
 * the dial and weekly-average sublines (mirrors the web tablet widget).
 */
export type WeatherSummaryVariant = "default" | "compact" | "rich";

function BigMetric({
  icon,
  color,
  label,
  value,
  unit,
  sub,
  variant,
}: {
  icon: IonName;
  color: string;
  label: string;
  value: string;
  unit: string;
  /** Secondary line (e.g. weekly average) — rich variant only. */
  sub?: string;
  variant: WeatherSummaryVariant;
}) {
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color={color} />
        <Text
          className={cn(
            "font-bold text-text-secondary",
            variant === "rich" ? "text-[13px]" : "text-[11px]",
          )}
        >
          {label}
        </Text>
      </View>
      <Text
        className={cn(
          "mt-1.5 font-extrabold leading-none text-text-primary",
          variant === "rich"
            ? "text-[40px]"
            : variant === "compact"
              ? "text-[26px]"
              : "text-[34px]",
        )}
      >
        {value}
        <Text className="text-[15px] font-bold text-text-muted"> {unit}</Text>
      </Text>
      {variant === "rich" && sub ? (
        <Text className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.3px] text-text-muted">
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function StatCol({
  icon,
  color,
  label,
  value,
  unit,
  sub,
  variant,
}: {
  icon: IonName;
  color: string;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  variant: WeatherSummaryVariant;
}) {
  return (
    <View className="min-w-0 flex-1 items-center">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={13} color={color} />
        <Text
          className={cn(
            "font-bold text-text-secondary",
            variant === "rich" ? "text-[13px]" : "text-[11px]",
          )}
        >
          {label}
        </Text>
      </View>
      <Text
        className={cn(
          "mt-1.5 font-extrabold text-text-primary",
          variant === "rich"
            ? "text-[28px]"
            : variant === "compact"
              ? "text-[20px]"
              : "text-[22px]",
        )}
      >
        {value}
        {unit ? <Text className="text-[10px] font-bold text-text-muted">{unit}</Text> : null}
      </Text>
      <Text
        className={cn(
          "mt-0.5 font-bold uppercase tracking-[0.3px] text-text-muted",
          variant === "rich" ? "text-[11.5px]" : "text-[10.5px]",
        )}
      >
        {sub}
      </Text>
    </View>
  );
}

/**
 * Metrics beside the dial. Default/compact: temperature + precipitation
 * stacked. Rich (portrait tablets): a 2×2 grid adding solar radiation and
 * feels-like so the taller card has no dead space.
 */
function DialSideMetrics({
  model,
  variant,
}: {
  model: DashboardModel;
  variant: WeatherSummaryVariant;
}) {
  const { colors } = useThemeColors();
  const { t } = useI18n();
  const { obs, m, feelsLike, wkAvg } = model;
  const temp = (
    <BigMetric
      icon="thermometer"
      color={colors.negative}
      label={t("dashboard.temperature")}
      value={show(m.temp)}
      unit="°C"
      sub={t("dashboard.avg", { value: `${show(wkAvg.temp)}°C` })}
      variant={variant}
    />
  );
  const precip = (
    <BigMetric
      icon="rainy"
      color={colors.skyTint}
      label={t("dashboard.precipitation")}
      value={show(m.precipRate, 1)}
      unit="mm/h"
      sub={`${t("dashboard.today")} ${show(m.precipTotal, 1)} mm`}
      variant={variant}
    />
  );
  if (variant !== "rich") {
    return (
      <View className={cn("flex-1 items-center", variant === "compact" ? "gap-3" : "gap-5")}>
        {temp}
        {precip}
      </View>
    );
  }
  return (
    <View className="min-w-0 flex-1 flex-row flex-wrap content-center gap-y-8">
      <View className="w-1/2 items-center">{temp}</View>
      <View className="w-1/2 items-center">{precip}</View>
      <View className="w-1/2 items-center">
        <BigMetric
          icon="sunny"
          color={colors.solarTint}
          label={t("dashboard.solarRadiation")}
          value={show(obs?.solarRadiation)}
          unit="W/m²"
          sub={t("dashboard.avg", { value: `${show(wkAvg.solar)} W/m²` })}
          variant={variant}
        />
      </View>
      <View className="w-1/2 items-center">
        <BigMetric
          icon="thermometer"
          color={colors.accentTint}
          label={t("dashboard.feelsLike")}
          value={show(feelsLike)}
          unit="°C"
          sub={`${t("dashboard.windChill")} ${show(m.windChill)}°C`}
          variant={variant}
        />
      </View>
    </View>
  );
}

/** UV / humidity / pressure row (all variants). */
function PrimaryStats({
  model,
  variant,
}: {
  model: DashboardModel;
  variant: WeatherSummaryVariant;
}) {
  const { colors } = useThemeColors();
  const { t } = useI18n();
  const { obs, m, wkAvg } = model;
  return (
    <View className="flex-row items-stretch">
      <StatCol
        icon="sunny"
        color={colors.solarTint}
        label={t("dashboard.uvIndex")}
        value={show(obs?.uv)}
        sub={t("dashboard.avg", { value: show(wkAvg.uv) })}
        variant={variant}
      />
      <View className="mx-3 w-px bg-glass-border" />
      <StatCol
        icon="water"
        color={colors.energyTint}
        label={t("dashboard.humidity")}
        value={show(obs?.humidity)}
        unit="%"
        sub={t("dashboard.avg", { value: `${show(wkAvg.humidity)}%` })}
        variant={variant}
      />
      <View className="mx-3 w-px bg-glass-border" />
      <StatCol
        icon="speedometer"
        color={colors.cyanTint}
        label={t("dashboard.pressure")}
        value={show(m.pressure)}
        unit="hPa"
        sub={t("dashboard.avg", { value: show(wkAvg.pressure) })}
        variant={variant}
      />
    </View>
  );
}

const CARD_CLS: Record<WeatherSummaryVariant, string> = {
  default: "gap-3 px-3.5 pb-6 pt-3.5",
  compact: "gap-2.5 px-3.5 pb-3.5 pt-3",
  rich: "gap-5 px-6 pb-7 pt-5",
};

const ROW_CLS: Record<WeatherSummaryVariant, string> = {
  default: "gap-3",
  compact: "gap-2",
  rich: "gap-0",
};

// Rich: the dial column is exactly 1/3 wide so the divider lines up with the
// first divider of the stat row below. Compact: explicit vertical padding
// keeps the dial off the card edge and its caption clear of the stat row.
const DIAL_COL_CLS: Record<WeatherSummaryVariant, string> = {
  default: "items-center",
  compact: "items-center py-1.5",
  rich: "w-1/3 flex-none items-center",
};

const DIAL_SIZE: Record<WeatherSummaryVariant, number> = {
  default: 150,
  compact: 104,
  rich: 180,
};

/** Focus dashboard weather panel: wind dial + temp/precip + UV/humidity/pressure. */
export function WeatherSummaryCard({
  model,
  variant = "default",
  dialSize,
}: {
  model: DashboardModel;
  variant?: WeatherSummaryVariant;
  /** Override the wind-dial diameter (tablet cards have room to spare). */
  dialSize?: number;
}) {
  const { obs, m } = model;
  return (
    <GlassCard strong className={cn("min-h-0 flex-1 justify-between", CARD_CLS[variant])}>
      <View className={cn("min-h-0 flex-1 flex-row items-center", ROW_CLS[variant])}>
        <View className={DIAL_COL_CLS[variant]}>
          <WindDialFace
            degrees={obs?.winddir}
            speed={m.windSpeed}
            gust={m.windGust}
            unit="km/h"
            size={dialSize ?? DIAL_SIZE[variant]}
          />
        </View>
        <View
          className={cn("w-px self-stretch bg-glass-border", variant === "rich" ? "mx-0" : "mx-1")}
        />
        <DialSideMetrics model={model} variant={variant} />
      </View>

      <PrimaryStats model={model} variant={variant} />
    </GlassCard>
  );
}

export default WeatherSummaryCard;
