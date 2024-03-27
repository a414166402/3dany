import { pipeline, env, DepthEstimationPipeline, RawImage} from "@a414166402/3dany";
// console.log("e-------------nv.backends.onnx-=--------");
// console.log(env);
// console.log(env.backends);
// console.log(env.backends.onnx);
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as ONNX_WEB from 'onnxruntime-web';

//修复ONNX核心 强制使用web环境
let ONNX;
const ONNX_MODULES = new Map();
// @ts-ignore
ONNX = ONNX_WEB.default ?? ONNX_WEB;
ONNX_MODULES.set('web', ONNX);

// Running in a browser-environment
const isIOS = typeof navigator !== 'undefined' && /iP(hone|od|ad).+16_4.+AppleWebKit/.test(navigator.userAgent);
if (isIOS) {
    ONNX.env.wasm.simd = false;
}
if (ONNX?.env?.wasm) {
    // Set path to wasm files. This is needed when running in a web worker.
    // https://onnxruntime.ai/docs/api/js/interfaces/Env.WebAssemblyFlags.html#wasmPaths
    // We use remote wasm files by default to make it easier for newer users.
    // In practice, users should probably self-host the necessary .wasm files.
    ONNX.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/`;
}
// ONNX.env.wasm = { proxy: true };
// ONNX.env.wasmPaths = ['https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/'];
ONNX.env.numThreads = 1;
console.warn("ONNX.env:")
console.warn(ONNX.env)
env.backends.onnx = ONNX.env;

console.warn("env:")
console.warn(env)
console.warn("env.backends:")
console.warn(env.backends)
console.warn("env.backends.onnx:")
console.warn(env.backends.onnx)
env.allowLocalModels = false;
env.experimental.useWebGPU = true;
let setStatus:any;
export function setInputSetStatus(fun:any)
{
    setStatus = fun;
}
//初始化onnx后端配置
export function initEnv()
{

}
// Constants
const MAX_DEPTH_IMG_BATCH_SIZE = 1;//处理一次深度图的最大打包数量 
// const EXAMPLE_URL = 'https://video.twimg.com/ext_tw_video/1751214622923976704/pu/vid/avc1/720x1280/pXx4rkujEbWicsv6.mp4?tag=12';
const EXAMPLE_URL = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/bread_small.png';
const DEFAULT_SCALE = 0.75;
export function getDefaultScale(): number{
    return DEFAULT_SCALE;
}
let USE_WEBGPU = true;
let OUT_FPS = 12;//输出视频的每秒帧数
let OUT_TOTAL_FRAME = 60;//输出视频的总帧数
let OUT_TOTAL_SECONDS = OUT_TOTAL_FRAME / OUT_FPS;//输出视频的总秒数
let OUT_START_SECONDS = 70;//从第几秒开始截取视频
let OUT_START_FRAME = OUT_START_SECONDS * OUT_FPS;//从第几帧数开始截取视频
let VIDEO_TOTAL_SECONDS = 0;//视频的总秒数
let MAX_DIMENSION = 500;//400;//锁定传入视频的最大宽高最大值
let videoWidth = 0;
let videoHeight = 0;
let setImageMap:any;//动态设置图片纹理的方法
export function setSetImageMap(map:any) {
    setImageMap = map;
}
let setDisplacementMap:any;//动态设置图片材质高度的方法
export function setSetDisplacementMap(map:any) {
    setDisplacementMap = map;
}
let setDisplacementScale;//动态设置图片材质缩放大小的方法
export function setSetDisplacementScale(map:any) {
    setDisplacementScale = map;
}
let setImageOpacity;//动态设置图片指定点的透明度

let video: HTMLVideoElement;
let offscreenCanvas:any;
let canvas:any;
export function getCanvas():any{
    return canvas;
}
export function setCanvas(cv:any){
    canvas = cv;
}
//    {id:[img,depth,texture]}
let tempObj: { [key: number]: any[] } = {}
let isSaveDepth = false;//是否开启保存深度图模式
let isLoadDepth = false;//是否开启读取本地深度图模式
let isLoadRawImg = false;//是否开启读取本地RawImg格式的图片 影响深度图的获取
let isLoadTexture = false;//是否开启读取本地图片Texture 影响图片的正确显示

const QUANTIZED = false;
let executionProvidersStr = USE_WEBGPU ? 'webgpu' : 'wasm';
let depth_estimator: DepthEstimationPipeline | null = null;
//获取depth_estimator单例
export async function getDepthEstimator() 
{
    if(!depth_estimator)
    {
        depth_estimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf', {
            quantized: QUANTIZED,
            session_options: {
                executionProviders: [executionProvidersStr]
            }
          });
    }

    return depth_estimator;
}
let isPrepareDepth = false;
export async function prepareDepth()
{
    //确保只执行一次
    if(isPrepareDepth) return;
    isPrepareDepth = true;
    console.warn("-------------------------prepareDepth------------------------------")
    const [w,h] = [224, 224];
    const c = 3;
    const arr = new Uint8ClampedArray(w * h * c);
    let depth_estimator = await getDepthEstimator();
    await depth_estimator(new RawImage(arr,w,h,c));
}
function initTempObj()
{
    for (let i = 1; i <= OUT_TOTAL_FRAME; i++) {
        tempObj[i] = [];
    }
}
function getOffCanvas() {
    // 创建离屏canvas
    const createCanvas = () => new OffscreenCanvas(videoWidth, videoHeight);
    offscreenCanvas = createCanvas();
    return offscreenCanvas;
}
async function getFrameAsRawImage(imageData:any) {

    // 封装为RawImage对象
    const data = imageData.data;
    const width = videoWidth;
    const height = videoHeight;
    const channels = 4; // RGBA

    return new RawImage(data, width, height, channels);
}
function videoDecodeFinish(rawImgArr:any[]) {
    //先按原来的异步阻塞来实现获取深度图 并保存到tempObj里面 建议后面采用多线程或者队列来批量调用深度化图片接口
    // 主线程逻辑  
    depthRawImg(rawImgArr).then(
        () => {
            console.warn('done');
            // initWeb();
            refreshImg(tempObj[1][2], tempObj[1][1])
        }
    );
}
async function processBatch(batch:any,batchOption:any) {
    console.warn("【processBatch】batch"+batch)

    // 请求获取深度图 
    const start = performance.now();
    let depth_estimator = await getDepthEstimator();
    if(!depth_estimator)
    {
        console.error("processBatch:get depth_estimator failed!!!")
        return;
    }
    const depthResults = await depth_estimator(batch);
    const end = performance.now();
    let webGPUTime = end - start;
    console.warn("获取深度图成功:" + depthResults)
    console.warn(executionProvidersStr+"耗时:" + Math.round(webGPUTime) + 'ms')
    curStatus+=perStatus;
    Number(curStatus.toFixed(2));
    setStatus("Loading......."+curStatus+"%........")
    //兼容只有一张图片的情况 分批处理的时候有可能会出现这种情况
    if(!depthResults)
    {
        console.warn("【processBatch】处理的图片返回结果depthResults有问题")
    }
    else if(!Array.isArray(depthResults))
    {
        const depth = depthResults.depth; // 假设返回的对象有一个'depth'属性
        // 下载深度图到本地
        if (isSaveDepth && depth.save) {
            depth.save('depth' + batchOption.id + '.png');
        }
        console.warn("获取深度图【", batchOption.id, "】成功");
        console.warn(depth);
        if (tempObj && tempObj[batchOption.id]) { // 确保tempObj存在并且有对应的id属性
            tempObj[batchOption.id][1] = depth;
        }
        batchOption.id++;
        // return [id, depth];
    }
    else
    {   
        console.warn("depthResults:"+depthResults)
        console.warn("Object.keys(depthResults).length:"+Object.keys(depthResults).length)
        // 依次处理每个深度结果
        const processedResults = depthResults.map((depthData, index) => {
            const depth = depthData.depth; // 假设返回的对象有一个'depth'属性
            // 下载深度图到本地
            if (isSaveDepth && depth.save) {
                depth.save('depth' + batchOption.id + '.png');
            }
            console.warn("获取深度图【", batchOption.id, "】成功");
            console.warn(depth);
            if (tempObj && tempObj[batchOption.id]) { // 确保tempObj存在并且有对应的id属性
                tempObj[batchOption.id][1] = depth;
            }
            batchOption.id++;
            return [batchOption.id, depth];
        });
    }

}
async function depthRawImg(rawImgArr:any[]) {
    console.warn("开始获取深度图");
    try {
        const start = performance.now();
        let batchOption = {id:1}
        for (let i = 0; i < rawImgArr.length; i += MAX_DEPTH_IMG_BATCH_SIZE) {
            const batch = rawImgArr.slice(i, i + MAX_DEPTH_IMG_BATCH_SIZE);
            await processBatch(batch,batchOption);
            console.warn(`已完成第 ${(i / MAX_DEPTH_IMG_BATCH_SIZE) + 1} 批处理`);
        }
        const end = performance.now();
        let depthTime = end - start;
        console.warn(executionProvidersStr+"总耗时:" + Math.round(depthTime) + 'ms')
        return true;
    } catch (err) {
        console.error("深度图请求处理失败！err:", err);
        return []; // 返回一个空数组表示失败
    }
}
let isPlaying = false;
export function playDepthImg() {
    if (isPlaying) return;
    isPlaying = true;
    //把tempObj应用到场景里 写一个计时器来跑逻辑 要对应上帧数
    let count = 0;
    let timer = setInterval(() => {
        if (count >= OUT_TOTAL_FRAME) {
            clearInterval(timer);
            isPlaying = false;
            return;
        }
        count++;
        let depth = tempObj[count][1];
        let texture = tempObj[count][2];
        if (depth && texture) {
            refreshImg(texture, depth);
        }
    }, 1000 / OUT_FPS);
}
function refreshImg(texture:any,depth:any) {
    try
    {
        setImageMap(texture)
        setDisplacementMap(depth.toCanvas());
    }catch(e)
    {
        console.error("【refreshImg】:"+e);
    }
}
// 设置场景
function setupScene(canvasHeight: number,canvasWeight: number) {
    console.warn("【setupScene】");
    //创建新的画布 Create new scene
    const canvas = document.createElement('canvas');
    const width = canvas.width = canvasWeight;
    const height = canvas.height = canvasHeight;
  
    const scene = new THREE.Scene();
  
    //添加摄像头到场景 Create camera and add it to the scene
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.01, 10);
    camera.position.z = 2.8;
    scene.add(camera);
  
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });//,depthTexture: true,alpha: true
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
  
    //添加自然光照 Add ambient light
    const light = new THREE.AmbientLight(0xffffff, 2);
    scene.add(light);
  
    const material = new THREE.MeshStandardMaterial({
        // map: texture,
        side: THREE.DoubleSide,
        // transparent: true
    });
  
    material.displacementScale = getDefaultScale();
  
    //裁切几何体指定点
    // material.needsUpdate = true;
    // material.alphaMap = alphaMask;
    // material.clipping = true;
  
    // //动态隐藏指定点显示
    // setImageOpacity = (alphaMap)=>
    // {
    //     console.warn("alphaMap:")
    //     console.warn(alphaMap)
    //     material.alphaMap = alphaMap; 
    //     material.transparent = true;
    // }
  
    //动态设置纹理
    setSetImageMap((tex:any) => {
        material.map = tex;
        material.needsUpdate = true;
    })
    //动态设置材质高度
    setSetDisplacementMap((canvas:any) => {
        material.displacementMap = new THREE.CanvasTexture(canvas);
        material.needsUpdate = true;
    })
    //动态设置材质比例
    setSetDisplacementScale((scale:any) => {
        material.displacementScale = scale;
        material.needsUpdate = true;
    })
  
    //自适配图片面板大小 并添加到场景中 Create plane and rescale it so that max(w, h) = 1
    const [pw, ph]  = videoWidth > videoHeight ? [1, videoHeight / videoWidth] : [videoWidth / videoHeight, 1];
    const geometry = new THREE.PlaneGeometry(pw, ph, videoWidth, videoHeight);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
  
    //添加摄像头控制器 Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
  
    //渲染场景和摄像头 更新控制器
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
        controls.update();
    });
  
    //添加摄像头刷新事件
    window.addEventListener('resize', () => {
        const width = canvasWeight;
        const height = canvasHeight;
  
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
  
        renderer.setSize(width, height);
    }, false);
  
    return canvas;
}
let treeSceneNode: any;
export function setTreeSceneNode(node:any)
{
    treeSceneNode = node;
}
function initCanvas()
{
    if(!getCanvas())
    {
        // canvas = setupScene(containerRef.current.clientHeight,containerRef.current.clientWidth)
        console.warn(treeSceneNode)
        canvas = setupScene(720,1280)
        setCanvas(canvas);
        treeSceneNode.innerHTML = '';
        treeSceneNode.append(getCanvas());
    }else
    {
        //todo update canvas
    }
}
//每一格子的进度
let perStatus: number;
//当前进度
let curStatus: number;
//处理上传的视频文件
export async function dealVideo(file: any)
{
    let rawImgArr:any[] = [];
    //init tempObj
    initTempObj()

    //从上传的视频截取5秒 每秒4帧 共20帧图片转成RawImage格式 从第OUT_START_SECONDS秒开始截取
    // 创建视频元素  
    video = document.createElement('video') as HTMLVideoElement;
    video.src = URL.createObjectURL(file);
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', async (e) => {
        let video = e.currentTarget as HTMLVideoElement;
        if(!video) return;
        videoWidth = video["videoWidth"];
        videoHeight = video["videoHeight"];
        //拿到视频尺寸立即初始化Canvas
        initCanvas();
        // 计算等比例缩放因子
        const scaleFactor = MAX_DIMENSION==-1?1:(Math.min(MAX_DIMENSION / videoWidth, MAX_DIMENSION / videoHeight));

        // 如果需要，应用缩放因子
        if (scaleFactor < 1) {
            videoWidth *= scaleFactor;
            videoHeight *= scaleFactor;
            // 确保宽度和高度能被4整除
            videoWidth -= videoWidth % 4;
            videoHeight -= videoHeight % 4;
        }
        // 设置视频当前播放位置为输出开始时间
        video.currentTime = OUT_START_SECONDS;

        // 当视频准备好播放指定时间帧时触发
        video.addEventListener('seeked', async () => {
            // 获取视频总帧数和帧率
            VIDEO_TOTAL_SECONDS = video.duration;
            const fps = 30; // 因为获取不到视频帧数 按通用帧数来 一般是24-30之间 这里按30帧算
            const realTotalFrames = VIDEO_TOTAL_SECONDS * fps
            if (realTotalFrames < OUT_TOTAL_FRAME) {
                OUT_TOTAL_FRAME = realTotalFrames;
                OUT_TOTAL_SECONDS = OUT_TOTAL_FRAME / OUT_FPS;
            }
            if (OUT_START_SECONDS > VIDEO_TOTAL_SECONDS - OUT_TOTAL_FRAME) {
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
            let rawPerStatus = 100/(OUT_TOTAL_FRAME*2);
            perStatus = Number(rawPerStatus.toFixed(2));
            curStatus = 0;
            for (let i = 0; i < OUT_TOTAL_FRAME; i++) {
                //获取canvas
                getOffCanvas();
                // canvas = document.createElement('canvas');
                // canvas.width = videoWidth;
                // canvas.height = videoHeight;

                let ctx = offscreenCanvas.getContext('2d');
                // 绘制当前视频帧到canvas
                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
                // 获取像素数据
                const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

                // 翻转Y轴 (获取的Texture因为WebGL的坐标系统与Canvas 2D上下文的坐标系统不同)
                ctx.translate(0, videoHeight);
                ctx.scale(1, -1);
                // 绘制当前视频帧到canvas
                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

                // 转换当前帧为RawImage
                const rawImg = await getFrameAsRawImage(imageData);
                if (rawImg) {
                    rawImgArr.push(rawImg);
                    console.warn("push:");
                    console.warn(rawImg);
                }
                // 将canvas转换为THREE.Texture
                // 从OffscreenCanvas创建ImageBitmap
                const imageBitmap = await createImageBitmap(offscreenCanvas);
                const texture = new THREE.Texture(imageBitmap);
                texture.needsUpdate = true; // 当使用canvas作为纹理时，这个属性需要被设置为true
                console.log('Texture created from canvas:', texture);

                //init tempObj
                tempObj[i + 1] = [];
                if (!isLoadTexture) {
                    // let url = "./" + i + ".jpg";
                    // let texture2 = new THREE.TextureLoader().load(url);
                    // console.warn("【" + (i + 1) + "】Texture本地加载成功")
                    // console.warn(texture2)
                    texture.colorSpace = THREE.SRGBColorSpace;
                    tempObj[i + 1][2] = texture;
                    console.warn("【" + (i + 1) + "】Texture获取成功")
                    console.warn(texture)
                    curStatus+=perStatus;
                    Number(curStatus.toFixed(2));
                    setStatus("Loading......."+curStatus+"%........")
                }

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