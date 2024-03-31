import React, { useRef, useEffect, useState } from 'react';

import { playDepthImg, setTreeSceneNode, setSetDisplacementScale, getDefaultScale } from "@/services/core"
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
  let defaultScale = getDefaultScale();
  const params = {
    threeDScale: defaultScale,
    play3dVideo: playDepthImg
  };
  const gui = new GUI();
  gui.add(params, 'threeDScale', 0.0, 1.0, 0.01).name('3D Scale').onChange(function (scale) {
    setSetDisplacementScale(scale);
  });;
  gui.add(params, 'play3dVideo').name('Play 3D Video');
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
