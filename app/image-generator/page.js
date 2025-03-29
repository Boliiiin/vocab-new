"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { faImage } from "@fortawesome/free-solid-svg-icons"
import CurrentFileIndicator from "@/components/CurrentFileIndicator";
import PageHeader from "@/components/PageHeader";
import GeneratorButton from "@/components/GenerateButton";
// 用來呈現圖像生成結果的卡片
import ImageGenCard from "@/components/ImageGenCard";
// 圖像生成過程中等待的卡片
import ImageGenPlaceholder from "@/components/ImageGenPlaceholder";


export default function ImgGen() {
    const [userInput, setUserInput] = useState("");
    // 是否在等待回應
    const [isWaiting, setIsWaiting] = useState(false);
    // 用來儲存生成的圖片卡片
    const [cardList, setCardList] = useState([]);

    // 在頁面載入時取得現有的圖片卡片資料
    useEffect(() => {
        axios.get('/api/image-ai')
            .then(response => {
                console.log("成功取得現有圖片卡片", response.data);
                setCardList(response.data);
            })
            .catch(error => {
                console.error("取得圖片卡片時發生錯誤", error);
            });
    }, []);

    // 表單送出後會執行的流程
    const submitHandler = (e) => {
        e.preventDefault();
        console.log("===============================")
        // console.log("User Input: ", userInput);
        const body = { userInput };
        console.log("body:", body);
        // 將等待狀態切換為true
        setIsWaiting(true);
        // 清空輸入框
        setUserInput("");
        // 將body POST到 /api/image-ai { userInput: "" }
        axios.post("/api/image-ai", body)
             // 成功發送請求並收到來自後端的回應 箭頭函式 => 
             .then(res => {
                console.log("後端回傳的資料", res.data)
                setIsWaiting(false)
                // 將 res.data 放到 cardList 的最前面
                setCardList(prevList => [res.data, ...prevList])
             })
             // 發生任何錯誤(語法有錯、網路有問題、對接的第三方服務有問題)
             .catch(err => {
                console.log("發生錯誤", err)
                alert("發生錯誤，請重新嘗試")
                setIsWaiting(false)
             })
    }

    return (
        <>
            <CurrentFileIndicator filePath="/app/image-generator/page.js" />
            <PageHeader title="AI圖像生成器" icon={faImage} />
            <section>
                <div className="container mx-auto">
                    <form onSubmit={submitHandler}>
                        <div className="flex">
                            <div className="w-4/5 px-2">
                                <input
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    type="text"
                                    className="border-2 focus:border-pink-500 w-full block p-3 rounded-lg"
                                    placeholder="Enter a word or phrase"
                                    required
                                />
                            </div>
                            <div className="w-1/5 px-2">
                                <GeneratorButton />
                            </div>
                        </div>
                    </form>
                </div>
            </section>
            <section>
                <div className="container mx-auto grid grid-cols-4 gap-4 mt-4">
                    {/* 當isWaiting是true時，才會顯示ImageGenPlaceholder */}
                    { isWaiting && <ImageGenPlaceholder /> }
                    {/* 使用 ImageGenCard 元件渲染每一個在 cardList 的資料 */}
                    {cardList.map((card, index) => (
                        <ImageGenCard
                            key={card.createdAt + index}
                            imageURL={card.imageURL}
                            prompt={card.prompt}
                            createdAt={card.createdAt}
                        />
                    ))}
                </div>
            </section>
        </>
    )
}