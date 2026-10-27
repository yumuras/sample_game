# 千本鳥居の向こう側

京都・伏見稲荷の千本鳥居をくぐると、その日の夕方に戻れる。祇園祭の宵山の夜、事故に遭う幼なじみを救うために、戻れるのは三度まで。約15分で遊べる短編ループノベルです。

登録不要で、ブラウザで開くだけで遊べます。Steam などで配るためのデスクトップ版（Electron）も作れます。React と TypeScript で書いていて、Vite でビルドします。

## 遊び方

- タップ、クリック、スペースキー、Enterキーで文章を進めます
- 選択肢で物語が分岐します（エンディングは3つ）
- 進行は自動で保存され、「つづきから」で再開できます

## 開発の準備

Node.js（22.12 以上）と pnpm が必要です。最初に一度だけ、次を実行します。

```sh
pnpm install
```

## よく使うコマンド

| コマンド         | やること                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| `pnpm dev`       | ブラウザ版を起動（表示された http://localhost:5173 を開く）                |
| `pnpm dev:app`   | アプリのウィンドウで起動。どちらも、コードを保存するとすぐ画面に反映される |
| `pnpm start`     | ビルドしてからアプリで起動（配る物と同じ状態で確認する）                   |
| `pnpm dist`      | 配布用のアプリを `release/` に作る                                         |
| `pnpm format`    | Biome でコードを整え、直せる指摘を直す                                     |
| `pnpm lint`      | Biome でコードをチェックする（直さない）                                   |
| `pnpm typecheck` | TypeScript の型チェック                                                    |

アプリはF11キーで全画面になります。`pnpm dist` は、今使っているPCのOS向けのアプリを作ります（WindowsならWindows版、MacならMac版）。できたフォルダ（例: `release/win-unpacked/`）の中身が、そのままSteamにアップロードする中身になります。

VS Code で開くと、おすすめの拡張機能（Biome など）のインストールを案内されます。入れておくと、保存したときに自動でコードが整います。F5キーで `pnpm dev:app` を起動できます。

## GitHub Actions

- **CI**（`.github/workflows/ci.yml`）：PRを出したときと `main` に push したときに、Biome のチェック、型チェック、ビルドを実行します。
- **GitHub Pages**（`.github/workflows/pages.yml`）：`main` に push すると、ブラウザ版をビルドして `https://yumuras.github.io/sample_game/` に公開します。初回だけ、リポジトリの Settings → Pages で Source を「GitHub Actions」にしてください。

## ファイル構成

| ファイル               | 内容                                              |
| ---------------------- | ------------------------------------------------- |
| `src/game/scenario.ts` | シナリオ（ここを書き換えれば物語が変わる）        |
| `src/game/assets.ts`   | 背景・立ち絵・BGMの設定                           |
| `src/game/bgm.ts`      | BGMの再生と、仮BGMの合成                          |
| `src/game/runner.ts`   | 文字送り、選択肢、セーブなどの仕組み              |
| `src/game/types.ts`    | シナリオとセーブデータの型                        |
| `src/components/`      | 画面（タイトル、本編、エンディング）の React 部品 |
| `src/App.tsx`          | どの画面を出すかの切り替え                        |
| `src/style.css`        | 見た目                                            |
| `public/`              | 画像や音声を置く場所（そのまま公開される）        |
| `electron/main.ts`     | デスクトップアプリ版のウィンドウ設定              |
| `biome.json`           | コード整形・チェックの設定                        |

## 絵を差し替える

今は仮の絵（グラデーションの背景とシルエットの立ち絵）です。`public/images/` に画像を置き、`src/game/assets.ts` の `image` にパスを書くと差し替わります。

```js
clubroom: { label: "大学・民俗学サークル部室", image: "images/bg/clubroom.jpg", ... },
akari: { name: "葉月 灯", image: "images/chara/akari.png", ... },
```

立ち絵は背景が透明なPNG（縦長）がおすすめです。

## BGMを差し替える

今はブラウザ上で合成した仮のBGM（都節音階の琴風・祭囃子風など）が流れます。`public/audio/` に音声ファイルを置き、`src/game/assets.ts` の `bgm` にパスを書くと、その曲がループ再生されます。

```js
bgm: {
  festival: "audio/festival.mp3",
  ...
},
```

曲は `title`（タイトル）、`daily`（日常）、`festival`（宵山）、`tension`（事故のあと）、`torii`（千本鳥居）、`ending`（トゥルーエンド）の6つです。フリー素材を使う場合は、各サイトの利用規約（クレジット表記の要否など）を確認してください。

ブラウザの仕様で、最初にタップかクリックをするまで音は鳴りません。画面の「♪ BGM」ボタンでオン・オフを切り替えられます。

## シナリオの書き方

`src/game/scenario.ts` の各シーンは、命令を順番に並べた配列です。一つの命令に複数の項目を書くこともできます。

| 項目     | 例                                              | 意味                                                          |
| -------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `text`   | `{ text: "地の文" }`                            | 文章を表示してクリックを待つ                                  |
| `name`   | `{ name: "灯", text: "セリフ" }`                | 話している人の名前                                            |
| `bg`     | `{ bg: "clubroom" }`                            | 背景を切り替える                                              |
| `show`   | `{ show: { akari: "right" } }`                  | 立ち絵を出す（`left` / `center` / `right`）                   |
| `hide`   | `{ hide: "akari" }` / `{ hide: "all" }`         | 立ち絵を消す                                                  |
| `time`   | `{ time: "7月16日 20:58" }`                     | 画面左上の時刻                                                |
| `torii`  | `{ torii: 2 }`                                  | 戻れる回数（画面右上の鳥居マーク）                            |
| `effect` | `{ effect: "flash" }` / `{ effect: "torii" }`   | 演出                                                          |
| `bgm`    | `{ bgm: "festival" }` / `{ bgm: null }`         | BGMを切り替える（`null` で止める）                            |
| `set`    | `{ set: { foundCharm: true } }`                 | フラグを立てる                                                |
| `choice` | `{ choice: [{ text: "…", goto: "シーン名" }] }` | 選択肢。`set` や `if`（フラグが立っている時だけ出す）も書ける |
| `goto`   | `{ goto: "loop2" }`                             | 別のシーンへ移る                                              |
| `ending` | `{ ending: "true" }`                            | エンディング（`endings` に登録したもの）                      |

各シーンは必ず `goto`、`choice`、`ending` のどれかで終わるようにしてください。
