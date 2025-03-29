import openai from "@/services/openai";
// 引入db
import db from "@/services/db";

// GET 通常用於取得資料
export async function GET() {
    // 預設是空陣列
    const vocabList = [];

    // 取得vocab-ai集合的所有文件，並依照createdAt欄位降序排序
    const querySnapshot = await db.collection('vocab-ai')
        .orderBy('createdAt', 'desc')
        .get();
    
    // 遍歷每個文件並加入vocabList
    querySnapshot.forEach((doc) => {
        vocabList.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // 將 vocabList 送到前端
    return Response.json(vocabList);
}

// POST 通常用於創建資料
export async function POST(req) {
    const body = await req.json();
    console.log("body:", body);

    // 分別取出body物件內的userInput以及language
    const { userInput, language } = body;


    // TODO: 透過gpt-4o-mini模型讓AI回傳相關單字
    // 文件連結：https://platform.openai.com/docs/guides/text-generation/chat-completions-api?lang=node.js
    // JSON Mode: https://platform.openai.com/docs/guides/text-generation/json-mode?lang=node.js
    const systemPrompt = `
請作為一個單字聯想AI根據所提供的單字聯想5個相關單字
例如:

聯想主題: 水果
語言: English

輸出JSON格式
{
    wordList: ["Apple", "Banana", "Cherry", "Date", "Elderberry"],
    zhWordList: ["蘋果", "香蕉", "櫻桃", "棗子", "接骨木"],
}
`;
    
    const propmpt = `
    聯想主題: ${userInput} 
    語言: ${language}`;

    const openAIReqBody = {
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": propmpt }
        ],
        model: "gpt-4o-mini",
        // 開啟JSON模式
        response_format: { type: "json_object" },
    };
    // 將物件丟給openai產生內容
    const completion = await openai.chat.completions.create(openAIReqBody);
    // 取得openai回傳的內容
    const payload = completion.choices[0].message.content;
    // 印出openai回傳的內容
    console.log("payload:", payload);

    const result = {
        // 主題 - 使用者輸入的關鍵字
        title: userInput,
        // AI回傳的單字列表資料 - 將JSON字串解析為JavaScript物件
        payload: JSON.parse(payload),
        // 使用者選擇的語言
        language: language,
        // 資料建立的時間戳記 - 使用JavaScript內建的Date.now()方法取得目前時間
        // new Date().getTime() 也可產生當下的時間戳記
        createdAt: Date.now()
    }

    // 等待 將result物件儲存到vocab-ai集合
    await db.collection("vocab-ai").add(result)
    // 上述任務完成後，才會做以下工作...

    // return Response.json(要回傳給前端的資料)
    return Response.json(result);
}