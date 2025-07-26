
# Google FormをWebサイトに埋め込む デザインありバージョン

## 必要なもの

以下２つがわかれば簡単に実装できる。

- formのactionのアドレス
- name属性


## バリデーション

ただし、バリデーションは自分でHTML5を使うか、JSで実装する必要がある。

HTMLのバリデーションはあまり当てにならない。

- 開発者ツールでタグを書き換えられたら簡単にクリアできる（検証済み）
- ブラウザによって対応が違う（safariは対応していない）

会社名：最大50文字
名前：最大50文字
電話番号：11桁か「3〜4桁 - 3〜4桁 - 4桁」であればOK
e-mail：＠マークと、ドットが最低限必要
最大50文字


> 参考｜[Google Formで作成したフォームをアレンジする（submit後のページ遷移も！）](https://zenn.dev/sekaino_usay/articles/4120d220c1b67e)


## フォーム送信後の遷移先指定

遷移後のページを指定する場合は以下2つを追加する。

1. `</form>`タグの属性に以下を追加。

     ```html
     target="hidden_iframe" onsubmit="submitted=true;"
     ```

2. フォームの終了タグ`</form>`の直前に以下を追加。

```html
<script type="text/javascript">
var submitted = false;
</script>

<iframe name="hidden_iframe" id="hidden_iframe" style="display:none;" onload="if(submitted){window.location='thanks.html';}"></iframe>
```

この場合はthanks.htmlに遷移する。

## 保存用コード

validとinvalidの状態をCSSで使えるのはわかったが、必須に対して最初からinvalidと判定してしまうので現時点では使え無さそう。

      <p class="error">必須項目です</p>

      <p class="error">正しい電話番号の形式をご入力ください</p>
      <p class="error">正しいメールアドレスをご入力ください</p>

  label input[type=text]:valid {
    border-color: $color-success;
  }
  .error {
    display: none;
    color: $color-alert;
  }
  input:invalid + .error,
  textarea:invalid + .error {
    display : block;
  }


