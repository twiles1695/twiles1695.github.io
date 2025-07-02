# Makefile

## 出会いの経緯

Docker-laravel環境構築で[参考にしたリポジトリ](https://github.com/ucan-lab/docker-laravel)がMakefileを使用していた。

## Makefileとは

- make は特定のプログラミング言語に依存したものではない
- C 言語のソースファイルのコンパイルにも使えるし、Texのコンパイルにも使える

- シェルスクリプトで実行することも可能だが、リポジトリ化して他者が使えるようにするという点でメリットがある。

## makeの種類

- Microsoft nmake (Windows)
- Borland make (Windows)
- GNU make (windows, UNIX 系)
- Solaris make (Solaris)

[Makefile の書き方 (C 言語)](https://ie.u-ryukyu.ac.jp/~e085739/c.makefile.tuts.html)


## コマンド

```
ターゲット:依存するファイル
	コマンド
```

```
$ make (ターゲット)
```

## 疑問
なぜ何もインストールしていないのに使えるのか？


## 参考

[トリビアなmakefile入門](http://www.jsk.t.u-tokyo.ac.jp/~k-okada/makefile/)

