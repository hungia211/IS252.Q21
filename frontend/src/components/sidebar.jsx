import { useState, useEffect } from "react";
import {
  Home,
  Database,
  BarChart3,
  Layers,
  GitBranch,
  ChevronDown,
  ChevronRight
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

export default function Layout() {
  const [openMenus, setOpenMenus] = useState({});
  const [activeItem, setActiveItem] = useState("/");
  

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

const handleNavigate = (path) => {
  setActiveItem(path);
  navigate(path);
};

  const toggleMenu = (key) => {
  setOpenMenus(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};

  const isActive = (key) => activeItem === key;

  // style chung
  const menuClass =
    "flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer";

  const activeClass =
    "bg-[#2d3b52] text-yellow-400 font-semibold border-l-4 border-[#FDE2CA]";

  const inactiveClass =
    "text-gray-700 hover:bg-[#2d3b52] hover:text-white";

  return (
    <div className="flex w-[280px] bg-[#FDE2CA] flex-col py-4 h-full">

      {/* Title */}
      <div className="flex items-center gap-3 text-black font-bold text-xl mb-4 px-4">
        <span>Home</span>
      </div>

      <div className="flex flex-col w-full gap-1">

        {/* Trang chủ */}
        <div
          onClick={() => handleNavigate("/")}
          className={`${menuClass} ${isActive("/") ? activeClass : inactiveClass}`}
        >
          <Home size={16} />
          Trang chủ
        </div>

        {/* Tiền xử lý */}
        <div
          onClick={() => handleNavigate("/preprocess")}
          className={`${menuClass} ${isActive("/preprocess") ? activeClass : inactiveClass}`}
        >
          <BarChart3 size={16} />
          Tiền xử lý dữ liệu
        </div>

        {/* Luật kết hợp */}
        <div
          onClick={() => handleNavigate("/association")}
          className={`${menuClass} ${isActive("/association") ? activeClass : inactiveClass}`}
        >
          <Layers size={16} />
          Tập phổ biến và Luật kết hợp
        </div>

        {/* Phân lớp */}
        <div className="flex flex-col gap-1">

          <button
            onClick={() => {
              setActiveItem("classification");
              toggleMenu("classification");
            }}
            className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all
              ${isActive("classification") ? activeClass : "hover:bg-[#2d3b52] hover:text-white"}
            `}
          >
            <span className="flex items-center gap-3">
              <Database size={16} />
              Phân lớp
            </span>

            {openMenus.classification ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          {/* Submenu */}
          {openMenus.classification && (
            <div className="flex flex-col ml-6 space-y-1 mt-1">

              <div
                onClick={() => handleNavigate("/bayes")}
                className={`${menuClass} ${
                  isActive("/bayes")
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                }`}
              >
                Bayes
              </div>

              <div
                onClick={() => handleNavigate("/laplace")}
                className={`${menuClass} ${
                  isActive("/laplace")
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                }`}
              >
                Laplace
              </div>

              {/* Cây quyết định */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setActiveItem("decisionTree");
                    toggleMenu("decisionTree");
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-[#2d3b52]
                    ${isActive("decisionTree") ? activeClass : "hover:text-white"}
                  `}
                >
                  <span className="flex items-center gap-3">
                    Cây quyết định
                  </span>

                  {openMenus.decisionTree ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {openMenus.decisionTree && (
                  <div className="flex flex-col ml-6 space-y-1 mt-1">

                    <div
                      onClick={() => handleNavigate("/gini")}
                      className={`${menuClass} ${
                        isActive("/gini")
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                      }`}
                    >
                    <span className="w-2 h-2 bg-current rounded-full"></span>
                      Gini
                    </div>

                    <div
                      onClick={() => handleNavigate("/gain")}
                      className={`${menuClass} ${
                        isActive("/gain")
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                      }`}
                    >
                    <span className="w-2 h-2 bg-current rounded-full"></span>
                      Gain
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Tập thô */}
        <div
          onClick={() => handleNavigate("/raw")}
          className={`${menuClass} ${isActive("/raw") ? activeClass : inactiveClass}`}
        >
          <Layers size={16} />
          Tập thô
        </div>

        {/* Gom cụm */}
        <div className="flex flex-col gap-1">

          <button
            onClick={() => {
              setActiveItem("cluster");
              toggleMenu("cluster");
            }}
            className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all
              ${isActive("cluster") ? activeClass : "hover:bg-[#2d3b52] hover:text-white"}
            `}
          >
            <span className="flex items-center gap-3">
              <Database size={16} />
              Gom cụm
            </span>
            {openMenus.cluster ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          {/* Submenu */}
          {openMenus.cluster && (
            <div className="flex flex-col ml-6 space-y-1 mt-1">

              <div
                onClick={() => handleNavigate("/kmeans")}
                className={`${menuClass} ${
                  isActive("/kmeans")
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                }`}
              >
                <span className="w-2 h-2 bg-current rounded-full"></span>
                K-Means
              </div>

              <div
                onClick={() => handleNavigate("/kohonen")}
                className={`${menuClass} ${
                  isActive("/kohonen")
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-[#2d3b52] hover:text-white"
                }`}
              >
                <span className="w-2 h-2 bg-current rounded-full"></span>
                Mạng Kohonen
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}