import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { text, language } = req.body;

    // 根據語言選擇適當的聲音
    const voice = language === "en" ? "coral" : "alloy";

    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice,
      input: text,
    });

    const arrayBuffer = await mp3.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    res.status(200).json({ audio: base64 });
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ message: "Error generating speech" });
  }
}
