const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
let backImg;

const contentOverlay = document.getElementById('contentOverlay');
const frontBigImg = document.getElementById('front-image');
const backBigImg = document.getElementById('back-image');
const rightBigImg = document.getElementById('right-image');
const leftBigImg = document.getElementById('left-image');
const video = document.getElementById('video');
const bgContainer = document.getElementById('bgContainer');

let mouseX, scene = null, cubeModel = null, isMouseDown = false, isDragging = false, cubeFaceMat = false, rotation = 0, step = (Math.PI/4.00), envVolume = 0.03, gl = null, gl2 = null;

let meshArrayGlow = [],
meshArrayGlow2 = [],
meshArrayNotGlow = [],
materialsToAnimate = [],
cubeMesh = null,
animateCube = false

let timePointerDown, timePointerUp, camera;

let hasDragEnded = true;
// Add your code here matching the playground format
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.0, 0.0, 0.0, 1);
    //scene.createDefaultCamera(true);
    scene.environmentIntensity = 1;
    //BABYLON.MeshBuilder.CreateBox("box", {});

    //load Modelf
    BABYLON.SceneLoader.Append("./assets/", "cube_02.glb", scene, function (meshes) {

        gl = new BABYLON.GlowLayer("glow", scene, { 
            mainTextureSamples: 16,
            blurKernelSize: 280
        });

        gl.intensity = 1.1;

        // gl.intensity = 0;
        // gl2.intensity = 0;

        cubeModel = scene.meshes[0];
        cubeModel.rotationQuaternion = null
        scene.meshes[0].scaling.scaleInPlace(1);
        //scene.meshes[0].scaling.scaleInPlace(0.3);
        // scene.meshes[0].scaling = new BABYLON.Vector3(2,2,2);
        scene.meshes[0].position = new BABYLON.Vector3(0,0,0);
        gl.customEmissiveColorSelector = function(element, subMesh, material, result) {
            if (element.name === "White edge") {
                result.set(1, 1, 1, 1);
            }else if(element.name === "Green edge"){
                result.set(0, 1, 1, .5);
            }
            else {
                result.set(0, 0, 0, 0);
            }
        }
        scene.meshes.forEach(element => {
            console.log(element.name);
            if(element.name == 'Green_edge' || element.name == 'White_edge') {
                meshArrayGlow.push(element)
                    
            }else {
                meshArrayNotGlow.push(element)
            }
            if(element.name == 'concrete_floor')
                element.isVisible = false
            if(element.name == 'Plane')
                element.isVisible = false
        });
        
        // const mainAnim = scene.getAnimationGroupByName("All Animations");
        // mainAnim.play()
        
        // const cubeFaceMat = scene.getMaterialByName("glass");
        // console.log(cubeFaceMat);
        // cubeFaceMat.alpha = 0.

        scene.materials.forEach(element => {
            if(element.name == 'Material.005' || element.name == 'Material.006' || element.name == 'Material.007' || element.name == 'Material.008') {
                // // materialsToAnimate.push(element)
                element.environmentIntensity = 1
                element.emissiveIntensity = 1
                element.specularIntensity = 0
                element.hasAlpha = true
                element.alpha = .999
                element.alphaCutOff = 1
                element.MATERIAL_ALPHABLEND = true
                element.transparencyMode = element.MATERIAL_ALPHABLEND
                element.alphaMode = BABYLON.Engine.ALPHA_PREMULTIPLIED;
            }else {
                
                element.roughness = 0.13
            }
            
            if(element.name == 'Material.001') {
                element.emissiveIntensity = 3;
                element.metallic = 1
                element.roughness = 0
            }        
        });
        
        // scene.environmentTexture = new BABYLON.CubeTexture("environment.env", scene);

        var reflectionTexture = new BABYLON.HDRCubeTexture("./assets/reflection-map_8K.hdr", scene, 128, false, true, false, true);

        scene.environmentTexture = reflectionTexture
       
        var frontImg = new BABYLON.Texture("./assets/Front.jpeg", scene);
        //frontImg.invertY = false;
        backImg = new BABYLON.VideoTexture("video", "./assets/square_video.mp4", scene, true);
        backImg.video.muted = true;
        //backImg.invertY = true;
        var leftImg = new BABYLON.Texture("./assets/Left.jpeg", scene);
        leftImg.invertY = true;
        // var leftImgSpec = new BABYLON.Texture("./assets/signature-specularmap.jpg", scene);
        // leftImgSpec.invertY = true;
        // var rightImg = new BABYLON.Texture("./assets/Right.jpg", scene);
        // // rightImg.invertX = true;

        // scene.getMaterialByName('Material.005')._emissiveTexture = frontImg;
        // scene.getMaterialByName('Material.005')._albedoTexture = frontImg;
        // scene.getMaterialByName('Material.005').emissiveIntensity = 1.0;
        scene.getMaterialByName('Material.005').roughness = 0.15
        scene.getMaterialByName('Material.006').roughness = 0.15

        scene.getMaterialByName("Material.007")._emissiveTexture = backImg;
        scene.getMaterialByName("Material.007")._albedoTexture = backImg;
        scene.getMaterialByName('Material.007').emissiveIntensity = 1.0;
        
        scene.getMaterialByName('Material.008').roughness = 0.15

        // console.log(scene.getMaterialByName("Material.006"));
        // scene.getMaterialByName("Material.006")._ambientTexture = leftImgSpec;
        // scene.getMaterialByName("Material.006")._emissiveTexture = rightImg;
        // scene.getMaterialByName("Material.006")._albedoTexture = rightImg;
        // scene.getMaterialByName('Left_img.001').emissiveIntensity = 3.0;

        // scene.getMaterialByName("Right_img.001")._emissiveTexture = rightImg;
        // scene.getMaterialByName("Right_img.001")._albedoTexture = rightImg;
        // scene.getMaterialByName('Right_img.001').emissiveIntensity = 3.0;
        
        // Mirror
        // const light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.3, 0.3, 0));
        // light2.intensity = 0.04
        var light = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-6, 0, 0), new BABYLON.Vector3(8, -8, 0), Math.PI / 2, 12, scene);
        // light.diffuse = new BABYLON.Color3(1, 1, 1);
	    // light.specular = new BABYLON.Color3(1, 1, 1);
        // light.position = new BABYLON.Vector3(0, 0, 0);
        light.intensity = 1.1;
        // Mirror
        cubeMesh = scene.getMeshByName("Cube");
        // Mirror
        var mirror = BABYLON.Mesh.CreateBox("Mirror", 1.0, scene);
        mirror.scaling = new BABYLON.Vector3(500.0, 1, 500.0);
        mirror.material = new BABYLON.StandardMaterial("mirror", scene);
        mirror.material.color = new BABYLON.Color3.FromHexString("#000000");
        // mirror.material.emissiveIntensity = 0.4;
        mirror.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", {ratio: 1}, scene, true);
        mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -.52);
        mirror.material.reflectionTexture.renderList = meshArrayNotGlow.concat(meshArrayGlow);
        mirror.material.reflectionTexture.level = 1.05;
        mirror.material.reflectionTexture.adaptiveBlurKernel = 20;
        mirror.material.specularColor = new BABYLON.Color3(0, 0, 0);
        mirror.bumpTexture = new BABYLON.Texture("./assets/Seamless_Concrete_Floor_Texture_NORMAL.jpg", scene);
        mirror.useAlphaFromDiffuseTexture = true
        mirror.material.bumpTexture = new BABYLON.Texture("./assets/Glass_Frosted_001_normal.jpg", scene);
        mirror.position = new BABYLON.Vector3(0, -5, 0);
        mirror.environmentIntensity = 0	
        gl.addExcludedMesh(mirror);
        materialsToAnimate.push(mirror.material)
        
        const plane = BABYLON.Mesh.CreateBox("ground", 1.0, scene);
        plane.scaling = new BABYLON.Vector3(500.0, .1, 500.0);
        plane.position = new BABYLON.Vector3(0, -1.5, 0);
        plane.rotation.y = -Math.PI/2
        
        var pbr = new BABYLON.PBRMaterial("pbr", scene);
        plane.material = pbr;

        pbr.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        pbr.subSurface.useAlbedoToTintRefraction = true;
        pbr.albedoTexture = new BABYLON.Texture("./assets/concrete-polished.jpg", scene);
        pbr.diffuseTexture = new BABYLON.Texture("./assets/opacity-map.png", scene);

        // pbr.albedoTexture.uScale = 16;
        // pbr.albedoTexture.vScale = 16;
        pbr.metallic = 0.5;
        pbr.roughness = 0.4;
        pbr.hasAlpha = true
        pbr.alpha = .8
        pbr.environmentIntensity = 0
        // // Main material	

        // // Fog
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = scene.clearColor;
        scene.fogStart = 30.0;
        scene.fogEnd = 130.0;
        
        // // meshArrayNotGlow.forEach(element => {
        // //     gl.addExcludedMesh(element);
        // //     element.setEnabled(false)
        // // });

        // console.log(scene.meshes[0]);
    });

    camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    const c = Math.PI /2.0;
    camera.radius = 2.0;
    camera.lowerBetaLimit = c;
    camera.upperBetaLimit = c;

    camera.idleRotationWaitTime = 6000;
    camera.panningAxis = new BABYLON.Vector3(0,0,0);
    camera.angularSensibilityX = 10000;
    camera.angularSensibilityY = 10000;

    // camera.attachControl(canvas, true);
    // camera.inputs.remove(camera.inputs.attached.mousewheel);

    return scene;
};

scene = createScene(); //Call the createScene function

setTimeout(() => {
    animateCube = true
}, 1500);

//Audio
var music = new BABYLON.Sound("music", "./assets/envAudio.wav", scene,null, {
    volume: envVolume,
    loop: true
});

let musicPlayed = false

const mouseClick = new BABYLON.Sound("mouseClick", "./assets/mouse-click.wav", scene,null, {
volume: 0.2
});

//Audio
let animationIntervalTimer = 150
let animationCounter = 0
let animInterval = null
let totalAnimCount = 0

// function flickerAnimationInterval() {
//     animInterval = setInterval(() => {
//         // flickerAnimateCube()
//     }, animationIntervalTimer);
// }

// function flickerAnimateCube() {
//     if(scene != null && cubeModel != null) {
//         let cubeMesh = scene.getMeshByName("Cube");
//         if(animationCounter == 3) {
//         totalAnimCount++
//         meshArrayNotGlow.forEach(element => {
//             // element.setEnabled(true)
//         });
//         clearInterval(animInterval)
//         if(totalAnimCount == 1) {
//             gl.intensity = 0.1
//             meshArrayGlow.forEach(element => {
//             element.setEnabled(false)
//             });
//         }
//         if(totalAnimCount < 1) {
//             setTimeout(() => {
//             if(totalAnimCount == 0) {
//                 meshArrayNotGlow.forEach(element => {
//                     // element.setEnabled(false)
//                 });
//             }
//             meshArrayGlow.forEach(element => {
//                 element.setEnabled(false)
//             });
//             animationIntervalTimer = 220
//             animationCounter = -1
//             }, 1500);
//         }else {
//             animateEnvMapInt()
//         }
//         }else {
//         if(cubeMesh) {
//             meshArrayGlow.forEach(element => {
//             element.setEnabled(false)
//             });
//             setTimeout(() => {
//             meshArrayGlow.forEach(element => {
//                 element.setEnabled(true)
//             });
//             }, 75);
//             // animationIntervalTimer = +animationIntervalTimer - 100
//             animationCounter ++
//         }
//         }
//     }
// }

// setTimeout(() => {
//     flickerAnimationInterval()
// }, 1500);

function animateEnvMapInt() {
    // materialsToAnimate.forEach(element => {
    //     element.visibility = 0
    //     element.transparencyMode = 3
    // });
    // meshArrayGlow.forEach(element => {
    //     element.setEnabled(true)
    // });
    // setTimeout(() => {
    //     materialsToAnimate.forEach(element => {
    //     new TWEEN.Tween(element)
    //     .to({alpha : 1 }, 1500)
    //     .start(); 
    //     });
    // }, 500);

    // setTimeout(() => {
    //     const animation = new TWEEN.Tween(scene)
    //     .to({environmentIntensity : 0.35 }, 2000)
    //     .start() 
    // }, 1500);

    // new TWEEN.Tween(gl)
    // .to({intensity : 1 }, 2000)
    // .start()
    // .onComplete(function() {
    //     setTimeout(() => {
    //     //camera.attachControl(canvas, true);   
    //     camera.useAutoRotationBehavior = true;
    //     }, 4000);
    // }); 

}


// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {

    TWEEN.update();

    if(cubeModel && animateCube){
        cubeModel.rotation.y += 0.002
    }

    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

function toggleContentOverlay(){

    leftBigImg.children[0].pause();

    contentOverlay.style.opacity = 0;
    contentOverlay.style.zIndex = -1;

}


// Mouse interactions

let x = 0.0;
let easing = 0.01;
let modelRotation = 0

scene.onPointerDown = function(event){
    isMouseDown = true
    camera.useAutoRotationBehavior = false;
    mouseClick.play()
    mouseX = event.clientX
    animateCube = false

    if(!musicPlayed) {
        music.play()
        if(music.isPlaying) {
        musicPlayed = true
        setTimeout(() => {
            const musicInterval = setInterval(() => {
            if(envVolume <= 0) {
                clearInterval(musicInterval)
                music.stop()
            }
            envVolume -= 0.001
            music.setVolume(envVolume);
            }, 250);
        }, 7000);
        }
    }

    if(camera.radius == 2) {
        new TWEEN.Tween(camera)
        .to({radius : 1.95 }, 200)
        // .easing(TWEEN.Easing.Linear.InOut)
        .start(); 
    }

}

scene.onPointerUp = function () {
    let toAnimateCamera = false,
    cameraAlphaVal = null
    isMouseDown = false

    if(isDragging) {
        setTimeout(() => {
        isDragging = false
        }, 100);
    }

    setTimeout(() => {
        camera.useAutoRotationBehavior = true;
    }, 2500);
    if(!isDragging){

        var pickResult = scene.pick(scene.pointerX, scene.pointerY);

        if (pickResult.hit && !isDragging) {
            const clickedMeshName = pickResult.pickedMesh.name; 
            console.log(clickedMeshName);
            if(camera.radius != 1.7) {
                if(clickedMeshName === "image cube_primitive1" || clickedMeshName === "Front glass panel gold "){
                    console.log("animate");
                    toAnimateCamera = true
                    cameraAlphaVal = -Math.PI / 4.0;
                }else if(clickedMeshName === "back glass panel" || clickedMeshName === "back glass panel gold"){
                    toAnimateCamera = true
                    cameraAlphaVal = 3 * (Math.PI / 4.0);
                }else if(clickedMeshName === "Left glass panel" || clickedMeshName === "Left glass panel_gold" ){
                    toAnimateCamera = true
                    cameraAlphaVal = 5 * (Math.PI / 4.0);
                    backImg.video.currentTime = 0
                    backImg.video.muted = false

                }else if(clickedMeshName === "Right glass panel" || clickedMeshName === "Right glass panel gold"){
                    toAnimateCamera = true
                    cameraAlphaVal = Math.PI / 4.0;
                }else {
                    toAnimateCamera = false
                }

                if(toAnimateCamera) {
                    camera.useAutoRotationBehavior = false;
                    const rotation = ((~~(camera.alpha/(2*Math.PI)))* 2*Math.PI) + cameraAlphaVal
                    camera.detachControl(canvas, true);

                    new TWEEN.Tween(camera)
                    .to({alpha : rotation }, 1000)
                    .easing(TWEEN.Easing.Exponential.In)
                    .start(); 

                    new TWEEN.Tween(camera)
                    .to({radius : 1.7 }, 1500)
                    .easing(TWEEN.Easing.Exponential.In)
                    .start(); 
                }
            }else if(camera.radius != 2) {
                new TWEEN.Tween(camera)
                .to({radius : 2.0 }, 1200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start(); 
                setTimeout(() => {
                    animateCube = true  
                    backImg.video.muted = true
                }, 1000);
            }


        }else {
            if(camera.radius != 2) {
                new TWEEN.Tween(camera)
                .to({radius : 2.0 }, 1200)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start(); 
                setTimeout(() => {
                    animateCube = true
                    backImg.video.muted = true
                }, 1000);
            }
        }

    }else{
        new TWEEN.Tween(camera)
        .to({radius : 2.0 }, 200)
        // .easing(TWEEN.Easing.Linear.InOut)
        .start();
    }


    if(backImg) {
        backImg.video.play();
    }


    //setTimeout(() => {
        //isDragging = false;
    //}, 300);

    //rotation = Math.round(cubeModel.rotation.y / step) * step; 

    /*new TWEEN.Tween(cubeModel.rotation)
    .to({y: rotation }, 600)
    .easing(TWEEN.Easing.Back.Out)
    .onComplete(() => {
        
    })
    .start(); */

}

function idlBehav() {
    animateCube = true
}

let moveIdleTimer = null

scene.onPointerMove = function(event){
    if(camera.radius == 15 && !isDragging) {
        clearTimeout(moveIdleTimer)
        moveIdleTimer = setTimeout(idlBehav, 2000);
    }

    if(isMouseDown) {
        isDragging = true
        bgContainer.classList.add('active')
    }else {
        bgContainer.classList.remove('active')
    }
    
    let direction = -1
    if((event.offsetX - mouseX) < 0) {
        direction = 1
    } 
    
    const delta = -(event.offsetX - mouseX)
    /*if(Math.abs(delta) > 0.01){
        isDragging = true;
    }*/
    
    if(isDragging){
        animateCube = false
        // const rotation = (cubeModel.rotation.y - (0.25 * delta * 100) - x);
        modelRotation = cubeModel.rotation.y + ((delta * 0.04));

        const animation = gsap.fromTo(cubeModel.rotation, 
            {
                y: cubeModel.rotation.y
            },
            {
                y: modelRotation,
                duration: 1.2,
                ease: "power2.out"
            }
        )

        // cubeModel.rotation.y = x
        // new TWEEN.Tween(cubeModel.rotation)
        // .to({y : rotation }, 50)
        // .easing(TWEEN.Easing.Sinusoidal.InOut)
        // .start();
        
    }
    mouseX = event.offsetX;

}

// document.addEventListener('pointerdown', pointerd)

// Mouse interactions