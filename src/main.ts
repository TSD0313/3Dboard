import * as THREE from 'three';
import { Tween } from 'createjs-module';
import BoardMesh from './genBoard'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { Object3D } from 'three';

const cardSize = {x:13.5,y:18,margin:3};
const mouseOveredMesh : {mesh:Object3D|"NoMesh"} = {mesh:"NoMesh"};

class Card extends THREE.Mesh {
    location:"MO"|"ST"|"FIELD"|"DECK"|"HAND"|"GY"|"DD";
    constructor(geometry: THREE.Geometry | THREE.BufferGeometry,material: THREE.Material | THREE.Material[]){
        super(geometry,material);
        this.location = "DECK";
    };
};

interface Interface_EventSwitch  {
    main : boolean,
    hopUp : boolean,
    mouseOver : boolean,
    click : boolean
};
const eventSwitch : Interface_EventSwitch = {
    main : true,
    hopUp : false,
    mouseOver : true,
    click : true
};
type eventKey = keyof Interface_EventSwitch;
const event_isValid = (arg : eventKey[]) :boolean => {
    return arg.map(k => eventSwitch[k] ).every(v => v==true );
};
const eventSwitch_turn = (targetArray:eventKey[], onoff:boolean) => {
    targetArray.forEach(k=>{
        eventSwitch[k] = onoff;
    });
};

// ページの読み込みを待つ
window.onload = function() {
    // サイズを指定
    const width = window.innerWidth;
    const height = window.innerHeight;

    // レンダラーを作成
    const mainCanv = <HTMLCanvasElement>document.querySelector('#myCanvas');
    const renderer = new THREE.WebGLRenderer({
      canvas: mainCanv,
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    // レンダラー側で影を有効に
    renderer.shadowMap.enabled = true;

    // シーンを作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#BBFFFF");

    // カメラを作成
    const camera = new THREE.PerspectiveCamera(70, width / height);
    camera.position.set( 0, 180, 180 );
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // 光源を作成
    const light = new THREE.SpotLight(0xFFFFFF, 1, 1000, Math.PI / 4, 10, 0.1);
    light.castShadow = true;
    light.position.set( 0, 150, 150 );
    light.lookAt(0,0,0)
    light.shadow.mapSize.width = 2048; 
    light.shadow.mapSize.height = 2048; 
    light.shadow.radius = 10;
    scene.add(light);

    const spotLightShadowHelper = new THREE.CameraHelper( light.shadow.camera);
    scene.add( spotLightShadowHelper);

    const spotLightHelper = new THREE.SpotLightHelper( light);
    scene.add( spotLightHelper);

    const axisHelper = new THREE.AxesHelper(1000);
    scene.add(axisHelper);

    // 初期化
    onResize();
    // リサイズイベント発生時に実行
    window.addEventListener('resize', onResize);
    function onResize() {
        // サイズを取得
        const width = window.innerWidth;
        const height = window.innerHeight;

        // レンダラーのサイズを調整
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);

        // カメラのアスペクト比を修正
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    scene.add(BoardMesh);

    const fontloader = new THREE.FontLoader();
    fontloader.load('fonts/helvetiker_regular.typeface.json',function (font) {
        const geo = new THREE.TextGeometry( '3D-BOARD',{font:font,size:1.5,height: 0.1,});
        geo.center();
        const mat = new THREE.MeshPhongMaterial({opacity:0.5,transparent:true});
        const mesh = new THREE.Mesh(geo,mat);
        camera.add(mesh);
        mesh.position.set(0,0,-15);
        mesh.lookAt(camera.position);
    });

    const genCardImgObj = (openImg:string)=>{
        const loader = new THREE.TextureLoader();
        const materialArray = [
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({color:"black"}),
            new THREE.MeshBasicMaterial({map: loader.load(openImg)}),
            new THREE.MeshBasicMaterial({map: loader.load("cardback.jpg" )}),
        ];
        const cardGeometry = new THREE.BoxGeometry(13.5, 18, 0.01);
        const hoge = new Card(cardGeometry,materialArray)
        hoge.rotation.x = -Math.PI/2;
        hoge.castShadow = true;
        hoge.receiveShadow = true;
        return hoge;
    };

    const AirmanA = genCardImgObj("Airman.jpg");
    AirmanA.position.set(25,1,25);
    AirmanA.location = "MO";
    scene.add(AirmanA);

    const cards :Card[] = [AirmanA];
    const board :Card[] = [AirmanA];
    const deck :Card[] = [];
    const hand :Card[] = [];
    const hopUp :Card[] = [];

    for (let i = 0; i < 40; i++) {
        const card = genCardImgObj("Airman.jpg");
        card.position.set(75, 1+0.2*(deck.length), 50);
        card.rotation.y = Math.PI;
        cards.push(card);
        deck.push(card);
        scene.add(card);
    };

    const mouse = new THREE.Vector2();
    mainCanv.addEventListener('mousemove', handleMouseMove);
    function handleMouseMove(event) {
        const element = event.currentTarget;
        // canvas要素上のXY座標
        const x = event.clientX - element.offsetLeft;
        const y = event.clientY - element.offsetTop;
        // canvas要素の幅・高さ
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        // -1〜+1の範囲で現在のマウス座標を登録する
        mouse.x = ( x / w ) * 2 - 1;
        mouse.y = -( y / h ) * 2 + 1;
    };
    
    // const cardDrag = new DragControls( board, camera, renderer.domElement );
    // cardDrag.addEventListener( 'dragstart', function ( event ) { controls.enabled = false; } );
    // cardDrag.addEventListener('drag', (event) => {
    //     event.object.position.y = 1;
    // });
    // cardDrag.addEventListener( 'dragend', function ( event ) { controls.enabled = true; } );

    const controls = new OrbitControls( camera, renderer.domElement );
    // controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    const raycaster = new THREE.Raycaster();
    renderer.domElement.addEventListener("click", onclick, true);
    function onclick(event) {
        raycaster.setFromCamera(mouse, camera);
        const cardIntersects = raycaster.intersectObjects(cards,true); 
        if (cardIntersects.length > 0) {
            const selectedCard = cardIntersects[0].object as Card;
            if(event_isValid(["main","click"])){
                click_Card[selectedCard.location](selectedCard);
            }else
            if(event_isValid(["hopUp","click"])){
                click_Card.HOPDOWN(selectedCard);
            };
        };
    };

    renderer.domElement.addEventListener("mousemove", mouseMove, true);
    function mouseMove(event) {
        if( !(event_isValid(["main","mouseOver"])) ){
            return
        };
        raycaster.setFromCamera(mouse, camera);
        const cardIntersects = raycaster.intersectObjects(cards,true); 
        if (cardIntersects.length > 0 ){
            const selectedCard = cardIntersects[0].object as Card;
            if(mouseOveredMesh.mesh != selectedCard){
                console.log("mouseOver");
                mouseOver_Card[selectedCard.location](selectedCard);
                if(mouseOveredMesh.mesh instanceof Card){
                    console.log("mouseOut");
                    mouseOut_Card[selectedCard.location](mouseOveredMesh.mesh);
                };
                mouseOveredMesh.mesh = selectedCard;
            };
        }else{
            if(mouseOveredMesh.mesh instanceof Card){
                console.log("mouseOut");
                const targetCard = mouseOveredMesh.mesh as Card;
                mouseOut_Card[targetCard.location](mouseOveredMesh.mesh);
                mouseOveredMesh.mesh = "NoMesh";
            };
        };
    };

    const mouseOver_Card = {
        DECK:(card:Card)=>{},
        HAND:(card:Card)=>{
            Tween.get(card.position,{override:true}).to({y:15+10*Math.sqrt(3),z:90+10},100,createjs.Ease.sineIn);
            Tween.get(card.scale,{override:true}).to({x:1.2,y:1.2},100,createjs.Ease.sineIn)
        }, 
        MO:(card:Card)=>{},
    };

    const mouseOut_Card = {
        DECK:(card:Card)=>{},
        HAND:(card:Card)=>{
            Tween.get(card.position,{override:true}).to({y:15,z:90},100,createjs.Ease.sineIn);
            Tween.get(card.scale,{override:true}).to({x:1,y:1},100,createjs.Ease.sineIn);
        },
        MO:(card:Card)=>{},
    };

    const click_Card = {
        DECK:(card:Card)=>{drawCard(1)},
        HAND:(card:Card)=>{zoomUp(card)},
        MO:(card:Card)=>{flipAnimation(card)},
        HOPDOWN:(card:Card)=>{zoomDown(card)},
    };

    const hopUpBack =  new THREE.Mesh(                                      
        new THREE.PlaneGeometry(200, 400),
        new THREE.MeshStandardMaterial({ 
        color:"black", transparent:true, opacity:0.0
        })
    );
    camera.add(hopUpBack);
    hopUpBack.visible = false;
    hopUpBack.position.set(0,0,-60);


    const zoomUp = (card:Card) => {
        eventSwitch_turn(["main"], false);
        eventSwitch_turn(["hopUp"], true);
        card.castShadow = false;
        hopUpBack.visible = true;
        Tween.get(card.position)
            .to({x:0, y:150, z:150},250,);
        Tween.get(card.scale)
            .to({x:1, y:1, z:1},250,)
            .call(()=>{
                Tween.get(hopUpBack.material).to({opacity:0.5},100)
            });
    };
    const zoomDown = async(card:Card) => {
        Tween.get(hopUpBack.material).to({opacity:0.0},100)
        await handAdjust();
        hopUpBack.visible = false;
        card.castShadow = true;
        eventSwitch_turn(["main"], true);
        eventSwitch_turn(["hopUp"], false);
    };

    const flipAnimation = (card:Card) => {
        Tween.get(card.position)
            .to({y:card.position.y+20},250,createjs.Ease.sineIn)
            .to({y:card.position.y},250,createjs.Ease.sineOut);
        Tween.get(card.rotation)
            .to({y:(-Math.PI-card.rotation.y),z:(-Math.PI/2-card.rotation.z)},500,createjs.Ease.sineInOut);
        return
    };

    const drawCard = async(count:number)=>{
        console.log("draw" + count);
        eventSwitch_turn(["main"], false);
        await (async () => {
            for (let i = 0; i < count ; i++){
                const target = deck.pop();
                hand.push(target);
                target.location = "HAND";
                await handAdjust();
            };
        })();
        eventSwitch_turn(["main"], true);
    };

    const handAdjust =  () => {
        console.log("adjust");
        const leftEndPosition = -( ( (cardSize.x+cardSize.margin)/2 ) * (hand.length-1) );
        const promiseArray = [];
        hand.forEach((card, i, array) => {
            const tweenPromise = (()=> {
                return new Promise((resolve, reject) => {
                    Tween.get(card.rotation)
                        .to({x:-Math.PI/4,y:0},500,createjs.Ease.sineIn);
                    Tween.get(card.position)
                    .to({
                        x:leftEndPosition + (cardSize.x+cardSize.margin)*i,
                        y:15,
                        z:90
                    },250,createjs.Ease.sineInOut)
                    .call(()=>{resolve()});
                });
            })();
            promiseArray.push(tweenPromise);
        });
        return Promise.all(promiseArray);
    };

    console.log(eventSwitch)

    tick();
    // 毎フレーム時に実行されるループイベント
    function tick() {
      // レンダリング
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
      controls.update();
    };
};