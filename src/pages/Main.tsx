"use client";
import React, { useState } from "react";
import { cryptoCoins } from "@/utils/fetchApi";
import Chart from "@/components/Chart";
import { Dropdown } from "primereact/dropdown";
import Image from "next/image";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useTheme } from "@/context/ThemeContext";
type CryptoType = {
  name: string;
  code: string;
};
const Main = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType | null>({
    name: "BTCUSDT",
    code: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  });
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<{name:string} | null>(
    {name:"1m"}
  );
  const { isDarkMode } = useTheme();
  const cryptochoices = cryptoCoins.map((crypto) => ({
    name: crypto.cryptoName,
    code: crypto.cryptoImage,
  }));
  const timeFrameChoices = [
    { name: "1m" },
    { name: "5m"},
    { name: "30m"},
    { name: "1h" },
    { name: "4h" },
    { name: "1d"},
  ];
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold flex flex-row items-center justify-around">
        Bitcoin Chart
        <Image
          className="pl-2"
          width={32}
          height={32}
          src={selectedCrypto?.code || "/default-image.png"}
          alt="chose your coin"
        />
      </h1>
      <div className="flex flex-row w-full items-center justify-center space-x-2">
      <Dropdown
        value={selectedTimeFrame}
        onChange={(e) => setSelectedTimeFrame(e.value)}
        options={timeFrameChoices}
        optionLabel="name"
        placeholder="Select time frame"
        className="w-[15%] md:w-14rem mb-5"
        checkmark={true}
        highlightOnSelect={false}
      />
      <Dropdown
        value={selectedCrypto}
        onChange={(e) => setSelectedCrypto(e.value)}
        options={cryptochoices}
        optionLabel="name"
        placeholder="Select coin"
        className="w-[15%] md:w-14rem mb-5"
        checkmark={true}
        highlightOnSelect={false}
      />
      </div>
      <DarkModeToggle />
      <Chart
        darkMode={isDarkMode}
        cryptoName={selectedCrypto?.name || "BTCUSDT"}
        timeFrame={selectedTimeFrame?.name || "1m"}
      />
    </div>
  );
};

export default Main;
