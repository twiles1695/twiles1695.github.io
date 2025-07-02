# Mkdocsのカスタマイズ方法

## Override

`overrides`フォルダを作成し、`main.html`を作成。

```html
{% extends "base.html" %}
{% block libs %}
  <!-- ここにheadタグのスクリプト -->
   <!-- Google Seach Consoleタグ -->
  <meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
  {{ super() }}
{% endblock %}
{% block scripts %}
  {{ super() }}
  <!-- ここにbody閉じタグ直前のスクリプト -->
{% endblock %}
```

## トラッキングコードの埋め込み

Material for Mkdocsのテーマでは、Google Tag Manager/Google Analyticsがデフォルトでサポートされている。
`mkdocs.yml`に下記の記述を追加することでheadタグ内に計測コードを設置できる。

```yml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX
```
`G-XXXXXXXXXX`にGTMのコードを入力する。

### 参考
[Material for MkdocsにCustomizationを使ってサイト分析ツールを導入してみた](https://dev.classmethod.jp/articles/site-analytics-tools-for-mkdocs/)