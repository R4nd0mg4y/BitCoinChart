import { useTheme } from "@/context/ThemeContext";

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors m-2"
    >
      {isDarkMode ? "🌙 Tắt chế độ tối" : "☀️ Bật chế độ tối"}
    </button>
  );
};

export default DarkModeToggle;
