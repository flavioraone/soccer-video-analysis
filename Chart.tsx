/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {max, min} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import React, {useEffect, useRef, useState} from 'react';
import {timeToSecs} from './utils';
import { useTranslation } from './i18n.jsx';

interface ChartDataPoint {
  time: string;
  value: number;
  text?: string;
  objects?: string[];
}

interface ChartProps {
  data: ChartDataPoint[];
  yLabel: string;
  jumpToTimecode: (time: number, itemKeySuffix: string | number) => void;
  activeClipKey?: string | null;
  onDownloadClick: (time: number, itemKeySuffix: string | number) => void;
  isClippingGlobal?: boolean;
  canDownload?: boolean; // New prop
}

export default function Chart({data, yLabel, jumpToTimecode, activeClipKey, onDownloadClick, isClippingGlobal, canDownload = true}: ChartProps) {
  const { t } = useTranslation();
  const chartRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const margin = 55;
  const xMax = width;
  const yMax = height - margin;
  const xScale = scaleBand()
    .range([margin + 10, xMax])
    .domain(data.map((d) => d.time))
    .padding(0.2);

  const vals = data.map((d) => d.value);
  const yScale = scaleLinear()
    .domain([min(vals) ?? 0, max(vals) ?? 10])
    .nice()
    .range([yMax, margin]);

  const yTicks = yScale.ticks(Math.floor(height / 70));

  const lineGen = line<ChartDataPoint>()
    .x((d) => xScale(d.time) ?? 0)
    .y((d) => yScale(d.value));

  useEffect(() => {
    const setSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
        setHeight(chartRef.current.clientHeight);
      }
    };

    setSize();
    window.addEventListener('resize', setSize);
    return () => window.removeEventListener('resize', setSize);
  }, []);

  if (!data || data.length === 0) {
    return <div className="chartPlaceholder">{t('chart.noData')}</div>;
  }

  return (
    <svg className="lineChart" ref={chartRef}>
      <g className="axisLabels" transform={`translate(0 ${0})`}>
        {yTicks.map((tick) => {
          const y = yScale(tick);

          return (
            <g key={tick} transform={`translate(0 ${y})`}>
              <text x={margin - 10} dy="0.25em" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className="axisLabels timeLabels"
        transform={`translate(0 ${yMax + 40})`}>
        {data.map(({time}, i) => {
          const itemKeySuffix = `chart-time-${i}`;
          return (
            <text
              key={itemKeySuffix}
              x={xScale(time)}
              role="button"
              tabIndex={0}
              onClick={() => jumpToTimecode(timeToSecs(time), itemKeySuffix)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpToTimecode(timeToSecs(time), itemKeySuffix);}}
              aria-label={t('chart.jumpToTimeLabel', { time })}
              >
              {time.length > 5 ? time.replace(/^00:/, '') : time}
            </text>
          );
        })}
      </g>

      <g>
        <path d={lineGen(data) || undefined} />
      </g>

      <g>
        {data.map(({time, value, text}, i) => {
          const cx = xScale(time);
          if (cx === undefined) return null;
          const itemKeySuffix = `chart-item-${i}`;
          const secs = timeToSecs(time);
          const showDownloadButton = canDownload && activeClipKey === itemKeySuffix;

          // Approximate width of the download button text + icon for positioning
          const approxButtonWidth = 150;
          const textAnchor = cx > width - margin - approxButtonWidth ? 'end' : 'start';
          const textDx = textAnchor === 'end' ? -5 : 5;
          const buttonXOffset = textAnchor === 'end' ? -approxButtonWidth : 0;


          return (
            <g
              key={itemKeySuffix}
              className="dataPoint"
              role="button"
              tabIndex={0}
              onClick={() => jumpToTimecode(secs, itemKeySuffix)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') jumpToTimecode(secs, itemKeySuffix);}}
              aria-label={t('chart.jumpToDataPointLabel', { time, value })}
            >
              <circle cx={cx} cy={yScale(value)} r={4} />
              <text x={cx} y={yScale(value) - 12} textAnchor="middle" aria-hidden="true">
                {value}
              </text>
              {showDownloadButton && (
                 <foreignObject x={cx + buttonXOffset} y={yScale(value) - 40} width={approxButtonWidth} height={30}>
                    <button
                        className="button downloadClipButton chartDownloadButton"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadClick(secs, itemKeySuffix);
                        }}
                        disabled={isClippingGlobal}
                        aria-label={t('analysis.downloadClipLabel', {time})}
                    >
                        <span className="icon">download</span> {t('analysis.downloadClip')}
                    </button>
                 </foreignObject>
              )}
            </g>
          );
        })}
      </g>

      <text
        className="axisTitle"
        x={margin}
        y={-width + margin}
        transform="rotate(90)">
        {yLabel}
      </text>
    </svg>
  );
}