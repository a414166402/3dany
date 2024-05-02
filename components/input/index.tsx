"use client";

import { useState, useRef, useEffect } from "react";
import Head from 'next/head';
import ThreeScene from "../threeScene/threeScene";
import { dealVideo, dealImg } from "@/services/core"
import { prepareDepth, setInputSetStatus } from "@/services/core"
import { log, warn, error } from '@/lib/log';
import { toast } from "sonner";
export default function () {
  // 状态管理
  const [status, setStatus] = useState('Warming up...');
  setInputSetStatus(setStatus);
  useEffect(() => {
    // 定义一个异步函数来进行你的异步操作
    const loadModel = async () => {
      await prepareDepth();
      // setStatus('Ready'); // 更新状态为Ready
    };

    loadModel(); // 调用异步函数
  }, []); // 空依赖数组意味着这个effect仅在组件挂载时运行一次

  // 处理文件上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus("Uploading...");
    if (!e || !e.target || !e.target.files) return;
    const file = e.target.files[0];//这里只处理上传的第一个文件，不支持多文件上传
    const fileType = file.type;
    if (!file) {
      setStatus("No file selected.");
      return;
    }

    // 这里添加上传逻辑
    // 例如，使用 FormData 上传到服务器或处理文件
    log(file);

    setStatus("Upload successful!");
    // 在上传成功逻辑中显示id为“container2”的元素，隐藏id为“container”的元素
    // 使用className来控制显示和隐藏
    const container2 = document.getElementById('container2');
    if (container2) {
      container2.classList.remove('hidden');
    }
    const container = document.getElementById('container');
    if (container) {
      container.classList.add('hidden');
    }

    if (fileType.startsWith('image/')) {
      log('这是一个图片文件');
      // 处理图片文件的逻辑
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        if(e && e?.target)
        {
          img.src = e.target.result as string;
          img.onload = function () {
            dealImg(img);
          };
        }
      }
      reader.readAsDataURL(file);
    } else if (fileType.startsWith('video/')) {
      log('这是一个视频文件');
      // 处理视频文件的逻辑
      dealVideo(file);
    } else {
      log('不支持的文件类型');
      // 处理其他类型文件或显示错误消息的逻辑
      toast.error('不支持的文件类型');
    }
  };

  // 处理点击示例的逻辑
  const handleExampleClick = () => {

  };

  // 处理重新上传视频的逻辑
  const handleUploadAgain = () => {

    // 使用className来控制显示和隐藏
    const container = document.getElementById('container');
    if (container) {
      container.classList.remove('hidden');
    }
    const container2 = document.getElementById('container2');
    if (container2) {
      container2.classList.add('hidden');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">

      <div id="container" className="relative flex flex-col items-center justify-center w-full sm:w-[50vw] md:w-[75vw] lg:max-w-[1080px] h-[calc(100vw*2/3)] sm:h-[calc(50vw*2/3)] md:h-[calc(75vw*2/3)] lg:max-h-[720px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden mt-4 bg-cover bg-center bg-no-repeat">
        <label htmlFor="upload" className="flex flex-col items-center justify-center gap-1 cursor-pointer text-lg">
          {/* SVG 图标 */}
          Click to upload image/video
          <span id="example" onClick={handleExampleClick} className="text-sm underline cursor-pointer hover:text-blue-600">(or try example)</span>
        </label>
      </div>
      <div id="container2" className="hidden relative flex flex-col items-center justify-center w-full sm:w-[50vw] md:w-[75vw] lg:max-w-[1080px] h-[calc(100vw*2/3)] sm:h-[calc(50vw*2/3)] md:h-[calc(75vw*2/3)] lg:max-h-[720px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden mt-4 bg-cover bg-center bg-no-repeat">
        <ThreeScene />
      </div>
      <div id="status" className="min-h-[16px] my-2">{status}</div>
      <button id="upload-again-btn" type="button" className="hidden" onClick={handleUploadAgain}>
        重新上传图片/视频
      </button>
      <input id="upload" type="file" accept="image/*, video/*" onChange={handleUpload} className="hidden" />
    </div>
  );

}
