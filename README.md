# 千本鳥居の向こう側

京都・伏見稲荷の千本鳥居をくぐると、その日の夕方に戻れる。祇園祭の宵山の夜、事故に遭う幼なじみを救うために、戻れるのは三度まで。約15分で遊べる短編ループノベルです。

登録不要で、ブラウザで開くだけで遊べます。HTML・CSS・JavaScriptだけで動き、ビルドは不要です。

## 遊び方

- タップ、クリック、スペースキー、Enterキーで文章を進めます
- 選択肢で物語が分岐します（エンディングは3つ）
- 進行は自動でブラウザに保存され、「つづきから」で再開できます

## ローカルで動かす

```sh
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## GitHub Pages で公開する

リポジトリの Settings → Pages で、Source を「Deploy from a branch」、Branch を `main` の `/ (root)` にして保存します。数分後に `https://yumuras.github.io/sample_game/` で遊べるようになります。

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | 画面の骨組み |
| `css/style.css` | 見た目 |
| `js/scenario.js` | シナリオ（ここを書き換えれば物語が変わる） |
| `js/assets.js` | 背景と立ち絵の設定 |
| `js/engine.js` | 文字送り、選択肢、セーブなどの仕組み |

## 絵を差し替える

今は仮の絵（グラデーションの背景とシルエットの立ち絵）です。`images/` に画像を置き、`js/assets.js` の `image` にパスを書くと差し替わります。

```js
clubroom: { label: "大学・民俗学サークル部室", image: "images/bg/clubroom.jpg", ... },
akari: { name: "葉月 灯", image: "images/chara/akari.png", ... },
```

立ち絵は背景が透明なPNG（縦長）がおすすめです。

## シナリオの書き方

`js/scenario.js` の各シーンは、命令を順番に並べた配列です。一つの命令に複数の項目を書くこともできます。

| 項目 | 例 | 意味 |
| --- | --- | --- |
| `text` | `{ text: "地の文" }` | 文章を表示してクリックを待つ |
| `name` | `{ name: "灯", text: "セリフ" }` | 話している人の名前 |
| `bg` | `{ bg: "clubroom" }` | 背景を切り替える |
| `show` | `{ show: { akari: "right" } }` | 立ち絵を出す（`left` / `center` / `right`） |
| `hide` | `{ hide: "akari" }` / `{ hide: "all" }` | 立ち絵を消す |
| `time` | `{ time: "7月16日 20:58" }` | 画面左上の時刻 |
| `torii` | `{ torii: 2 }` | 戻れる回数（画面右上の鳥居マーク） |
| `effect` | `{ effect: "flash" }` / `{ effect: "torii" }` | 演出 |
| `set` | `{ set: { foundCharm: true } }` | フラグを立てる |
| `choice` | `{ choice: [{ text: "…", goto: "シーン名" }] }` | 選択肢。`set` や `if`（フラグが立っている時だけ出す）も書ける |
| `goto` | `{ goto: "loop2" }` | 別のシーンへ移る |
| `ending` | `{ ending: "true" }` | エンディング（`endings` に登録したもの） |

各シーンは必ず `goto`、`choice`、`ending` のどれかで終わるようにしてください。
