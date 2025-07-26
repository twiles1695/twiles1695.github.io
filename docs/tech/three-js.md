# Three.js

## canvasのid指定
htmlでcanvasにidを振っておき、scriptの方で以下のように指定する。
```javascript
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas')
   });
```

> 参考｜[簡単なThree.jsのサンプルを試そう](https://ics.media/tutorial-three/quickstart/)


## メッシュをハイパーリンクにする

3D空間上のオブジェクトをマウスでクリックするには、レイキャスト機能で光線を飛ばして、交差したオブジェクトを取得します。

>参考
>[Three.jsでオブジェクトをクリック](https://www.pentacreation.com/blog/2022/02/220226.html)
>[Three.jsでオブジェクトとの交差を調べる](https://ics.media/tutorial-three/raycast/)


### マウス座標の取得

```javascript
//canvasを取得
const container = document.querySelector('#canvas');
let mouse;
 
setControll();
 
function setControll(){
 
    //マウス座標管理用のベクトル
    mouse = new THREE.Vector2();
 
    //マウスイベントを登録
    container.addEventListener('mousemove',handleMouseMove);
 
    function handleMouseMove(event){
        const element = event.currentTarget;
 
        //canvas上のマウスのXY座標
        const x = event.clientX - element.offsetLeft;
        const y = event.clientY - element.offsetTop;
 
        //canvasの幅と高さを取得
        const w = element.offsetWidth;
        const h = element.offsetHeight;
 
        //マウス座標を-1〜1の範囲に変換
        mouse.x = (x/w)*2-1;
        mouse.y = -(y/h)*2+1;
    }
}
```

### オブジェクトをクリック

```javascript
let mouse;
let raycaster;
let clickFlg = false;
let moveFlg = false;
 
setControll();
 
function setControll(){
    mouse = new THREE.Vector2();
 
    //レイキャストを生成
    raycaster = new THREE.Raycaster();
    container.addEventListener('mousemove',handleMouseMove);
 
    //マウスイベントを登録
    container.addEventListener('click',handleClick);
 
    function handleMouseMove(event){
        moveFlg = true;
        const element = event.currentTarget;
        const x = event.clientX - element.offsetLeft;
        const y = event.clientY - element.offsetTop;
        const w = element.offsetWidth;
        const h = element.offsetHeight;
        mouse.x = (x/w)*2-1;
        mouse.y = -(y/h)*2+1;
    }
 
    function handleClick(event){
        if(clickFlg){
            // 開きたいURLを指定
            window.open('https://www.example.com');
        }
    }
}
 
function rendering(){
    requestAnimationFrame(rendering);
 
    //マウス位置からまっすぐに伸びる光線ベクトルを生成
    raycaster.setFromCamera(mouse,camera);
 
    //光線と交差したオブジェクトを取得
    const intersects = raycaster.intersectObjects(scene.children,false);
 
    //光線と交差したオブジェクトがある場合
    if(intersects.length > 0){
 
        //交差したオブジェクトを取得
        const obj = intersects[0].object;
 
        //光線が球体と交差していた場合
        if(obj.name == 'spehere'){
            if(moveFlg){
                clickFlg = true;
            }
        }else{
            clickFlg = false;
        }
    }else{
        clickFlg = false;
    }
 
    renderer.render(scene,camera);
}
```

### オブジェクトホバー時にオブジェクトのカラーを変える
```javascript
  function rendering(){
    requestAnimationFrame(rendering);
 
    //マウス位置からまっすぐに伸びる光線ベクトルを生成
    raycaster.setFromCamera(mouse,camera);
 
    //光線と交差したオブジェクトを取得
    const intersects = raycaster.intersectObjects(scene.children,false);
 
    //光線と交差したオブジェクトがある場合
    if(intersects.length > 0){
 
        //交差したオブジェクトを取得
        const obj = intersects[0].object;
 
        //光線が対象と交差していた場合
        if(obj.name == 'hyperlink'){
            if(moveFlg){
                obj.material.color.setHex(0x096fc8);
                clickFlg = true;
            }
        }else{
            clickFlg = false;
            text.material.color.setHex(0x333333);
            console.log(obj.material.color);
        }
    }else{
        clickFlg = false;
        text.material.color.setHex(0x333333);
    }

    renderer.render(scene,camera);
  }
  ```

### オブジェクトホバー時にマウスをポインターにする

```
    if(clickFlg){
        container.style.cursor = 'pointer';
    }else{
        container.style.cursor = 'grab';
    }
```

## Vector3
3D空間に点や線を描画できる。
[Vector3](https://threejs.org/docs/#api/en/math/Vector3)

## PlaneGeometry

平面のジオメトリでよく地面に使われる。

```javascript
PlaneGeometry ( width, height , widthSegments, heightSegments )
```

> 参考｜[Three.js　PlaneGeometry（平面）](https://gupuru.hatenablog.jp/entry/2013/12/11/183541)