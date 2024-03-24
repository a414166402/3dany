"use client";

import { KeyboardEvent, useContext, useRef, useState } from "react";

import { AppContext } from "@/contexts/AppContext";
import { Cover } from "@/types/cover";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export default function () {
  const router = useRouter();
  const { setCovers, user, fetchUserInfo } = useContext(AppContext);
  const [description, setDiscription] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Enter" && !e.shiftKey) {
      if (e.keyCode !== 229) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    // //test groq
    // const model = new ChatGroq({
    //   apiKey:"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"
    // });
    // const prompt = ChatPromptTemplate.fromMessages([
    //   ["system", "Your task is to summarise the text I have given you with brief and short.Use the text above: "],
    //   ["human", "{input}"],
    // ]);
    // const chain = prompt.pipe(model);
    // const response = await chain.invoke({
    //   input: "(00:00) as I get older I realize money is not everything but it's kind of almost everything so every year or every other year I download all my bank transactions and review my incomes and expenses the other day I came across someone who made this income and expense breakdown and I feel really inspired to do the same usually the most tricky thing in the process is to classify the expenses from my buying transactions into appropriate categories a lot of times I just use my manual labor or some low take ways to do that this year I decide to ask CHP to Crunch the number for me and maybe tell me when I can retire only then to(00:39) realize that I can't just upload my bang statements to chat B website it's so sensitive information about places I've been to shops I visited how much I spent on buying secret items and other personal data although using open a apis may help still the data sent via the API is stored by open a for duration of up to 30 days So eventually I decide to download and run an open- Source large language model locally on my laptop and the best thing yet they are free in this project video we do a few exciting things first we'll learn to install and run an llm for example llama 2 locally on our laptop then we use the LM to(01:21) classify all the expenses in my bank statement into categories such as groceries rent travel and so on we then analyze the data in Python and create some visualizations to show the main insights I shared all the codes on GitHub so you can check out the GitHub repo in the video description this video is sponsored by corer corer is running a discount with $200 off the corera plus annual subscription if you sign up this is half the regular price for the whole year with this subscription you can get access to tons of courses and certificates in data analytics including the Google data analytics and and the Google advanced data analytics(02:02) certificates these certificates teach you all the fundamentals you need as a beginner in data analytics so check out the offer below there are a few different ways to run a large language model locally on your laptop which means you can run the ERM without internet connection without a third- party service like an API service or website like chat TBT as you can imagine this is secure if you want to protect your personal data and it's free there are now a few different Frameworks developed to help us run an open-source language model locally on our own device some popular Frameworks are Lama CPP GPT for and AMA so you might be wondering why(02:43) the heck do we even need these Frameworks remember how large language models are trained they are basically the result of taking a huge amount of internet data and train a large neuron Network on it and the model that comes out is basically a zip file with a bunch of numbers that represents the weight of all the parameters in the neuron Network this model file can be quite large depending on how many parameters the model has so Frameworks like AMA and Lama CPP basically try to do two things the first thing is quantization it tries to reduce the memory footprint of the raw model weights and the second thing is it makes it more efficient for us the(03:21) consumer to use the models if you have a Mac or Linux machine I'd highly recommend installing orama it's super simple and I'll show you in a bit if you have a Windows machine you can also run AMA through the docker desktop okay now let's go to AMA website and here you can download AMA which is available for Mac OS and Linux and windows will be coming soon also have a quick look at the list of models that are available so here we have Lama 2 mistol we have a bunch of other coat models and so there's a lot of options here for you to try out and if we click on any of them we can see the description also how to use API what(04:02) is the memory requirements so how much RAM you need in your laptop in order to run these models so let's download AMA and install it it's very straightforward just like installing any app on your laptop so once we've installed AMA we can start using it through our terminal in order to install a language model locally through AMA we just need to run the command or Lama pool and then specify the model that you want to install so for example I will install again mistro it's pretty fast because I've already installed it last time so and you can see here the model is around 4 GB so in order to use a model through"
    // });
    // console.log("content", response["content"]);
    // return;
    
    console.log("description", description);
    if (!description) {
      toast.error("请输入YouTube视频链接");
      inputRef.current?.focus();
      return;
    }

    if (!user) {
      toast.error("请先登录");
      router.push("/sign-in");
      return;
    }

    if (user.credits && user.credits.left_credits < 1) {
      toast.error("余额不足，请先充值");
      router.push("/pricing");
      return;
    }

    try {
      const params = {
        youtube_url: description,
      };

      setLoading(true);
      const resp = await fetch("/api/get-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      const { code, message, data } = await resp.json();
      
      setLoading(false);

      if (resp.status === 401) {
        toast.error("请先登录");
        router.push("/sign-in");
        return;
      }
      // console.log("gen wallpaper resp", resp);

      if (code !== 0) {
        toast.error(message);
        return;
      }

      // fetchUserInfo();
      // setDiscription("");

      toast.success("生成成功");
      toast.success("data:"+data);
      if (data) {
        console.log("[new sum]:", data);
        // setCovers((covers: Cover[]) => [data, ...covers]);
      }
    } catch (e) {
      console.log("get transcript failed", e);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto mt-4 md:mt-16">
      <input
        type="text"
        className="mb-1 h-9 w-full rounded-md border border-solid border-primary px-3 py-6 text-sm text-[#333333] focus:border-primary"
        placeholder="请输入YouTube视频完整链接"
        ref={inputRef}
        value={description}
        onChange={(e) => setDiscription(e.target.value)}
        onKeyDown={handleInputKeydown}
      />
      {loading ? (
        <button
          className="relative right-0 top-[5px] w-full cursor-pointer rounded-md bg-primary px-6 py-2 text-center font-semibold text-white sm:absolute sm:right-[5px] sm:w-auto"
          disabled
        >
          生成中...
        </button>
      ) : (
        <button
          className="relative right-0 top-[5px] w-full cursor-pointer rounded-md bg-primary border-primary px-6 py-2 text-center font-semibold text-white sm:absolute sm:right-[5px] sm:w-auto"
          onClick={handleSubmit}
        >
          生成字幕
        </button>
      )}
    </div>
  );
}
