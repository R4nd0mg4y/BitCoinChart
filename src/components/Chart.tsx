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
      <div ref={chartContainerRef} className="w-full h-full" />
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
            <p>Giá cách đây {timeFrame}: ${price?.prevPrice}</p>
          </div>
        </div>
    </div>
  );
};

export default Chart;
