"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  UTCTimestamp,
  HistogramSeries,
  CandlestickData,
} from "lightweight-charts";
import { GetCandles, GetLiveCandle } from "@/utils/fetchApi";
import { ISeriesApi } from "lightweight-charts";
import { Button } from "primereact/button";
import { unixToDate } from "@/utils/fetchApi";

type ChartProps = {
  darkMode?: boolean;
  cryptoName: string;
  timeFrame: string;
};
const Chart = ({ darkMode = false, cryptoName, timeFrame }: ChartProps) => {
  type ChartData = {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
  };
  type HistogramChartData = {
    time: UTCTimestamp;
    value: number;
  };
  type Price = {
    currentPrice: number;
    prevPrice: number;
  };

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [histogramChartData, setHistogramChartData] = useState<
    HistogramChartData[]
  >([]);
  const wsRef = useRef<WebSocket | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [candleSeries, setCandleSeries] =
    useState<ISeriesApi<"Candlestick"> | null>(null);
  const [volumeSeries, setVolumeSeries] =
    useState<ISeriesApi<"Histogram"> | null>(null);
  const [price, setPrice] = useState<Price | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      const newData = await GetCandles(timeFrame, cryptoName);

      const formattedData = newData.map((candle) => ({
        time: (candle.openTime / 1000) as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      const formattedHistogramData = newData.map((histogram) => ({
        time: (histogram.openTime / 1000) as UTCTimestamp,
        value: histogram.volume,
      }));

      setHistogramChartData(formattedHistogramData);
      setChartData(formattedData);
      setPrice(null);
    };

    fetchData();
  }, [cryptoName, timeFrame]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: darkMode ? "#1e1e1e" : "white",
        },
        textColor: darkMode ? "white" : "black",
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 600,
      rightPriceScale: {
        visible: true,
        borderColor: darkMode ? "#444" : "#ddd",
        ticksVisible: true,
      },
    });

    const timeScale = chart.timeScale();
    timeScale.applyOptions({
      timeVisible: true,
      secondsVisible: true,
    });

    const newCandleSeries = chart.addSeries(CandlestickSeries, {
      priceScaleId: "candles",
    });
    const newVolumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
    });

    chart.priceScale("candles").applyOptions({
      scaleMargins: {
        top: 0,
        bottom: 0.3,
      },
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    });
    const toolTipWidth = 80;
    const toolTipHeight = 80;
    const toolTipMargin = 15;

    const toolTip = document.createElement("div");
    toolTip.style.width = "150px";
    toolTip.style.height = "130px";
    toolTip.style.position = "absolute";
    toolTip.style.display = "none";
    toolTip.style.padding = "8px";
    toolTip.style.boxSizing = "border-box";
    toolTip.style.fontSize = "12px";
    toolTip.style.textAlign = "left";
    toolTip.style.zIndex = "1000";
    toolTip.style.top = "12px";
    toolTip.style.left = "12px";
    toolTip.style.pointerEvents = "none";
    toolTip.style.border = "1px solid";
    toolTip.style.borderRadius = "2px";
    toolTip.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
    toolTip.style.background = "white";
    toolTip.style.color = "black";
    toolTip.style.borderColor = "#2962FF";

    chartContainerRef.current.appendChild(toolTip);
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        !chartContainerRef.current ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        toolTip.style.display = "none";
      } else {
        // time will be in the same format that we supplied to setData.
        // thus it will be YYYY-MM-DD
        // const dateStr = param.time;
        toolTip.style.display = "block";
        const data = param.seriesData.get(newCandleSeries);
        const { open, high, low, close, time } = data as {
          open: number;
          high: number;
          low: number;
          close: number;
          time: UTCTimestamp
        };
        
        // Format lại tooltip
        toolTip.innerHTML = `
          <div style="font-size: 14px; margin: 4px 0px; color: black">Open: ${open.toFixed(2)}</div>
          <div style="font-size: 14px; color: black">High: ${high.toFixed(2)}</div>
          <div style="font-size: 14px; color: black">Low: ${low.toFixed(2)}</div>
          <div style="font-size: 14px; color: black">Close: ${close.toFixed(2)}</div>
          <div style="color: black; margin-top: 4px;">${unixToDate(time*1000)}</div>
        `;

        const coordinate = newCandleSeries.priceToCoordinate((high + low) / 2);
        let shiftedCoordinate = param.point.x - 50;
        if (coordinate === null) {
          return;
        }
        shiftedCoordinate = Math.max(
          0,
          Math.min(
            chartContainerRef.current.clientWidth - toolTipWidth,
            shiftedCoordinate
          )
        );
        const coordinateY =
          coordinate - toolTipHeight - toolTipMargin > 0
            ? coordinate - toolTipHeight - toolTipMargin
            : Math.max(
                0,
                Math.min(
                  chartContainerRef.current.clientHeight - toolTipHeight - toolTipMargin,
                  coordinate + toolTipMargin
                )
              );
        toolTip.style.left = shiftedCoordinate + "px";
        toolTip.style.top = coordinateY + "px";
      }
    });

    newCandleSeries.setData(chartData);

    newVolumeSeries.setData(histogramChartData);
    setCandleSeries(newCandleSeries);
    setVolumeSeries(newVolumeSeries);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [darkMode, chartData, histogramChartData]);

  useEffect(() => {
    if (!candleSeries) return;
    if (!volumeSeries) return;

    const wsUrl = GetLiveCandle(timeFrame, cryptoName);
    if (wsRef.current) {
      wsRef.current.close();
    }
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k) {
        const candle = data.k;
        const updatedCandle = {
          time: (candle.t / 1000) as UTCTimestamp,
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
        };
        const updatedHistogram = {
          time: (candle.t / 1000) as UTCTimestamp,
          value: parseFloat(candle.v),
        };

        candleSeries?.update(updatedCandle);
        volumeSeries?.update(updatedHistogram);
      }
    };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [candleSeries, cryptoName, timeFrame, volumeSeries]);

  return (
    <div className="w-full h-[300px] sm:h-[400px]">
      <div ref={chartContainerRef} className=" w-full h-full" id="container" />
      <div className="flex flex-row  items-center my-5">
        <Button
          label="Lấy giá Bitcoin"
          onClick={() => {
            const candles =
              candleSeries?.data() as CandlestickData<UTCTimestamp>[];
            setPrice({
              currentPrice: candles?.[candles.length - 1]?.close ?? 0,
              prevPrice: candles?.[candles.length - 2]?.close ?? 0,
            });
          }}
        />
        <div className="mx-5">
          <p>Giá hiện tại: ${price?.currentPrice}</p>
          <p>
            Giá cách đây {timeFrame}: ${price?.prevPrice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chart;
