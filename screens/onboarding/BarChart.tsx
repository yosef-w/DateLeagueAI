import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { styles } from './styles';

type ChartItem = { label: string; value: number };

export default function BarChart({
  width,
  height,
  items,
  yLabel,
}: {
  width: number;
  height: number;
  items: ChartItem[];
  yLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(0);
  const max = Math.max(...items.map((d) => d.value), 1);
  const padding = 12;
  const barGap = 10;
  const barCount = items.length;
  const barWidth = (width - padding * 2 - barGap * (barCount - 1)) / barCount;

  return (
    <View style={styles.chartWrap}>
      {!!yLabel && <Text style={styles.chartLabel}>{yLabel}</Text>}
      <Svg width={width} height={height}>
        {items.map((d, i) => {
          const h = (d.value / max) * (height - 40);
          const x = padding + i * (barWidth + barGap);
          const y = height - h - 20;
          const isActive = i === active;

          return (
            <Pressable
              key={d.label + i}
              onPress={async () => {
                setActive(i);
                await Haptics.selectionAsync();
              }}
              style={{ position: 'absolute', left: x, top: y, width: barWidth, height: h }}
            >
              <Rect
                x={0}
                y={0}
                width={barWidth}
                height={h}
                rx={6}
                ry={6}
                fill={isActive ? '#60a5fa' : 'rgba(255,255,255,0.25)'}
              />
            </Pressable>
          );
        })}
      </Svg>
      <View style={[styles.chartLabelsRow, { width }]}> 
        {items.map((d, i) => (
          <Pressable
            key={d.label + i}
            onPress={async () => {
              setActive(i);
              await Haptics.selectionAsync();
            }}
            style={styles.chartLabelItem}
          >
            <Text style={[styles.chartXLabel, i === active && styles.chartXLabelActive]} numberOfLines={1}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {active != null && (
        <Text style={styles.chartValue}>
          {items[active].label}: {items[active].value}%
        </Text>
      )}
      <Text style={styles.chartFootnote}>Tap bars to highlight</Text>
    </View>
  );
}
