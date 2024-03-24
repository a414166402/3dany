import { respData, respErr } from "@/lib/resp";
import { currentUser } from "@clerk/nextjs";
// import $ from 'jquery';
import cheerio from 'cheerio';
import { toast } from "sonner";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
});

//获取字幕的多语言类型和链接
async function getLangOptionsWithLink(videoId: string) {
  console.warn("!!!!!!!!!")
  // Get a transcript URL
  const videoPageResponse = await fetch('https://www.youtube.com/watch?v=' + videoId)
  const videoPageHtml = await videoPageResponse.text()
  const splittedHtml = videoPageHtml.split('"captions":')

  if (splittedHtml.length < 2) {
    return
  } // No Caption Available

  const captions_json = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''))
  const captionTracks = captions_json.playerCaptionsTracklistRenderer.captionTracks
  const languageOptions = Array.from(captionTracks).map((i: any) => {
    return i.name.simpleText
  })

  const first = 'English' // Sort by English first
  languageOptions.sort(function (x, y) {
    return x.includes(first) ? -1 : y.includes(first) ? 1 : 0
  })
  languageOptions.sort(function (x, y) {
    return x == first ? -1 : y == first ? 1 : 0
  })

  return Array.from(languageOptions).map((langName, index) => {
    const link = captionTracks.find((i: any) => i.name.simpleText === langName).baseUrl
    return {
      language: langName,
      link: link,
    }
  })
}

//通过链接获取原生字幕
async function getRawTranscript(link: string) {
  // Get Transcript
  const transcriptPageResponse = await fetch(link) // default 0
  const transcriptPageXml = await transcriptPageResponse.text()

  // Parse Transcript
  const $ = cheerio.load(transcriptPageXml);
  const textNodes = $('transcript').children(); // 假设字幕是在 <transcript> 标签内

  return textNodes.map((i, elem) => {
    return {
      start: $(elem).attr('start'),
      duration: $(elem).attr('dur'),
      text: $(elem).text(),
    };
  }).get(); // .get() 将 cheerio 对象转换为普通数组
}

//压缩裁剪字幕，把字幕数组文件转换成html格式
let tempObj: {
  start: string; // 将 start 的类型改为 string
  text: string;
  videoId: string;
};
async function getTranscriptHTML(rawTranscript: any[], videoId: string) {
  const scriptObjArr: typeof tempObj[] = [];
  let timeSum = 0, charCount = 0;

  rawTranscript.forEach((obj, i) => {
    if (i === 0) {
      // 初始化 tempObj
      tempObj = { start: convertIntToHms(obj.start), text: '', videoId: videoId };
    } else {
      const segmentDuration = Math.round(obj.start) - Math.round(parseFloat(tempObj.start));
      timeSum += segmentDuration;
      charCount += obj.text.length;

      // 将文本加入当前片段，并替换换行符
      tempObj.text += (tempObj.text ? ' ' : '') + obj.text.replace(/\n/g, ' ');

      // 检查是否达到时间或字符数上限
      if (timeSum > 60 || charCount > 500 || (charCount > 300 && obj.text.includes('.'))) {
        scriptObjArr.push(tempObj); // 添加当前片段到结果数组
        // 重置 tempObj 开始新的片段，同时将 start 属性设置为格式化后的字符串
        tempObj = { start: convertIntToHms(obj.start), text: '', videoId: videoId };
        timeSum = 0;
        charCount = 0;
      }
    }
  });
  // 确保最后一个片段被添加
  if (tempObj.text) {
    scriptObjArr.push(tempObj);
  }
  return scriptObjArr;
}
//转换成时间格式
function convertIntToHms(num: number) {
  const h = num < 3600 ? 14 : 11
  return new Date(num * 1000).toISOString().substring(h, 19).toString()
}

export async function POST(req: Request) {
  const { youtube_url } = await req.json();
  if (!youtube_url) {
    return respErr("invalid params");
  }
  // 使用正则表达式检查URL是否有效，并尝试提取视频ID
  const regexPatterns = [
    /^https?:\/\/(?:www\.)?youtube\.com\/.*v=([^&]+)/,
    /^https?:\/\/youtu\.be\/([^?]+)/
  ];
  let video_id: string = "";
  for (const pattern of regexPatterns) {
    const match = youtube_url.match(pattern);
    if (match && match[1]) {
      video_id = match[1];
      break;
    }
  }
  if (!video_id) {
    return respErr("invalid YouTube URL");
  }
  // toast("video_id:"+video_id)
  //获取用户信息并检验
  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("no auth");
  }

  try {
    let transcript = "";
    let response: any;
    const options = await getLangOptionsWithLink(video_id);
    console.warn(options);
    // toast("options:"+options)
    if (options && options.length > 0) {
      let lang = options[0].language;
      let link = options[0].link;
      console.warn(link);
      console.warn(lang);
      // toast("link:"+link)
      if (link) {
        const textArr = await getRawTranscript(link);
        // toast("textArr:"+textArr)
        const transcriptList = await getTranscriptHTML(textArr, video_id);
        transcript = transcriptList.map(v => v.text).join('');
        console.warn("【Get Final transcript】:" + transcript);
        // toast("【Get Final transcript】:" + transcript);

        const prompt = ChatPromptTemplate.fromMessages([
          ["system", "Your task is to summarise the text I have given you with brief and short.Use the text above: "],
          ["human", "{input}"],
        ]);
        const chain = prompt.pipe(model);
        response = await chain.invoke({
          input: transcript,
        });
        console.log("response", response);
        // toast("【Get Final transcript】:" + transcript);
      } else {
        console.warn("【getLangOptionsWithLink】多语言字幕返回的link链接为空！");
      }
    }
    // 返回成功响应
    return respData(response["content"]);
  } catch (e) {
    console.log("get transcript failed: ", e);
    // toast(e+"")
    return respErr("get transcript failed: "+e);
  }
}
