import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faBook, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export default function VocabGenResultCard({ result, onCopy }) {
  const { wordList, zhWordList } = result.payload;
  const [exampleSentences, setExampleSentences] = useState({});
  const [loading, setLoading] = useState({});
  const [playing, setPlaying] = useState({});
  const [audio, setAudio] = useState(null);

  const generateSentence = async (word, idx) => {
    try {
      setLoading((prev) => ({ ...prev, [idx]: true }));
      const response = await fetch("/api/sentence-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          language: result.language,
          meaning: zhWordList[idx],
        }),
      });

      const data = await response.json();
      if (data.sentence && data.translation) {
        setExampleSentences((prev) => ({
          ...prev,
          [idx]: {
            sentence: data.sentence,
            translation: data.translation,
          },
        }));
      }
    } catch (error) {
      console.error("Error generating sentence:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const playAudio = async (sentence, idx) => {
    try {
      setPlaying((prev) => ({ ...prev, [idx]: true }));
      const response = await fetch("/api/tts-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sentence,
          language: result.language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const data = await response.json();
      if (data.audio) {
        // 如果已經有正在播放的音頻，先停止它
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }

        const newAudio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        newAudio.onended = () => {
          setPlaying((prev) => ({ ...prev, [idx]: false }));
        };
        newAudio.onerror = (error) => {
          console.error("Audio playback error:", error);
          setPlaying((prev) => ({ ...prev, [idx]: false }));
        };

        setAudio(newAudio);
        await newAudio.play();
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlaying((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const wordItems = wordList.map((word, idx) => {
    return (
      // 單字卡的卡片
      <div className="p-3 border-2 border-slate-300 rounded-md" key={idx}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-700">{word}</h3>
          <div className="flex gap-2">
            <button
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full"
              onClick={() => generateSentence(word, idx)}
              disabled={loading[idx]}
            >
              <FontAwesomeIcon icon={faBook} />
            </button>
            <button
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full"
              onClick={() => onCopy(zhWordList[idx])}
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
          </div>
        </div>
        <p className="text-slate-400 mt-3">{zhWordList[idx]}</p>
        {exampleSentences[idx] && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-600 italic">
              {exampleSentences[idx].sentence}
              <button
                className="ml-2 p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full"
                onClick={() => playAudio(exampleSentences[idx].sentence, idx)}
                disabled={playing[idx]}
              >
                <FontAwesomeIcon icon={faVolumeUp} />
              </button>
            </p>
            <p className="text-sm text-slate-500">
              {exampleSentences[idx].translation}
            </p>
          </div>
        )}
      </div>
    );
  });
  return (
    <div className="bg-white shadow-sm p-4 rounded-xl my-3">
      <h3 className="text-lg">
        {result.title}{" "}
        <span className="py-2 px-4 bg-slate-200 font-semibold rounded-lg inline-block ml-2">
          {result.language}
        </span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
        {wordItems}
      </div>
      {/* 顯示AI產生的例句 */}
      <p className="mt-3 text-right text-slate-500">
        Created At: {moment(result.createdAt).format("YYYY年MM月DD日 HH:mm:ss")}
      </p>
    </div>
  );
}
