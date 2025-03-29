import Image from "next/image";
import moment from "moment";

export default function ImageGenCard({ imageURL, prompt, createdAt }) {
    return (
        <div className="shadow-sm rounded-md overflow-hidden bg-white">
            <img
                src={imageURL}
                alt={prompt}
                width={1024}
                height={1024}
                className="w-full"
            />
            <div className="p-3">
                <h3 className="text-md">{prompt}</h3>
                <p className="text-slate-400 text-sm mt-2">
                    {moment(createdAt).format("YYYY年MM月DD日 HH:mm:ss")}
                </p>
            </div>
        </div>
    )
}