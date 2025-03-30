import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text, language } = await request.json();

    // 根據語言選擇適當的聲音
    const voice = language === "en" ? "coral" : "alloy";

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });

    const arrayBuffer = await mp3.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ audio: base64 });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { message: "Error generating speech" },
      { status: 500 }
    );
  }
}
