"use client"
import Main from "@/app/Main";
import { useTheme } from "@/context/ThemeContext";
const Page = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className="min-h-screen transition-colors"
    style={{
      backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#000000",
    }}>

        <Main />

    </div>
  );
};

export default Page;
