import React, { useRef, useEffect, useState } from 'react';

import { setGUI, playDepthImg, pauseDepthImg, resetDepthImg, setTreeSceneNode, setSetDisplacementScale, getDefaultScale, setRelightMode, getDefaultPointLightDepth, getDefaultPointLightPower, getDefaultPointLightRange, getDefaultPointLightColor, setPointLightDepth, setPointLightPower, setPointLightRange, setPointLightColor, resetCameraPos, setCameraControlEnable , saveImage, saveVideo, setLightBallVisible, setOrthographicMode, setImmersionMode} from "@/services/core"
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { log, warn, error } from '@/lib/log';

//初始化页面
const initWeb = (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef || !containerRef.current) {
    error("【initWeb】containerRef|containerRef.current is null!!!");
    return;
  }
  warn("【initWeb】");
  setTreeSceneNode(containerRef.current);
  let defaultScale: number = getDefaultScale();
  let defaultPointLightDepth: number = getDefaultPointLightDepth();
  let defaultPointLightPower: number = getDefaultPointLightPower();
  let defaultPointLightRange: number = getDefaultPointLightRange();
  let defaultPointLightColor: string = getDefaultPointLightColor();
  const params = {
    threeDScale: defaultScale,
    playVideo: playDepthImg,
    pauseVideo: pauseDepthImg,
    resetVideo: resetDepthImg,
    saveImage: saveImage,
    saveVideo: saveVideo,
    relightMode: false,
    showLightBall: true,
    pointLightDepth: defaultPointLightDepth,
    pointLightPower: defaultPointLightPower,
    pointLightRange: defaultPointLightRange,
    pointLightColor: defaultPointLightColor,
    resetCameraPos: resetCameraPos,
    lockCamera: false,
    orthographicMode: false,
    setImmersionMode: false
  };
  const gui = new GUI();
  // 获取GUI的DOM元素
  const guiDom = gui.domElement;
  // 添加GUI的样式
  guiDom.style.position = 'absolute';
  guiDom.style.top = '50%';
  guiDom.style.right = '0';
  guiDom.style.transform = 'translate(0, -50%)';

  // 创建图片子菜单
  const imageFolder = gui.addFolder('Image');
  imageFolder.close();
  // 创建视频子菜单
  const videoFolder = gui.addFolder('Video');
  videoFolder.close();
  // 创建光照子菜单
  const lightFolder = gui.addFolder('Light');
  lightFolder.close();
  // 创建相机子菜单
  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.close();

  gui.add(params, 'threeDScale', 0.0, 2, 0.01).name('3D Scale').onChange(function (scale) {
    setSetDisplacementScale(scale);
  });
  // 添加保存图片的点击按钮
  imageFolder.add(params, 'saveImage').name('Save Image');
  // // 视频是否循环播放 默认False
  // videoFolder.add(params, 'isLoopVideo').name('Is Loop Video');  
  // // 视频总秒数 1-5秒 默认5秒
  // videoFolder.add(params, '').name('');  
  // // 视频每秒帧数 1-12 默认12
  // videoFolder.add(params, 'FPS').name('FPS');
  // 添加播放视频帧的点击按钮
  videoFolder.add(params, 'playVideo').name('Play Video');
  // 添加暂停视频帧的点击按钮
  videoFolder.add(params, 'pauseVideo').name('Pause Video');
  // 添加重置视频帧的点击按钮
  videoFolder.add(params, 'resetVideo').name('Reset Video');
  // 添加保存视频的点击按钮
  videoFolder.add(params, 'saveVideo').name('Save Video');
  // 添加relightMode的勾选按钮
  let relightMode =  lightFolder.add(params, 'relightMode').name('Relight Mode').onChange(function (bol) {
    // 根据用户选择更新relightMode的值
    // bol为true时，表示选中；bol为false时，表示未选中
    setRelightMode(bol);
    // 根据relightMode的值来显示或隐藏pointLightDepth
    if (bol) {
      params.showLightBall = true;
      params.pointLightDepth = defaultPointLightDepth;
      params.pointLightPower = defaultPointLightPower;
      params.pointLightRange = defaultPointLightRange;
      params.pointLightColor = defaultPointLightColor;
      showLightBall.updateDisplay();
      pointLightDepth.updateDisplay();
      pointLightPower.updateDisplay();
      pointLightRange.updateDisplay();
      pointLightColor.updateDisplay();
      showLightBall.domElement.style.display = 'block';  // 显示showLightBall
      pointLightDepth.domElement.style.display = 'block';  // 显示pointLightDepth
      pointLightPower.domElement.style.display = 'block';  // 显示pointLightPower
      pointLightRange.domElement.style.display = 'block';  // 显示pointLightRange
      pointLightColor.domElement.style.display = 'block';  // 显示pointLightColor
    } else {
      showLightBall.domElement.style.display = 'none';  // 隐藏showLightBall
      pointLightDepth.domElement.style.display = 'none';  // 隐藏pointLightDepth
      pointLightPower.domElement.style.display = 'none';  // 隐藏pointLightPower
      pointLightRange.domElement.style.display = 'none';  // 显示pointLightRange
      pointLightColor.domElement.style.display = 'none';  // 隐藏pointLightColor
    }
  });
  // 添加showLightBall的布尔值
  const showLightBall = lightFolder.add(params, 'showLightBall').name('Show Light Ball').onChange(function (bol) {
    setLightBallVisible(bol);
  });
  showLightBall.domElement.style.display = 'none';  // 初始隐藏showLightBall
  // 添加pointLightDepth的数值设置
  const pointLightDepth = lightFolder.add(params, 'pointLightDepth', -1, 1, 0.01).name('Point Light Depth').onChange(function (depth) {
    setPointLightDepth(depth);
  });
  pointLightDepth.domElement.style.display = 'none';  // 初始隐藏pointLightDepth

  // 添加pointLightPower的数值设置
  const pointLightPower = lightFolder.add(params, 'pointLightPower', 0, 2, 0.01).name('Point Light Power').onChange(function (power) {
    setPointLightPower(power);
  });
  pointLightPower.domElement.style.display = 'none';  // 初始隐藏隐藏pointLightPower

  // 添加pointLightRangeointLightPower的数值设置
  const pointLightRange = lightFolder.add(params, 'pointLightRange', 0, 5, 0.01).name('Point Light Range').onChange(function (range) {
    setPointLightRange(range);
  });
  pointLightRange.domElement.style.display = 'none';  // 初始隐藏隐藏pointLightRange


  // 添加pointLightColor的字符串设置
  const pointLightColor = lightFolder.add(params, 'pointLightColor').name('Point Light Color').onChange(function (color) {
    setPointLightColor(color);
  });
  pointLightColor.domElement.style.display = 'none';  // 初始隐藏pointLightColor
  
  cameraFolder.add(params,'resetCameraPos').name('Reset Camera');
  cameraFolder.add(params,'lockCamera').name('Lock Camera').onChange(function (bol){
    setCameraControlEnable(bol);
  });
  // 添加showLightBall的布尔值
  cameraFolder.add(params, 'orthographicMode').name('2D Mode').onChange(function (bol) {
    setOrthographicMode(bol);
  });

  cameraFolder.add(params,'setImmersionMode').name('Immersion Mode').onChange(function (bol) {
    setImmersionMode(bol);
  });


  setGUI(gui,params,relightMode);
  gui.open(); // Open the GUI
  return () => {
    gui.destroy(); // 在组件卸载时销毁 GUI
  };
}
const ThreeScene: React.FC = () => {

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef || !containerRef.current) return;

    const cleanUp = initWeb(containerRef);

    return () => {
      if (cleanUp) {
        cleanUp(); // 在组件卸载时执行清理操作\
      }
    };
  }, []);
  return <div ref={containerRef} />;
};

export default ThreeScene;
