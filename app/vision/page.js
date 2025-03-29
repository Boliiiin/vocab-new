"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import CurrentFileIndicator from "@/components/CurrentFileIndicator";
import PageHeader from "@/components/PageHeader";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import VocabGenResultCard from "@/components/VocabGenResultCard";
import VocabGenResultPlaceholder from "@/components/VocabGenResultPlaceholder";

export default function Vision() {
  // 是否在等待回應
  const [isWaiting, setIsWaiting] = useState(false);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("/api/vision-ai");
      setHistory(response.data);
    } catch (error) {
      console.error("獲取歷史記錄時發生錯誤:", error);
      setError("獲取歷史記錄失敗");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const changeHandler = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    console.log(file, "file");
    setFileName(file.name);
    setError(null);
    setIsWaiting(true);
    setResult(null);

    // 建立FileReader物件來讀取檔案
    const reader = new FileReader();

    reader.onload = () => {
      // 取得base64字串
      const base64String = reader.result;
      console.log("圖片的base64格式:", base64String);
      setImage(base64String);

      // 發送到後端 API
      axios
        .post("/api/vision-ai", { base64: base64String })
        .then((response) => {
          console.log("成功發送到後端", response.data);
          setResult(response.data);
          // 更新歷史記錄
          setHistory((prev) => [response.data, ...prev]);
        })
        .catch((error) => {
          console.error("發送到後端時發生錯誤", error);
          setError(error.response?.data?.error || "發生錯誤，請重新嘗試");
        })
        .finally(() => {
          setIsWaiting(false);
        });
    };

    reader.onerror = () => {
      setError("讀取檔案時發生錯誤");
      setIsWaiting(false);
    };

    // 讀取檔案並轉成base64
    reader.readAsDataURL(file);
  };

  return (
    <>
      <CurrentFileIndicator filePath="/app/vision/page.js" />
      <PageHeader title="AI Vision" icon={faEye} />
      <section>
        <div className="container mx-auto">
          <label
            htmlFor="imageUploader"
            className="inline-block bg-indigo-500 p-5 rounded-lg text-white hover:bg-indigo-600 cursor-pointer"
          >
            Upload Image
          </label>
          <input
            className="hidden"
            id="imageUploader"
            type="file"
            onChange={changeHandler}
            accept=".jpg, .jpeg, .png"
          />
          {fileName && (
            <span className="ml-4 text-gray-600">已選擇檔案：{fileName}</span>
          )}
        </div>
      </section>
      <section className="mt-8">
        <div className="container mx-auto">
          {image && (
            <div className="mb-4">
              <img
                src={image}
                alt="上傳的圖片"
                className="max-w-md rounded-lg shadow-lg"
              />
            </div>
          )}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {isWaiting && (
            <div className="space-y-4">
              <div
                className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">
                  正在分析圖片中，請稍候...
                </span>
              </div>
              <VocabGenResultPlaceholder />
            </div>
          )}
          {result && <VocabGenResultCard result={result} />}

          {/* 歷史記錄區域 */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">歷史記錄</h2>
            {isLoadingHistory ? (
              <div className="space-y-4">
                <VocabGenResultPlaceholder />
                <VocabGenResultPlaceholder />
                <VocabGenResultPlaceholder />
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <VocabGenResultCard key={item.id} result={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
