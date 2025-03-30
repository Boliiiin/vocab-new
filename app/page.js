"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { faEarthAmericas } from "@fortawesome/free-solid-svg-icons";
import CurrentFileIndicator from "@/components/CurrentFileIndicator";
import PageHeader from "@/components/PageHeader";
import GeneratorButton from "@/components/GenerateButton";
import VocabGenResultCard from "@/components/VocabGenResultCard";
import VocabGenResultPlaceholder from "@/components/VocabGenResultPlaceholder";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [language, setLanguage] = useState("English");
  // 所有的單字生成結果清單
  // useState() 創建狀態(state):會動態改變的資料
  const [vocabList, setVocabList] = useState([]);
  // 是否在等待回應
  const [isWaiting, setIsWaiting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showNav, setShowNav] = useState(true);

  // 監聽滾動事件
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 如果滾動到頂部，顯示導航欄
      if (currentScrollY === 0) {
        setShowNav(true);
      }
      // 如果向下滾動，隱藏導航欄
      else if (currentScrollY > lastScrollY) {
        setShowNav(false);
      }
      // 如果向上滾動，顯示導航欄
      else if (currentScrollY < lastScrollY) {
        setShowNav(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopy = (zhWord) => {
    setUserInput(zhWord);
    setToastMessage("已複製到輸入框！");
    setShowToast(true);
    // 3秒後自動關閉 Toast
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const languageList = [
    "English",
    "Japanese",
    "Korean",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Norwegian",
    "Arabic",
  ];

  // 在頁面載入時取得現有的單字卡資料
  useEffect(() => {
    axios
      .get("/api/vocab-ai")
      .then((response) => {
        console.log("成功取得現有單字卡", response.data);
        setVocabList(response.data);
      })
      .catch((error) => {
        console.error("取得單字卡時發生錯誤", error);
      });
  }, []); // 空陣列代表只在組件掛載時執行一次

  const submitHandler = (e) => {
    // 防止會重整的預設行為
    e.preventDefault();
    // 把資料在檢查工具印出 讓開發者可檢視從畫面抓到的資料
    console.log("User Input: ", userInput);
    console.log("Language: ", language);
    // body作為準備傳遞給後端的資料 -> {} 物件 常用於傳遞給後端資料的格式
    const body = { userInput, language };
    console.log("body:", body);
    // 開始等待回應
    setIsWaiting(true);
    // 清空輸入框
    setUserInput("");

    // 透過axios將body POST到 /api/vocab-ai
    // 並使用then以及catch的方式分別印出後端的回應
    axios
      .post("/api/vocab-ai", body)
      // then代表成功收到後端產生的回應
      .then((response) => {
        console.log("成功收到後端回應", response.data);
        // 將新的單字卡加入到現有的清單前方
        setVocabList((prevList) => [response.data, ...prevList]);
        // 結束等待回應
        setIsWaiting(false);
      })
      // catch代表過程出了問題
      .catch((error) => {
        console.error("出了錯誤", error);
        // 結束等待回應
        setIsWaiting(false);
      });
  };

  return (
    <>
      <CurrentFileIndicator filePath="/app/page.js" />
      <div className="relative">
        <div
          className={`transition-transform duration-300 ${
            showNav ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <PageHeader title="AI單字聯想生成器" icon={faEarthAmericas} />
        </div>
        {/* 固定在頂部的輸入框 */}
        <div
          className={`fixed left-0 right-0 bg-white z-10 shadow-md py-4 transition-transform duration-300 ${
            showNav ? "top-16" : "top-0"
          }`}
        >
          <div className="container mx-auto">
            <form onSubmit={submitHandler}>
              <div className="flex">
                <div className="w-3/5 px-2">
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    type="text"
                    className="border-2 focus:border-pink-500 w-full block p-3 rounded-lg"
                    placeholder="請輸入想要學習的關鍵字"
                    required
                  />
                </div>
                <div className="w-1/5 px-2">
                  <select
                    className="border-2 w-full block p-3 rounded-lg"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    required
                  >
                    {languageList.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/5 px-2">
                  <GeneratorButton />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <section>
        <div className="container mx-auto">
          {/* 等待後端回應時要顯示的載入畫面 */}
          {isWaiting ? <VocabGenResultPlaceholder /> : null}

          {/* 顯示所有單字卡 */}
          {vocabList.map((result, index) => (
            <VocabGenResultCard
              key={result.createdAt + index}
              result={result}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </section>
      {/* Toast 通知 */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  );
}
