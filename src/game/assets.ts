// 背景と立ち絵の設定
// 本番の絵ができたら public/images/ に画像を置き、image にパスを書くと差し替わる（例: image: "images/bg/clubroom.jpg"）。
// image が空のあいだは、下の仮絵（CSSのグラデーションとSVGのシルエット）が表示される。

export interface Background {
  label: string;
  image: string;
  placeholder: string;
}

export interface Character {
  name: string;
  image: string;
  color: string;
}

export const assets: {
  backgrounds: Record<string, Background>;
  characters: Record<string, Character>;
  bgm: Record<string, string>;
} = {
  backgrounds: {
    black: { label: "", image: "", placeholder: "linear-gradient(#000, #000)" },
    clubroom: {
      label: "大学・民俗学サークル部室",
      image: "",
      placeholder: "linear-gradient(180deg, #f2c48d 0%, #d98e5a 55%, #6b4a3a 100%)",
    },
    shijo_night: {
      label: "四条烏丸・宵山",
      image: "",
      placeholder:
        "radial-gradient(circle at 20% 30%, #ffb34788 0 4%, transparent 5%), radial-gradient(circle at 45% 25%, #ffb34788 0 4%, transparent 5%), radial-gradient(circle at 70% 32%, #ffb34788 0 4%, transparent 5%), radial-gradient(circle at 88% 22%, #ffb34788 0 4%, transparent 5%), linear-gradient(180deg, #0b1030 0%, #2a1b4a 60%, #5a2a3a 100%)",
    },
    home_night: {
      label: "湊の部屋",
      image: "",
      placeholder: "linear-gradient(180deg, #0d1424 0%, #1c2740 70%, #2b2f3a 100%)",
    },
    torii_night: {
      label: "伏見稲荷・千本鳥居（夜）",
      image: "",
      placeholder: "repeating-linear-gradient(90deg, #8a1c12 0 6%, #1a0a08 6% 12%), linear-gradient(#000, #000)",
    },
    torii_dawn: {
      label: "伏見稲荷・千本鳥居（朝）",
      image: "",
      placeholder: "repeating-linear-gradient(90deg, #e2452b 0 6%, #f6d7a8 6% 12%)",
    },
    nishiki: {
      label: "錦市場",
      image: "",
      placeholder: "linear-gradient(180deg, #3a2a1a 0%, #7a5530 50%, #2a1d12 100%)",
    },
    kamogawa: {
      label: "鴨川・出町柳の飛び石",
      image: "",
      placeholder:
        "radial-gradient(ellipse at 30% 75%, #6d6a5f 0 5%, transparent 6%), radial-gradient(ellipse at 50% 78%, #6d6a5f 0 5%, transparent 6%), radial-gradient(ellipse at 70% 75%, #6d6a5f 0 5%, transparent 6%), linear-gradient(180deg, #f3a86b 0%, #c96b6b 40%, #3f6f8f 62%, #1f3f5a 100%)",
    },
  },

  characters: {
    akari: { name: "葉月 灯", image: "", color: "#4a6fa5" },
    kuon: { name: "久遠", image: "", color: "#7a6f8c" },
  },

  // BGM。public/audio/ に音声を置いてパスを書くとその曲に差し替わる（例: festival: "audio/festival.mp3"）。
  // 空のあいだは src/game/bgm.ts で合成した仮のBGMが流れる。
  bgm: {
    title: "", // タイトル・バッドエンド1
    daily: "", // 部室などの日常
    festival: "", // 宵山
    tension: "", // 事故のあと、探し物
    torii: "", // 千本鳥居
    ending: "", // トゥルーエンド
  },
};
