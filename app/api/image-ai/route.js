import openai from "@/services/openai";
import axios from "axios";
import db from "@/services/db";

export async function GET() {
    const cardList = [];

    // 從firestore按造createdAt欄位由大到小撈取image-ai集合內的資料，並將每筆資料加入cardList內
    const querySnapshot = await db.collection('image-ai')
        .orderBy('createdAt', 'desc')
        .get();
    
    querySnapshot.forEach((doc) => {
        cardList.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return Response.json(cardList);
}
 
export async function POST(req) {
    const body = await req.json();
    console.log("body:", body);
    const { userInput } = body;
    console.log("userInput:", userInput);
    // 透過dall-e-3模型讓AI產生圖片
    // 文件連結: https://platform.openai.com/docs/guides/images/usage
    const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: userInput,
        n: 1,
        size: "256x256",
    });
    // openai產生圖片的網址(暫時性的網址)
    const openAIImageURL = response.data[0].url;  
    console.log("openAIImageURL:", openAIImageURL);

    // 將openai產生的圖片透過axios上傳到imgur
    const imgurResponse = await axios.post('https://api.imgur.com/3/image', {
        image: openAIImageURL,
        type: 'url'
    }, {
        headers: {
            'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`
        }
    });
    
    const imgurURL = imgurResponse.data.data.link;
    console.log("imgurURL:", imgurURL);

    const data = {
        imageURL: imgurURL,
        prompt: userInput,
        createdAt: new Date().getTime(), // 取得當下的時間戳記
    }

    // 將資料儲存到firestore的image-ai集合
    db.collection("image-ai").add(data);

    return Response.json(data);
}