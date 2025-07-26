#JS Promiseチェーン

`then()`メソッドを使うと以下のように書ける。

```js
new Promise(resolve => {
    setTimeout(() => {
        console.log(5);
        resolve();
    }, 1000);
})
.then(() => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(4);
            resolve();
        }, 1000);
    });
})
.then(() => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(3);
            resolve();
        }, 1000);
    });
})
```

promiseを変数に格納することで、少しスッキリ書ける。

```js
const promiseObj = new Promise(resolve => {
    setTimeout(() => {
        console.log(5);
        resolve();
    }, 1000);
});

promiseObj.then(() => {
    setTimeout(() => {
        console.log(4);
    }, 1000);
});

// 複数回then()することもできる。
promiseObj.then(() => {
    setTimeout(() => {
        console.log('もう1個！');
    }, 1000);
});

```

さらにスッキリさせると

```js
const promiseMaker = num => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(num);
            resolve();
        }, 1000);
    });
};

promiseMaker(5)
  .then(() => promiseMaker(4))
  .then(() => promiseMaker(3))
  .then(() => promiseMaker(2))
  .then(() => promiseMaker(1))
  .then(() => promiseMaker(0));
```

## 参考文献

[4歳娘「パパ、Promiseやasync/awaitって何？」〜Promise編〜](https://qiita.com/Yametaro/items/0d29df53d9ac2a779595)