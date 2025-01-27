'use client'

import { pipeline, env, DepthEstimationPipeline, RawImage, AutoModel, AutoProcessor } from "@a414166402/3dany";
// log("e-------------nv.backends.onnx-=--------");
// log(env);
// log(env.backends);
// log(env.backends.onnx);
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as ONNX_WEB from 'onnxruntime-web';
import { toast } from "sonner";
import { log, warn, error } from '@/lib/log';
import { BooleanController, GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { ImgObjectType, CameraUsage, CameraType, SkyBoxName } from './GlobalEnum';

// 导入DragControls插件
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';


// interface NavigatorWithGPU extends Navigator {
//     gpu?: any;
// }
let USE_WEBGPU = true;
// if (typeof navigator !== 'undefined') {
//     const navigatorWithGPU = navigator as NavigatorWithGPU;
//     if ('gpu' in navigatorWithGPU) {
//         console.log('WebGPU is supported');
//         USE_WEBGPU = true;
//     } else {
//         // WebGPU is not supported
//         console.error('WebGPU is not supported');
//         toast.error('WebGPU is not supported');
//     }
// } else {
//     console.error('navigator is undefined');
//     toast.error('navigator is undefined');
// }


// //修复ONNX核心 强制使用web环境
// let ONNX;
// const ONNX_MODULES = new Map();
// // @ts-ignore
// ONNX = ONNX_WEB.default ?? ONNX_WEB;
// ONNX_MODULES.set('web', ONNX);
// // Running in a browser-environment
// const isIOS = typeof navigator !== 'undefined' && /iP(hone|od|ad).+16_4.+AppleWebKit/.test(navigator.userAgent);
// if (isIOS) {
//     ONNX.env.wasm.simd = false;
// }
// if (ONNX?.env?.wasm) {
//     // Set path to wasm files. This is needed when running in a web worker.
//     // https://onnxruntime.ai/docs/api/js/interfaces/Env.WebAssemblyFlags.html#wasmPaths
//     // We use remote wasm files by default to make it easier for newer users.
//     // In practice, users should probably self-host the necessary .wasm files.
//     ONNX.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/`;
// }
// ONNX.env.wasm = { proxy: true };
// ONNX.env.wasmPaths = ['https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/'];
// if (USE_WEBGPU) {
//     ONNX.env.numThreads = 1;
//     env.backends.onnx = ONNX.env;
//     // env.experimental.useWebGPU = true;
// } else {
//     env.allowLocalModels = false;
//     // env.backends.onnx.wasm.proxy = true;
// }



let setStatus: any;
export function setInputSetStatus(fun: any) {
    setStatus = fun;
}
// Constants
const MAX_DEPTH_IMG_BATCH_SIZE = 1;//处理一次深度图的最大打包数量 
// const EXAMPLE_URL = 'https://video.twimg.com/ext_tw_video/1751214622923976704/pu/vid/avc1/720x1280/pXx4rkujEbWicsv6.mp4?tag=12';
const EXAMPLE_URL = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/bread_small.png';

let DEFAULT_SCALE: number;
let DEFAULT_POINTLIGHT_DEPTH: number;
let DEFAULT_POINTLIGHT_POWER: number;
let DEFAULT_POINTLIGHT_RANGE: number;
let DEFAULT_POINTLIGHT_COLOR: string;
let IS_DEV_MODE: number;
let FIX_FPS = 30;//假设输入的视频固定帧数为30帧
let OUT_FPS: number;//输出视频的每秒帧数
let OUT_TOTAL_FRAME: number;//输出视频的总帧数
let OUT_TOTAL_SECONDS: number;//输出视频的总秒数
let OUT_START_SECONDS: number;//从第几秒开始截取视频
let OUT_START_FRAME: number;//从第几帧数开始截取视频
let VIDEO_TOTAL_SECONDS: number = 0;//获取到的视频的总秒数
let MAX_DIMENSION: number;//400;//锁定传入视频的最大宽高最大值
let targetWidth = 0;
let targetHeight = 0;
let setImageMap: any;//动态设置图片纹理的方法
let isRelightMode: boolean = false;//是否开启自定义灯光模式
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;//摄像头分两种模式，透视模式和正交模式，正交模式不受距离远近影响物体显示
let pointLight: THREE.PointLight | null;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let lightSphere: THREE.Mesh | null;
let dragControls: DragControls | null;
let DEFAULT_CAMERA_Z = 2.8;
let gui: GUI;
let gui_relightMode: BooleanController;
let guiParams: any;

let container2: any;
//每一格子的进度
let perStatus: number;
//当前进度
let curStatus: number;
let firstCanvasWidth: number;
let firstCanvasHeight: number;

let video: HTMLVideoElement;
let offscreenCanvas: any;
let canvas: any;
//{id:[img,depth,texture]} 第一个元素貌似没被使用到 暂时作为rawImg
let tempObj: { [key: number]: any[] } = {}
//{id:[img,depth,texture]}
let skyBoxObj: { [key: number]: any[] } = {}
let currentImgObjType: ImgObjectType;

let isSaveDepth = false;//是否开启保存深度图模式
let isLoadDepth = false;//是否开启读取本地深度图模式
let isLoadRawImg = false;//是否开启读取本地RawImg格式的图片 影响深度图的获取
let isLoadTexture = false;//是否开启读取本地图片Texture 影响图片的正确显示
const QUANTIZED = false;
// let executionProvidersStr = USE_WEBGPU ? 'webgpu' : 'wasm';
let depth_estimator: any = null; //DepthEstimationPipeline
export function getCanvas(): any {
    return canvas;
}
export function setCanvas(cv: any) {
    canvas = cv;
}

export function getGUI(){
    return gui;
}
export function setGUI(temp_gui: GUI, params: any, relightMode: any) {
    gui = temp_gui;
    guiParams = params;
    gui_relightMode = relightMode;
}

//读取.env.local数据初始化参数
IS_DEV_MODE = Number(process.env.NEXT_PUBLIC_IS_DEV_MODE);
DEFAULT_SCALE = Number(process.env.NEXT_PUBLIC_DEFAULT_SCALE);
DEFAULT_POINTLIGHT_DEPTH = Number(process.env.NEXT_PUBLIC_DEFAULT_POINTLIGHT_DEPTH);
DEFAULT_POINTLIGHT_POWER = Number(process.env.NEXT_PUBLIC_DEFAULT_POINTLIGHT_POWER);
DEFAULT_POINTLIGHT_RANGE = Number(process.env.NEXT_PUBLIC_DEFAULT_POINTLIGHT_RANGE);
DEFAULT_POINTLIGHT_COLOR = process.env.NEXT_PUBLIC_DEFAULT_POINTLIGHT_COLOR ?? "";
OUT_FPS = USE_WEBGPU ? Number(process.env.NEXT_PUBLIC_OUT_FPS) : 6;
OUT_TOTAL_FRAME = USE_WEBGPU ? Number(process.env.NEXT_PUBLIC_OUT_TOTAL_FRAME) : 18;
OUT_TOTAL_SECONDS = OUT_TOTAL_FRAME / OUT_FPS;
OUT_START_SECONDS = Number(process.env.NEXT_PUBLIC_OUT_START_SECONDS);
OUT_START_FRAME = OUT_START_SECONDS * OUT_FPS;
MAX_DIMENSION = USE_WEBGPU ? Number(process.env.NEXT_PUBLIC_MAX_DIMENSION) : 400;
//当前PointLight的z坐标
let currentPLDepth: number = DEFAULT_POINTLIGHT_DEPTH;

export function getDefaultScale(): number {
    return DEFAULT_SCALE;
}
export function getDefaultPointLightDepth(): number {
    return DEFAULT_POINTLIGHT_DEPTH;
}
export function getDefaultPointLightPower(): number {
    return DEFAULT_POINTLIGHT_POWER;
}
export function getDefaultPointLightRange(): number {
    return DEFAULT_POINTLIGHT_RANGE;
}
export function getDefaultPointLightColor(): string {
    return DEFAULT_POINTLIGHT_COLOR;
}
export function getDefaultStartSeconds(): number {
    return OUT_START_SECONDS;
}
export function getDefaultVideoTotalSeconds(): number {
    return OUT_TOTAL_SECONDS;
}
export function getDefaultFPS(): number {
    return OUT_FPS;
}
export function getIsDevMode(): boolean {
    return IS_DEV_MODE == 1 ? true : false;
}
export function setSetImageMap(map: any) {
    setImageMap(map);
}
let setDisplacementMap: any;//动态设置图片材质高度的方法
export function setSetDisplacementMap(map: any) {
    setDisplacementMap(map);
}
let setDisplacementScale: any;//动态设置图片材质缩放大小的方法
let setSkyboxDisplacementScale: any;//动态设置天空盒图片材质缩放大小的方法
let FIX_CYLINDER_SCALE: number = 1.5;//一个系数来动态调节图片的高度
export function setSetDisplacementScale(scale: any) {
    setDisplacementScale(scale);
    //在沉浸式环绕模式中，scale值越大，高度不变但图片的相对弧长会边长，所以需要添加一个系数来动态调节图片的高度
    if (isImmersionMode) {
        // 动态设置圆柱体在y方向上的缩放值
        cylinder.scale.y = 1 + scale * FIX_CYLINDER_SCALE;
    }
}
export function setSetSkyboxDisplacementScale(scale: any){
    setSkyboxDisplacementScale(scale);
}

export function setPointLightDepth(depth: number) {
    currentPLDepth = depth;
    if (pointLight)
        pointLight.position.z = depth;
    if (lightSphere)
        lightSphere.position.z = depth;
    renderer.render(scene, camera);
}


export function setRelightMode(bol: boolean) {
    isRelightMode = bol;
    if (bol) {
        // 创建一个点光源
        pointLight = new THREE.PointLight(DEFAULT_POINTLIGHT_COLOR, DEFAULT_POINTLIGHT_POWER, DEFAULT_POINTLIGHT_RANGE);
        // pointLight.castShadow = true;
        // // 创建SpotLight
        // const color = DEFAULT_POINTLIGHT_COLOR; // 光源颜色
        // const intensity = DEFAULT_POINTLIGHT_POWER; // 光源强度
        // const distance = 0; // 光源照射距离，0表示无限远
        // const angle = Math.PI / 4; // 光锥角度
        // const penumbra = 0; // 光锥边缘柔和度
        // const decay = 1; // 光线衰减率
        // const pointLight = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        // pointLight.position.set(0, 0, DEFAULT_POINTLIGHT_DEPTH); // 设置光源位置
        // pointLight.target.position.set(0, 0, -2); // 设置光源照射目标位置

        // 创建用于定位点光源位置的小球
        const lightSphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const lightSphereMaterial = new THREE.MeshBasicMaterial({ color: DEFAULT_POINTLIGHT_COLOR });
        lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);

        // 设置小球的位置与点光源位置一致
        lightSphere.position.copy(pointLight.position);

        // 将小球添加到场景中
        scene.add(lightSphere);

        // 创建DragControls实例，传入需要拖拽的对象数组和相机
        dragControls = new DragControls([lightSphere], camera, renderer.domElement);

        // 监听拖拽事件，更新渲染
        dragControls.addEventListener('drag', (event: any) => {//event: {type,object,target}
            let objX = event.object.position.x;
            let objY = event.object.position.y;
            event.object.position.set(objX, objY, currentPLDepth);
            if (pointLight && pointLight.position) {
                pointLight.position.copy(event.object.position);
                pointLight.position.z = currentPLDepth;
            }

            renderer.render(scene, camera);
        });

        dragControls.addEventListener('dragstart', function (event: any) {
            // 取消摄像头移动
            controls.enabled = false;
        });

        dragControls.addEventListener('dragend', function (event: any) {
            // 取消摄像头移动
            controls.enabled = true;
        });

        // 将光源添加到场景中
        if (pointLight) {
            // // 添加辅助线以可视化光源和光锥
            // const helper = new THREE.PointLightHelper(pointLight);
            // scene.add(helper);

            scene.add(pointLight);
            // scene.add(pointLight.target);
        }

    } else {
        // document.removeEventListener('mousemove',handleMouseMove)

        // 如果value为false，销毁之前创建的点光源
        if (pointLight) {
            scene.remove(pointLight);
            pointLight = null;
        }
        if (lightSphere) {
            scene.remove(lightSphere);
            lightSphere = null;
        }
        if (dragControls) {
            dragControls.dispose();
            dragControls = null;
        }
    }
}

export function setPointLightPower(power: number) {
    if (pointLight)
        pointLight.intensity = power;
}
export function setPointLightRange(range: number) {
    if (pointLight)
        pointLight.decay = range;
}
export function setPointLightColor(color: string) {
    if (pointLight) {
        pointLight.color.set(color);
    }
    if (lightSphere) {
        let material = lightSphere.material as THREE.MeshBasicMaterial;
        material.color.set(color);
    }
}
export function setLightBallVisible(bol: boolean) {
    if (lightSphere)
        lightSphere.visible = bol;
}
export function resetCameraPos() {
    // 在需要的时候重新设置摄像头的位置
    camera.position.set(0, 0, DEFAULT_CAMERA_Z);
    // 设置摄像头的旋转角度
    camera.rotation.set(0, Math.PI, 0);
}
export function setCameraControlEnable(bol: boolean) {
    controls.enabled = !bol;
}
export function setOrthographicMode(bol: boolean) {
    let cameraType = bol ? CameraType.OrthographicCamera : CameraType.PerspectiveCamera;
    setCamera(CameraUsage.MAIN, cameraType);
    //添加摄像头控制器 Add orbit controls
    setControl();
    //这里如果开启重置光照模式光照位置会出问题
    if (isRelightMode) {
        // 手动更新GUI的显示
        guiParams.relightMode = false;
        // gui_relightMode.updateDisplay();
        gui_relightMode._onChange(guiParams.relightMode);
        guiParams.relightMode = true;
        gui_relightMode.updateDisplay();
        gui_relightMode._onChange(guiParams.relightMode);
    }

}
// import circle_img from '@/public/logo.png';
let uiScene: THREE.Scene;
let uiCamera: THREE.OrthographicCamera;
let waterMarkSprite: THREE.Sprite;
let waterMarkSpriteWidth: number;
let waterMarkSpriteHeight: number;
// let uiCanvas: any;
export function addWaterMark() {

    // 创建一个新的摄像头
    uiScene = new THREE.Scene();
    setCamera(CameraUsage.UI,CameraType.OrthographicCamera)
    uiCamera.position.set(0, 0, 0);
    // 将UI摄像头添加到uiScene中
    uiScene.add(uiCamera);

    // 创建水印Sprite并添加到新摄像头的场景中
    const textureLoader = new THREE.TextureLoader();
    const spriteMaterial = new THREE.SpriteMaterial(
        {
            map: textureLoader.load(
                '/water_mark.png',
                function (loadedTexture) {
                    waterMarkSpriteWidth = loadedTexture.image.width;
                    waterMarkSpriteHeight = loadedTexture.image.height;
                    setWaterMarkPos();
                },
                undefined,
                function (error) {
                    console.error('纹理加载失败', error);
                }
            )
        })

    waterMarkSprite = new THREE.Sprite(spriteMaterial);
    uiScene.add(waterMarkSprite);
}
function setWaterMarkPos() {
    // warn("container2.clientWidth:" + container2.clientWidth)
    // warn("container2.clientHeight:" + container2.clientHeight)
    const spriteScale = 0.2; // 假设Sprite的缩放比例为0.2
    waterMarkSprite.scale.set(spriteScale, spriteScale, 0);
    if (canvas.width / canvas.height > 1) {
        let tempx = canvas.width / firstCanvasWidth;
        let tempy = canvas.height / firstCanvasHeight;
        let fixX = (canvas.width / canvas.height) * tempx;
        let fixY = -tempy;
        let spriteFixX = waterMarkSpriteWidth / canvas.width;
        let spriteFixY = waterMarkSpriteHeight / canvas.height;
        waterMarkSprite.position.set(fixX - 0.2, fixY + 0.2, -1); // 将图片设置在右下角
        // waterMarkSprite.position.set(canvas.width / canvas.height, -1, -1); // 将图片设置在右下角
    }
    else {
        // fixScale = canvas.height / canvas.width;
        // waterMarkSprite.position.set(1, -fixScale, -1); // 将图片设置在右下角
    }
    renderer.render(uiScene, uiCamera);
}
export function saveImage() {
    // this.renderer.domElement.width;
    // this.renderer.domElement.height;
    renderer.render(scene, camera);
    renderer.render(uiScene, uiCamera);
    let imgDataUrl = renderer.domElement.toDataURL();
    downloadImage(imgDataUrl, "downloaded_image.png")
}
function downloadImage(dataUrl: any, filename: string) {
    // 创建一个<a>元素
    let a = document.createElement('a');
    // 设置href属性为DataURL
    a.href = dataUrl;
    // 设置下载文件的名称
    a.download = filename;
    // 模拟点击<a>元素
    document.body.appendChild(a); // 先添加到文档中
    a.click(); // 然后模拟点击
    document.body.removeChild(a); // 最后移除这个元素
}
// 创建一个变量来存储录制状态
let isRecording = false;
let isSaveVideoRecording = false;
let mediaRecorder: MediaRecorder;
export async function saveVideo() {
    if (isRecording) {
        toast("Recording...Please try click 'Stop Recording'");
        return;
    }
    if (isSaveVideoRecording) {
        toast("Save Video Recording...Please try click 'Stop Recording'");
        return;
    }
    isSaveVideoRecording = true;
    resetDepthImg();
    startRecord();
    playDepthImg();
}
export function startRecording() {
    if (isSaveVideoRecording) {
        toast("Save Video Recording...Please try click 'Stop Recording'");
        return;
    }
    startRecord();
}
export function stopRecording() {
    stopRecord();
}
function startRecord() {
    if (!isRecording) {
        isRecording = true;
        // 获取<canvas>元素的视频流
        const stream = canvas.captureStream(OUT_FPS);
        // 创建MediaRecorder对象，指定视频流和选项
        mediaRecorder = new MediaRecorder(stream);
        // 定义存储录制数据的数组
        let chunks: Blob[] = [];
        // 监听数据可用事件，将数据存储到数组中
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        // 监听录制停止事件，保存录制的媒体内容到文件
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            // 创建一个链接并下载录制的视频
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recorded-video.webm';
            document.body.appendChild(a);
            a.click();

            // 释放资源
            URL.revokeObjectURL(url);
        };

        // 开始录制前的准备工作
        mediaRecorder.start();
        setStatus("Recording......");
        log("开始录制");
    } else {
        toast("Recording...Please try click 'Stop Recording'");
        log("已经在录制中");
    }
}
function stopRecord() {
    if (isRecording) {
        if (isSaveVideoRecording) isSaveVideoRecording = false;
        // 设置录制状态为false
        isRecording = false;
        // 停止录制
        mediaRecorder.stop();
        setStatus("End Recording");
        log("结束录制");
    } else {
        toast("Not Start Recording...Please try click 'Start Recording'");
        log("未开始录制");
    }
}

let depthPlane: THREE.Mesh;
let cylinder: any;
let thetaLength: number;//圆柱弧度
let depthMaterial: THREE.MeshStandardMaterial;
//是否沉浸式摄像头模式
let isImmersionMode = false;
export function setImmersionMode(bol: boolean) {
    isImmersionMode = bol;
    if (bol) {
        resetCameraPos();
        // camera.position.z = -0.25;
        if (cylinder) {
            depthPlane.visible = false;
            cylinder.visible = true;
        } else {
            depthPlane.visible = false;
            // 定义圆柱体的参数
            const thetaStart = -Math.PI*0.5;//-Math.PI//-Math.PI*0.75; // 起始角度为0度
            thetaLength = Math.PI*1;//Math.PI * 2//Math.PI*1.5; // 结束角度为180度，即半圆
            const cylinderHeight = 1;//thetaLength*radius;
            const cylinderWidth = targetWidth / targetHeight * cylinderHeight;
            const radius = cylinderWidth / thetaLength;//0.5;
            const radialSegments = 312;
            const heightSegments = 312;

            const openEnded = true; // 设置为true表示没有顶部和底部

            // 创建没有顶部和底部的圆柱体几何体
            const cylinderGeometry2 = new THREE.CylinderGeometry(radius, radius, cylinderHeight, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
            // 创建圆柱体网格对象
            cylinder = new THREE.Mesh(cylinderGeometry2, depthMaterial);
            cylinder.position.set(0, 0, 1);
            // 设置内部贴图的UV映射坐标
            cylinder.geometry.scale(1, 1, -1); // 反转UV映射以在内部显示贴图
            //在沉浸式环绕模式中，scale值越大，高度不变但图片的相对弧长会边长，所以需要添加一个系数来动态弥补图片的高度
            cylinder.scale.y = 1 + DEFAULT_SCALE * FIX_CYLINDER_SCALE;

            scene.add(cylinder);
        }

        resetDepthImg();
    }
    else {
        resetCameraPos();
        depthPlane.visible = true;
        cylinder.visible = false;
    }
}
let isDepthSkybox = false;
let skybox: THREE.Mesh;
export async function setSkyBox(selectedName: SkyBoxName) {
    if(selectedName == SkyBoxName.NONE){
        //移除当前的天空盒
        hasInvertedDepth = false;
        isDepthSkybox = false;
        currentImgObjType = ImgObjectType.DEPTH_PLANE;
        if(skybox){
            scene.remove(skybox);
        }
    }else if(selectedName == SkyBoxName.DIY){
        if(skybox){
            scene.remove(skybox);
        }
        isDepthSkybox = true;
        currentImgObjType = ImgObjectType.SKY_BOX;

        resetCameraPos();
        initImgObj(ImgObjectType.SKY_BOX, 1);
        // 创建一个天空盒材质
        let skyTexture = getImgObj(ImgObjectType.DEPTH_PLANE)[1][2]
        const skyboxMaterial = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide, // 设置材质为背面渲染
            map: skyTexture // 加载天空盒贴图
        });
        // 创建一个天空盒几何体
        // const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000); // 设置天空盒的尺寸
        const skyboxGeometry = new THREE.SphereGeometry(10, 1000, 1000,-Math.PI/2,2*Math.PI,0,Math.PI);
        
        //动态设置材质比例
        setSkyboxDisplacementScale = (scale: any) => {
            skyboxMaterial.displacementScale = scale;
            skyboxMaterial.needsUpdate = true;
        }
        let rawImgArr = [getImgObj(ImgObjectType.DEPTH_PLANE)[1][0]];
        depthRawImg(rawImgArr).then(
            () => {
                if(isDepthSkybox){
                    warn('done');
                    let skyDepth = skyBoxObj[1][1];
                    refreshImg(skyTexture,skyDepth);
                    setStatus("Loading SkyBox......." + 100 + "%........")
                    skyboxMaterial.displacementMap = new THREE.CanvasTexture(skyDepth.toCanvas());
                    skyboxMaterial.displacementScale = 2;
                    skyboxMaterial.needsUpdate = true;
                    skyboxGeometry.scale(1, 1, -1); // 反转UV映射以在内部显示贴图
                
                    // 创建一个天空盒网格对象
                    skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
                
                    // 将天空盒添加到场景中
                    scene.add(skybox);
        
                    //执行完全部图片后再调用这个 清空状态
                    hasInvertedDepth = false;
                    isDepthSkybox = false;
                    currentImgObjType = ImgObjectType.DEPTH_PLANE;
                }
            }
        );
    }else{
        if(skybox){
            scene.remove(skybox);
        }
        isDepthSkybox = true;
        currentImgObjType = ImgObjectType.SKY_BOX;
        let imgPath = '/'+selectedName+'.jpg';
        resetCameraPos();
        initImgObj(ImgObjectType.SKY_BOX, 1);
        // 创建一个天空盒材质
        let skyTexture = new THREE.TextureLoader().load(imgPath);
        const skyboxMaterial = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide, // 设置材质为背面渲染
            map: skyTexture // 加载天空盒贴图
        });
        // 创建一个天空盒几何体
        // const skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000); // 设置天空盒的尺寸
        const skyboxGeometry = new THREE.SphereGeometry(10, 1000, 1000,-Math.PI/2,2*Math.PI,0,Math.PI);
        
        //动态设置材质比例
        setSkyboxDisplacementScale = (scale: any) => {
            skyboxMaterial.displacementScale = scale;
            skyboxMaterial.needsUpdate = true;
        }
    
        let rawImg = await RawImage.fromURL(imgPath);
        let rawImgArr = [rawImg];
        depthRawImg(rawImgArr).then(
            () => {
                if(isDepthSkybox){
                    warn('done');
                    let skyDepth = skyBoxObj[1][1];
                    refreshImg(skyTexture,skyDepth);
                    setStatus("Loading SkyBox......." + 100 + "%........")
                    skyboxMaterial.displacementMap = new THREE.CanvasTexture(skyDepth.toCanvas());
                    skyboxMaterial.displacementScale = 2;
                    skyboxMaterial.needsUpdate = true;
                    skyboxGeometry.scale(1, 1, -1); // 反转UV映射以在内部显示贴图
                
                    // 创建一个天空盒网格对象
                    skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
                
                    // 将天空盒添加到场景中
                    scene.add(skybox);
        
                    //执行完全部图片后再调用这个 清空状态
                    hasInvertedDepth = false;
                    isDepthSkybox = false;
                    currentImgObjType = ImgObjectType.DEPTH_PLANE;
                }
            }
        );
    }
}
async function hasFp16() {
    try {
        // const adapter = await navigator.gpu.requestAdapter()
        // return adapter?.features.has('shader-f16')
        return true;
    } catch (e) {
        return false
    }
}
//获取depth_estimator单例  Xenova/depth-anything-small-hf 版本1  onnx-community/depth-anything-v2-small版本2
export async function getDepthEstimator() {
    // if (!depth_estimator) {
    //     depth_estimator = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
    //         quantized: QUANTIZED,
    //         session_options: {
    //             executionProviders: [executionProvidersStr]
    //         }
    //     });
    // }
    try {
        // const model_id = 'onnx-community/Xenova/depth-anything-small-hf';
        const model_id = 'onnx-community/depth-anything-v2-small';
        const dtype = (await hasFp16()) ? 'fp16' : 'fp32';

        depth_estimator = await pipeline("depth-estimation", model_id, {
            dtype: dtype,
            device: 'webgpu'
        });

        console.log("Depth estimator initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize depth estimator:", error);
        // 你可以在这里添加更多的错误处理逻辑，比如显示错误信息给用户
    }


    return depth_estimator;
}
let isPrepareDepth = false;
export async function prepareDepth() {
    //确保只执行一次
    if (isPrepareDepth) return;
    isPrepareDepth = true;
    warn("-------------------------prepareDepth------------------------------")
    const [w, h] = [224, 224];
    const c = 3;
    const arr = new Uint8ClampedArray(w * h * c);
    let depth_estimator = await getDepthEstimator();
    await depth_estimator(new RawImage(arr, w, h, c));
}

function getOffCanvas() {
    // 创建离屏canvas
    const createCanvas = () => new OffscreenCanvas(targetWidth, targetHeight);
    offscreenCanvas = createCanvas();
    return offscreenCanvas;
}
function getFrameAsRawImage(imageData: any) {

    // 封装为RawImage对象
    const data = imageData.data;
    const width = targetWidth;
    const height = targetHeight;
    const channels = 4; // RGBA

    return new RawImage(data, width, height, channels);
}
function videoDecodeFinish(rawImgArr: any[]) {
    //先按原来的异步阻塞来实现获取深度图 并保存到getImgObj(currentImgObjType)里面 建议后面采用多线程或者队列来批量调用深度化图片接口
    // 主线程逻辑  
    depthRawImg(rawImgArr).then(
        () => {
            warn('done');
            // initWeb();
            refreshImg(getImgObj(currentImgObjType)[1][2], getImgObj(currentImgObjType)[1][1])
        }
    );
}
async function processBatch(batch: any, batchOption: any) {
    warn("【processBatch】batch" + batch)
    try {
        // 请求获取深度图 
        const start = performance.now();
        let depth_estimator = await getDepthEstimator();
        if (!depth_estimator) {
            error("processBatch:get depth_estimator failed!!!")
            return;
        }
        const depthResults = await depth_estimator(batch);
        const end = performance.now();
        let webGPUTime = end - start;
        warn("获取深度图成功:" + depthResults)
        // warn(executionProvidersStr + "耗时:" + Math.round(webGPUTime) + 'ms')
        warn("耗时:" + Math.round(webGPUTime) + 'ms')
        curStatus += perStatus;
        Number(curStatus.toFixed(2));
        setStatus("Loading......." + curStatus + "%........")
        //兼容只有一张图片的情况 分批处理的时候有可能会出现这种情况
        if (!depthResults) {
            warn("【processBatch】处理的图片返回结果depthResults有问题")
        }
        else if (!Array.isArray(depthResults)) {
            const depth = depthResults.depth; // 假设返回的对象有一个'depth'属性
            // 下载深度图到本地
            if (isSaveDepth && depth.save) {
                depth.save('depth' + batchOption.id + '.png');
            }
            warn("获取深度图【" + batchOption.id + "】成功");
            warn(depth);
            if (getImgObj(currentImgObjType) && getImgObj(currentImgObjType)[batchOption.id]) { // 确保getImgObj(currentImgObjType)存在并且有对应的id属性
                getImgObj(currentImgObjType)[batchOption.id][1] = depth;
            }
            batchOption.id++;
            // return [id, depth];
        }
        else {
            warn("depthResults:" + depthResults)
            warn("Object.keys(depthResults).length:" + Object.keys(depthResults).length)
            // 依次处理每个深度结果
            const processedResults = depthResults.map((depthData, index) => {
                const depth = depthData.depth; // 假设返回的对象有一个'depth'属性
                // 下载深度图到本地
                if (isSaveDepth && depth.save) {
                    depth.save('depth' + batchOption.id + '.png');
                }
                warn("获取深度图【" + batchOption.id + "】成功");
                warn(depth);
                if (getImgObj(currentImgObjType) && getImgObj(currentImgObjType)[batchOption.id]) { // 确保getImgObj(currentImgObjType)存在并且有对应的id属性
                    getImgObj(currentImgObjType)[batchOption.id][1] = depth;
                }
                batchOption.id++;
                return [batchOption.id, depth];
            });
        }
    } catch (err: any) {
        toast.error("【processBatch】failed！！！");
        toast.error(err);
    }
}
async function depthRawImg(rawImgArr: any[]) {
    warn("开始获取深度图");
    try {
        const start = performance.now();
        let batchOption = { id: 1 }
        for (let i = 0; i < rawImgArr.length; i += MAX_DEPTH_IMG_BATCH_SIZE) {
            const batch = rawImgArr.slice(i, i + MAX_DEPTH_IMG_BATCH_SIZE);
            await processBatch(batch, batchOption);
            warn(`已完成第 ${(i / MAX_DEPTH_IMG_BATCH_SIZE) + 1} 批处理`);
        }
        const end = performance.now();
        let depthTime = end - start;
        // warn(executionProvidersStr + "总耗时:" + Math.round(depthTime) + 'ms')
        warn("总耗时:" + Math.round(depthTime) + 'ms')
        return true;
    } catch (err) {
        error("深度图请求处理失败！err:" + err);
        return []; // 返回一个空数组表示失败
    }
}
let isLoopVideo: boolean = false;
export function setLoopVideo(bol: boolean) {
    isLoopVideo = bol;
}
export function setStartSeconds(num: number) {
    if (typeof num === "number" && num >= 1) {
        OUT_START_SECONDS = Math.round(num);
    }
}
export function setTotalSeconds(num: number) {
    if (typeof num === "number" && num >= 1) {
        OUT_TOTAL_SECONDS = Math.round(num);
        OUT_TOTAL_FRAME = OUT_TOTAL_SECONDS * OUT_FPS;
    }
}
export function setFPS(num: number) {
    if (typeof num === "number" && num >= 1) {
        OUT_FPS = Math.round(num);
    }
}
let isPlaying: boolean = false;
let currentFrame: number = 1;
export function playDepthImg() {
    if (isPlaying) return;
    isPlaying = true;
    //把getImgObj(currentImgObjType)应用到场景里 写一个计时器来跑逻辑 要对应上帧数
    let timer = setInterval(() => {
        if (!isPlaying) {
            clearInterval(timer);
            return;
        }
        if (currentFrame >= OUT_TOTAL_FRAME) {
            if (isSaveVideoRecording) {
                clearInterval(timer);
                isPlaying = false;
                currentFrame = 1;
                stopRecord();
                isSaveVideoRecording = false;
                return;
            } else {
                if (isLoopVideo) {
                    currentFrame = 1;
                } else {
                    clearInterval(timer);
                    isPlaying = false;
                    currentFrame = 1;
                    return;
                }
            }
        }
        let depth = getImgObj(currentImgObjType)[currentFrame][1];
        let texture = getImgObj(currentImgObjType)[currentFrame][2];
        if (depth && texture) {
            refreshImg(texture, depth);
        }
        currentFrame++;
    }, 1000 / OUT_FPS);
}
export function pauseDepthImg() {
    isPlaying = false;
}
export function resetDepthImg() {
    isPlaying = false;
    currentFrame = 1;
    let depth = getImgObj(currentImgObjType)[currentFrame][1];
    let texture = getImgObj(currentImgObjType)[currentFrame][2];
    if (depth && texture) {
        refreshImg(texture, depth);
    }
}
let hasInvertedDepth = false;
function invertDepthData() {
    // 反转数据的所有值
    for (const key in getImgObj(currentImgObjType)) {
        // 检查是否是对象自有的属性
        if (getImgObj(currentImgObjType).hasOwnProperty(key)) {
            // 获取对应的值
            if (getImgObj(currentImgObjType)[key] && getImgObj(currentImgObjType)[key].length > 0) {
                for (let i = 0; i < getImgObj(currentImgObjType)[key][1].data.length; i++) {
                    getImgObj(currentImgObjType)[key][1].data[i] = 255 - getImgObj(currentImgObjType)[key][1].data[i]; // 假设数据是0-255范围内的值，这里做了简单的反转处理
                }
            }
        }
    }
}
function refreshImg(texture: any, depth: any) {
    try {
        if ((isImmersionMode || isDepthSkybox) && !hasInvertedDepth) {
            warn("---------------------invertDepthData-------------------------------")
            hasInvertedDepth = true;
            invertDepthData();
        } else if (!isImmersionMode && !isDepthSkybox && hasInvertedDepth) {
            warn("---------------------invertDepthData2-------------------------------")
            hasInvertedDepth = false;
            invertDepthData();
        }
        if(!isDepthSkybox){
            setImageMap(texture)
            setDisplacementMap(depth.toCanvas());
        }
    } catch (e) {
        error("【refreshImg】:" + e);
    }
}
function setCamera(cameraUsage: CameraUsage, cameraType: CameraType) {
    // 设置井深
    const fov = 60;
    // 假设 width 和 height 已经被定义，代表渲染区域的宽度和高度
    const aspect = canvas.width / canvas.height;
    // 选择一个合适的缩放系数，这个需要你根据实际情况调整
    const scale = 1.0; // 这个值控制视图的缩放级别
    // 计算正交相机的参数
    const left = -scale * aspect;
    const right = scale * aspect;
    const top = scale;
    const bottom = -scale;

    const near = 0.01; // 与透视相机的near相同
    const far = 200//30; // 与透视相机的far相同
    let curCamera;
    if (cameraUsage == CameraUsage.MAIN) {
        curCamera = camera;
    } else {
        curCamera = uiCamera;
    }
    if (cameraType == CameraType.OrthographicCamera) {
        if (!curCamera || (curCamera && !(curCamera instanceof THREE.OrthographicCamera))) {
            // 创建正交相机
            curCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
        } else if (curCamera instanceof THREE.OrthographicCamera) {
            curCamera.left = left;
            curCamera.right = right;
            curCamera.top = top;
            curCamera.bottom = bottom;
        }
    }
    else if (cameraType == CameraType.PerspectiveCamera) {
        if (!curCamera || (curCamera && !(curCamera instanceof THREE.PerspectiveCamera))) {
            //添加摄像头到场景 Create camera and add it to the scene
            curCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        } else if (curCamera instanceof THREE.PerspectiveCamera) {
            {
                curCamera.aspect = aspect;
                curCamera.updateProjectionMatrix();
            }
        }
        curCamera.position.z = DEFAULT_CAMERA_Z;
    }
    if (cameraUsage == CameraUsage.MAIN) {
        camera = curCamera;
    } else if (cameraUsage == CameraUsage.UI) {
        uiCamera = curCamera as THREE.OrthographicCamera;
    }
}
function setControl() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
}
// 设置场景
function setupScene(canvasHeight: number, canvasWeight: number) {
    warn("【setupScene】");

    //创建新的画布 Create new scene
    canvas = document.createElement('canvas');
    const width = canvas.width = canvasWeight;
    const height = canvas.height = canvasHeight;

    scene = new THREE.Scene();
    setCamera(CameraUsage.MAIN, CameraType.PerspectiveCamera);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: false });//,depthTexture: true,alpha: true
    renderer.shadowMap.enabled = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    //添加自然光照 Add ambient light
    // const light = new THREE.AmbientLight(0xffffff, 2); 备份
    const light = new THREE.AmbientLight(0xffffff, 2);
    scene.add(light);

    depthMaterial = new THREE.MeshStandardMaterial({
        // map: texture,
        side: THREE.DoubleSide,
        // transparent: true
    });

    depthMaterial.displacementScale = getDefaultScale();

    //裁切几何体指定点
    // material.needsUpdate = true;
    // material.alphaMap = alphaMask;
    // material.clipping = true;

    // //动态隐藏指定点显示
    // setImageOpacity = (alphaMap)=>
    // {
    //     warn("alphaMap:")
    //     warn(alphaMap)
    //     material.alphaMap = alphaMap; 
    //     material.transparent = true;
    // }

    //动态设置纹理
    setImageMap = (tex: any) => {
        depthMaterial.map = tex;
        depthMaterial.needsUpdate = true;
    }
    //动态设置材质高度贴图
    setDisplacementMap = (canvas: any) => {
        depthMaterial.displacementMap = new THREE.CanvasTexture(canvas);
        if (isImmersionMode) {
            // 调整UV映射以适应圆柱体几何形状
            depthMaterial.displacementMap.wrapS = THREE.ClampToEdgeWrapping;
            depthMaterial.displacementMap.wrapT = THREE.ClampToEdgeWrapping;
            depthMaterial.displacementMap.repeat.set(1, 1);
        }
        depthMaterial.needsUpdate = true;
    }
    //动态设置材质比例
    setDisplacementScale = (scale: any) => {
        depthMaterial.displacementScale = scale;
        depthMaterial.needsUpdate = true;
    }

    //自适配图片面板大小 并添加到场景中 Create plane and rescale it so that max(w, h) = 1
    const [pw, ph] = targetWidth > targetHeight ? [1, targetHeight / targetWidth] : [targetWidth / targetHeight, 1];
    const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(pw, ph, targetWidth, targetHeight);

    depthPlane = new THREE.Mesh(geometry, depthMaterial);
    // plane.castShadow = true;

    // 设置平面的位置
    depthPlane.position.set(0, 0, -1);
    scene.add(depthPlane);

    //添加水印
    addWaterMark();

    //添加摄像头控制器 Add orbit controls
    setControl();

    //渲染场景和摄像头 更新控制器
    if (renderer) {
        renderer.setAnimationLoop(() => {
            if (scene && camera)
                renderer.render(scene, camera);
            if (controls)
                controls.update();

            if (uiScene && uiCamera) {
                // 将HUD场景使用正交相机进行渲染
                renderer.autoClear = false;
                renderer.render(uiScene, uiCamera);
            }
        });
    }
    //添加摄像头刷新事件
    window.addEventListener('resize', onresize, false);
    // onresize();
}
function onresize() {
    const width = canvas.width = container2.clientWidth;
    const height = canvas.height = container2.clientHeight;
    // 假设 width 和 height 已经被定义，代表渲染区域的宽度和高度
    const aspect = width / height;
    // 选择一个合适的缩放系数，这个需要你根据实际情况调整
    const scale = 1.0; // 这个值控制视图的缩放级别
    // 重新计算正交相机的参数
    const left = -scale * aspect;
    const right = scale * aspect;
    const top = scale;
    const bottom = -scale;
    let mainCameraType = camera instanceof THREE.OrthographicCamera ? CameraType.OrthographicCamera : CameraType.PerspectiveCamera;
    if (camera instanceof THREE.OrthographicCamera) {
        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
    }
    else if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }
    setCamera(CameraUsage.MAIN, mainCameraType);
    setCamera(CameraUsage.UI, CameraType.OrthographicCamera);
    //适配水印位置
    setWaterMarkPos();

    uiCamera.updateProjectionMatrix();

    renderer.setSize(width, height);
}
let treeSceneNode: any;
export function setTreeSceneNode(node: any) {
    treeSceneNode = node;
}

function initCanvas() {
    if (!getCanvas()) {
        // canvas = setupScene(containerRef.current.clientHeight,containerRef.current.clientWidth)
        // 获取id为container2的div元素
        container2 = document.getElementById('container2');
        firstCanvasHeight = container2.clientHeight;
        firstCanvasWidth = container2.clientWidth;
        setupScene(container2.clientHeight, container2.clientWidth);
        treeSceneNode.innerHTML = '';
        treeSceneNode.append(getCanvas());
        // uiCanvas = document.createElement('canvas');
        // treeSceneNode.append(uiCanvas);
    } else {
        //todo update canvas
    }
}
function getRawImg(frame: any, rawImgArr: any[]) {
    //获取canvas
    getOffCanvas();
    // canvas = document.createElement('canvas');
    // canvas.width = videoWidth;
    // canvas.height = videoHeight;

    let ctx = offscreenCanvas.getContext('2d');
    // 绘制当前视频帧到canvas
    ctx.drawImage(frame, 0, 0, targetWidth, targetHeight);
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    // 翻转Y轴 (获取的Texture因为WebGL的坐标系统与Canvas 2D上下文的坐标系统不同)
    ctx.translate(0, targetHeight);
    ctx.scale(1, -1);
    // 绘制当前视频帧到canvas
    ctx.drawImage(frame, 0, 0, targetWidth, targetHeight);

    // 转换当前帧为RawImage
    const rawImg = getFrameAsRawImage(imageData);
    if (rawImg) {
        rawImgArr.push(rawImg);
        warn("push:");
        warn(rawImg);
    }
}
async function loadTexture(i: number) {
    //init getImgObj(currentImgObjType)
    getImgObj(currentImgObjType)[i + 1] = [];
    // 从OffscreenCanvas创建ImageBitmap
    const imageBitmap = await createImageBitmap(offscreenCanvas);
    const texture = new THREE.Texture(imageBitmap);
    texture.needsUpdate = true; // 当使用canvas作为纹理时，这个属性需要被设置为true
    log('Texture created from canvas:' + texture);
    // let url = "./" + i + ".jpg";
    // let texture2 = new THREE.TextureLoader().load(url);
    // warn("【" + (i + 1) + "】Texture本地加载成功")
    // warn(texture2)
    texture.colorSpace = THREE.SRGBColorSpace;
    getImgObj(currentImgObjType)[i + 1][2] = texture;
    warn("【" + (i + 1) + "】Texture获取成功")
    warn(texture)
}

//处理上传的视频文件
export async function dealVideo(file: any) {
    let rawImgArr: any[] = [];
    //init getImgObj(currentImgObjType)
    currentImgObjType = ImgObjectType.DEPTH_PLANE;
    initImgObj(ImgObjectType.DEPTH_PLANE, OUT_TOTAL_FRAME)

    //从上传的视频截取5秒 每秒4帧 共20帧图片转成RawImage格式 从第OUT_START_SECONDS秒开始截取
    // 创建视频元素  
    video = document.createElement('video') as HTMLVideoElement;
    video.src = URL.createObjectURL(file);
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    // video.load();
    video.addEventListener('loadedmetadata', async (e) => {
        let video = e.currentTarget as HTMLVideoElement;
        if (!video) return;

        targetWidth = video["videoWidth"];
        targetHeight = video["videoHeight"];
        //拿到视频尺寸立即初始化Canvas
        initCanvas();
        // 计算等比例缩放因子
        const scaleFactor = MAX_DIMENSION == -1 ? 1 : (Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight));

        // 如果需要，应用缩放因子
        if (scaleFactor < 1) {
            targetWidth *= scaleFactor;
            targetHeight *= scaleFactor;
            // 确保宽度和高度能被4整除
            targetWidth -= targetWidth % 4;
            targetHeight -= targetHeight % 4;
        }
        // 设置视频当前播放位置为输出开始时间

        // video.currentTime = OUT_START_SECONDS;
        video.currentTime = video.duration;
        // 当视频准备好播放指定时间帧时触发
        video.addEventListener('seeked', async () => {
            // 获取视频总帧数和帧率
            VIDEO_TOTAL_SECONDS = video.duration;
            const fps = FIX_FPS; // 因为获取不到视频帧数 按通用帧数来 一般是24-30之间 这里按30帧算
            const realTotalFrames = VIDEO_TOTAL_SECONDS * fps
            if (realTotalFrames < OUT_TOTAL_FRAME) {
                OUT_TOTAL_FRAME = realTotalFrames;
                OUT_TOTAL_SECONDS = OUT_TOTAL_FRAME / OUT_FPS;
            }
            if (OUT_START_SECONDS > VIDEO_TOTAL_SECONDS - OUT_TOTAL_SECONDS) {
                //如果设置的初始时间有问题将会被重置为0
                OUT_START_SECONDS = 0;
                OUT_START_FRAME = 0;
            }
            if (fps < OUT_FPS) {
                OUT_FPS = fps;
                OUT_START_FRAME = OUT_START_SECONDS * OUT_FPS;
                OUT_TOTAL_SECONDS = OUT_TOTAL_FRAME / OUT_FPS;
            }
            // 设置视频当前播放位置为输出开始时间
            video.currentTime = OUT_START_SECONDS;
            let rawPerStatus = 100 / (OUT_TOTAL_FRAME * 2);
            perStatus = Number(rawPerStatus.toFixed(2));
            curStatus = 0;
            for (let i = 0; i < OUT_TOTAL_FRAME; i++) {

                getRawImg(video, rawImgArr);

                // 将canvas转换为THREE.Texture
                if (!isLoadTexture) {
                    await loadTexture(i);
                }
                curStatus += perStatus;
                Number(curStatus.toFixed(2));
                setStatus("Loading......." + curStatus + "%........")
                // 设置下一帧的时间
                const nextFrameTime = OUT_START_SECONDS + (i + 1) / OUT_FPS;
                if (nextFrameTime < OUT_START_SECONDS + OUT_TOTAL_SECONDS) {
                    video.currentTime = nextFrameTime;
                    // 等待下一帧准备就绪
                    await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
                } else {
                    // 所有帧已捕捉完毕，可以在此做一些清理工作或者结束操作
                    videoDecodeFinish(rawImgArr)
                    break;
                }
            }
        }, { once: true });
    });
}
//处理上传的图片文件
export async function dealImg(img: any) {
    setStatus("Loading......." + 0 + "%........")
    let rawImgArr: any[] = [];
    //init getImgObj(currentImgObjType)
    currentImgObjType = ImgObjectType.DEPTH_PLANE;
    initImgObj(ImgObjectType.DEPTH_PLANE, OUT_TOTAL_FRAME);
    targetWidth = img.width;
    targetHeight = img.height;
    initCanvas();
    getRawImg(img, rawImgArr);
    await loadTexture(0);
    getImgObj(currentImgObjType)[1][0] = rawImgArr[0];
    depthRawImg(rawImgArr).then(
        () => {
            warn('done');
            // initWeb();
            refreshImg(getImgObj(currentImgObjType)[1][2], getImgObj(currentImgObjType)[1][1])
            setStatus("Loading......." + 100 + "%........")
        }
    );
}
function initImgObj(imgObjType: ImgObjectType, totalCount: number) {
    switch (imgObjType) {
        case ImgObjectType.DEPTH_PLANE:
            for (let i = 1; i <= totalCount; i++) {
                tempObj[i] = [];
            }
            break;
        case ImgObjectType.SKY_BOX:
            for (let i = 1; i <= totalCount; i++) {
                skyBoxObj[i] = [];
            }
            break;
        default:
            error("【getTempObj】Can't find Obj type:" + imgObjType);
    }
}
function getImgObj(imgObjType: ImgObjectType) {
    switch (imgObjType) {
        case ImgObjectType.DEPTH_PLANE:
            return tempObj;
        case ImgObjectType.SKY_BOX:
            return skyBoxObj;
        default:
            error("【getTempObj】Can't find Obj type:" + imgObjType);
            return {};
    }
}