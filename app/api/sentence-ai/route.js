import openai from "@/services/openai";
// 設計一個API，可以接收一個句子，然後返回一個句子，這個句子是AI生成的，並且是根據句子中的單字生成的。
// 回傳一個AI產生的指定語言例句給前端，讓前端可顯示在畫面上。

export async function POST(request) {
  try {
    const { word, language, meaning } = await request.json();

    const systemPrompt = `
請作為一個專業的語言教師，根據提供的單字和其中文意思生成一個自然且實用的例句。
請確保例句包含指定的單字，並提供例句的中文翻譯。
例句應該要符合該單字的特定中文意思。

輸出JSON格式：
{
    "sentence": "例句",
    "translation": "中文翻譯"
}`;

    const prompt = `
單字: ${word}
中文意思: ${meaning}
語言: ${language}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return Response.json(result);
  } catch (error) {
    console.error("Error generating sentence:", error);
    return Response.json({ error: "生成例句時發生錯誤" }, { status: 500 });
  }
}
