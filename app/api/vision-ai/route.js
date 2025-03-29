import openai from "@/services/openai";
import db from "@/services/db";

export async function GET() {
  try {
    const visionRef = db.collection("vision-ai");
    const snapshot = await visionRef.orderBy("createdAt", "desc").get();

    const results = [];
    snapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return Response.json(results);
  } catch (error) {
    console.error("取得歷史記錄時發生錯誤:", error);
    return Response.json({ error: "取得歷史記錄失敗" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("body:", body);
    const { base64 } = body;

    if (!base64) {
      return Response.json({ error: "未提供圖片資料" }, { status: 400 });
    }

    const systemPrompt = `你是一個專業的圖片分析助手。請分析圖片並回傳一個 JSON 物件，包含以下欄位：
    1. wordList: 一個包含5個與圖片相關的英文單字的陣列
    2. zhWordList: 一個包含5個對應的中文翻譯的陣列
    3. aiText: 用繁體中文描述圖片內容，簡短且精確，不要超過10個字`;

    const prompt = `請分析這張圖片並回傳符合以下格式的 JSON：
{
    "wordList": ["英文單字1", "英文單字2", ...],
    "zhWordList": ["中文翻譯1", "中文翻譯2", ...],
    "aiText": "圖片描述"
}`;

    const openAIReqBody = {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: base64,
              },
            },
          ],
        },
      ],
      model: "gpt-4o-mini",
      max_tokens: 1000,
      response_format: { type: "json_object" },
    };

    const response = await openai.chat.completions.create(openAIReqBody);
    const content = response.choices[0].message.content;
    console.log("AI 回傳的內容:", content);

    try {
      const aiResult = JSON.parse(content);
      if (
        !aiResult.aiText ||
        !aiResult.wordList ||
        !aiResult.zhWordList ||
        !Array.isArray(aiResult.wordList) ||
        !Array.isArray(aiResult.zhWordList)
      ) {
        throw new Error("AI 回傳的資料格式不正確");
      }

      const result = {
        title: aiResult.aiText,
        payload: aiResult,
        language: "English",
        createdAt: Date.now(),
      };

      // 儲存到 Firestore
      await db.collection("vision-ai").add(result);

      return Response.json(result);
    } catch (parseError) {
      console.error("JSON 解析錯誤:", parseError);
      return Response.json(
        { error: "AI 回傳的資料格式不正確" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("OpenAI API 錯誤:", error);
    return Response.json(
      {
        error: error.message || "影像辨識失敗",
        details: error.response?.data?.error?.message || "請稍後再試",
      },
      { status: 500 }
    );
  }
}
