import * as THREE from "./build/three.module.js";
import { OrbitControls } from "./controls/OrbitControls.js";
import { TextGeometry } from "./geometries/TextGeometry.js";
import { OBJLoader } from './loaders/OBJLoader.js';

var vertexHeight = 15000;
var planeDefinition = 100;
var planeSize = 1245000;
var totalObjects = 1000000;
var shipspeed = .1;
var cx = 0, cy = 0, cz = 0;

var container = document.createElement('div');
document.body.appendChild( container );

var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 400000);
camera.position.z = 550000;
camera.position.y = 10000;
camera.lookAt( new THREE.Vector3(0,100000,0) );

var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xF7F7F7 );
scene.fog = new THREE.Fog( 0xF7F7F7, 1, 300000 );

var spotLight = new THREE.SpotLight( 0xF7F7F7 );
spotLight.position.set( 0, 10000, camera.position.z +4000 );
scene.add( spotLight );

// 平行光源を作成
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 10000, 10000).normalize();
scene.add(light);

// 照明を可視化するヘルパー
const lightHelper = new THREE.DirectionalLightHelper(light);
lightHelper.position.set(0, 10000, camera.position.z - 400);
scene.add(lightHelper);

// 地平
var	plane = new THREE.Mesh(
              new THREE.PlaneBufferGeometry( planeSize, planeSize, planeDefinition, planeDefinition ),
              new THREE.MeshBasicMaterial( { color: 0xA9894B, wireframe: false } )
            );
plane.rotation.x -=Math.PI*.5;
scene.add( plane );

var ship;

function onProgress( xhr ) {
  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
}
function onError( error ) {
  console.log( 'An error happened' );
}

// 3Dモデルの読み込み
const loader = new OBJLoader();
loader.load('./js/models/paper_airplane.obj', function ( object ) {
  ship = object;
  ship.scale.set(1000,1000,1000);
  ship.rotation.set(0,0,0);
  ship.position.z = camera.position.z -400;
  ship.position.y = camera.position.y -100;
  scene.add( ship );
  render();
}, onProgress, onError);

function render() {
  requestAnimationFrame( render );
  camera.position.z -= 150;
  ship.position.z -= 152;

  handleKeys();

  ship.position.x -= cx;
  ship.position.y -= cy;

  renderer.render( scene, camera );
}

  //頂点数を設定
  var geometry = new THREE.BufferGeometry();
  let positions = new Float32Array(totalObjects*3);

  for(let i = 0; i < totalObjects; i++){
    positions[i] = Math.random()*planeSize-(planeSize*.5);
    positions[i+1] = Math.random()*1000000;
    positions[i+2] = Math.random()*planeSize-(planeSize*.5);
  }

  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  var material = new THREE.PointsMaterial( { //Pointsオプション
        size: 200,
        color: 0xA9894B
      });
  var particles = new THREE.Points( geometry, material ); //引数にgeometryとmaterialが必要

  scene.add( particles ); //シーンに追加


var renderer = new THREE.WebGLRenderer({
  alpha: true,
  canvas: document.querySelector('#canvas')
  });
renderer.setSize(window.innerWidth, window.innerHeight);

updatePlane();
function updatePlane() { //書き出した時に、平面ジオミトリの頂点を山にする。
  for (var i = 0; i < plane.geometry.attributes.position.array.length; i++) // 平面ジオミトリの頂点の数の分だけ繰り返す
  {
    plane.geometry.attributes.position.array[i] += Math.random()*vertexHeight -vertexHeight;  //z軸をランダムにする。
  }
 };

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  var currentlyPressedKeys = {};

  function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
  }

  function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
    ship.rotation.z = 0;
    ship.rotation.x = 0;
  }

function handleKeys() {
  if (currentlyPressedKeys[65] || currentlyPressedKeys[37]) {
    ship.rotation.z = .5;
    cx += shipspeed;
  }

  if (currentlyPressedKeys[68] || currentlyPressedKeys[39]) {
    ship.rotation.z = -.5;
    cx -= shipspeed;
  }
  if (currentlyPressedKeys[87] || currentlyPressedKeys[38]) {

    ship.rotation.x = .25;
    cy -= shipspeed;
  }

  if (currentlyPressedKeys[83]  || currentlyPressedKeys[40]) {

    ship.rotation.x = -.25;
    cy += shipspeed;
  }
}

// 初期化のために実行
onResize();
// リサイズイベント発生時に実行
window.addEventListener('resize', onResize);

function onResize() {
  // サイズを取得
  const width = window.innerWidth;
  const height = window.innerHeight;

  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
