// BGM
// src/game/assets.ts の bgm に音声ファイル（mp3など）のパスを書くと、その曲がループ再生される。
// 空のあいだは、下の TRACKS をブラウザ上で合成した仮のBGMが流れる。
import { assets } from "./assets";

type VoiceType = "pluck" | "flute" | "bell" | "drum";

interface Track {
  bpm: number;
  drone?: number[];
  voices: { type: VoiceType; gain?: number; notes: (number | null)[] }[];
}

interface Playing {
  id: string;
  gain: GainNode;
  stop: () => void;
}

// iPhone の Safari だけにある機能と、古い Safari の AudioContext
declare global {
  interface Navigator {
    audioSession?: { type: string };
  }
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export const BGM = (() => {
  const PREF_KEY = "senbon-torii:bgm";
  const VOLUME = 0.6;
  const FADE_SEC = 1.2;

  // 1拍を8分音符とした16ステップのループ。数字はMIDIノート番号（60 = ド）、null は休み。
  // 京都らしさを出すため、多くの曲は都節音階（レ・ミ♭・ソ・ラ・シ♭）で作っている。
  const TRACKS: Record<string, Track> = {
    title: {
      bpm: 60,
      drone: [50, 57],
      voices: [
        { type: "pluck", notes: [74, null, 70, null, 69, null, null, null, 67, null, 69, null, 63, null, 62, null] },
      ],
    },
    daily: {
      bpm: 84,
      voices: [
        { type: "pluck", notes: [72, null, 76, 79, null, 76, 74, null, 72, null, 69, 72, null, null, 74, null] },
        {
          type: "pluck",
          gain: 0.6,
          notes: [48, null, null, null, null, null, null, null, 55, null, null, null, null, null, null, null],
        },
      ],
    },
    festival: {
      bpm: 112,
      voices: [
        {
          type: "bell",
          gain: 0.5,
          notes: [91, null, 91, 96, null, 91, 96, null, 91, null, 91, 96, null, 91, 96, null],
        },
        { type: "flute", notes: [86, null, 82, 81, 79, null, 81, null, 82, null, 81, 79, 75, null, 74, null] },
        { type: "drum", notes: [1, null, null, null, null, null, 1, null, 1, null, null, null, 1, null, null, null] },
      ],
    },
    tension: {
      bpm: 70,
      drone: [38, 39],
      voices: [
        {
          type: "drum",
          gain: 0.7,
          notes: [1, null, 1, null, null, null, null, null, 1, null, 1, null, null, null, null, null],
        },
        {
          type: "pluck",
          gain: 0.7,
          notes: [null, null, null, null, 63, null, null, null, null, null, null, null, 62, null, null, null],
        },
      ],
    },
    torii: {
      bpm: 56,
      drone: [50, 57],
      voices: [
        {
          type: "bell",
          notes: [86, null, null, null, null, null, 81, null, null, null, 82, null, null, null, null, null],
        },
      ],
    },
    ending: {
      bpm: 72,
      voices: [
        { type: "pluck", notes: [60, 64, 67, 72, 65, 69, 72, 77, 67, 71, 74, 79, 64, 67, 72, 76] },
        {
          type: "flute",
          gain: 0.6,
          notes: [76, null, null, null, 77, null, null, null, 79, null, null, null, 76, null, null, null],
        },
      ],
    },
  };

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let current: Playing | null = null;
  let wanted: string | null = null; // 鳴らしたい曲（OFFのあいだも覚えておく）
  let enabled = loadPref();

  function loadPref() {
    try {
      return localStorage.getItem(PREF_KEY) !== "off";
    } catch {
      return true;
    }
  }
  function savePref() {
    try {
      localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
    } catch {
      /* 保存できなくても鳴らせる */
    }
  }

  // iPhoneはマナーモード中、Web Audio の音を消してしまう。
  // 音楽再生として扱ってもらうと、マナーモードでも鳴るようになる。
  let silentAudio: HTMLAudioElement | null = null;
  function enableMediaPlayback() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
    } catch {
      /* 対応していないブラウザでは何もしない */
    }
    if (silentAudio) return;
    // 古いiOS向け: 無音の音声を流しておくと、再生扱いに切り替わる
    silentAudio = new Audio(silentWav());
    silentAudio.loop = true;
    silentAudio.setAttribute("playsinline", "");
    silentAudio.play().catch(() => {
      silentAudio = null;
    });
  }

  function silentWav() {
    const rate = 8000;
    const samples = rate / 10;
    const buf = new DataView(new ArrayBuffer(44 + samples));
    const str = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) buf.setUint8(o + i, s.charCodeAt(i));
    };
    str(0, "RIFF");
    buf.setUint32(4, 36 + samples, true);
    str(8, "WAVEfmt ");
    buf.setUint32(16, 16, true);
    buf.setUint16(20, 1, true);
    buf.setUint16(22, 1, true);
    buf.setUint32(24, rate, true);
    buf.setUint32(28, rate, true);
    buf.setUint16(32, 1, true);
    buf.setUint16(34, 8, true);
    str(36, "data");
    buf.setUint32(40, samples, true);
    for (let i = 0; i < samples; i++) buf.setUint8(44 + i, 128);
    let bin = "";
    new Uint8Array(buf.buffer).forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return `data:audio/wav;base64,${btoa(bin)}`;
  }

  // ブラウザは操作の前に音を出せないので、タップやクリックのたびに呼ぶ
  function unlock() {
    if (!enabled) return;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      enableMediaPlayback();
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    // iPhoneではアプリを切り替えると "interrupted" になるので、running 以外はすべて再開を試す
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    if (wanted && (!current || current.id !== wanted)) start(wanted);
  }

  const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

  // ───────── 音色 ─────────
  function envGain(ctx: AudioContext, t: number, peak: number, attack: number, decay: number) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  function osc(ctx: AudioContext, type: OscillatorType, f: number, t: number, dur: number, out: AudioNode) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.connect(out);
    o.start(t);
    o.stop(t + dur);
    return o;
  }

  type Voice = (ctx: AudioContext, note: number, t: number, out: AudioNode, gain: number, step: number) => void;

  const voices: Record<VoiceType, Voice> = {
    pluck(ctx, note, t, out, gain) {
      const g = envGain(ctx, t, 0.28 * gain, 0.005, 1.4);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(3200, t);
      lp.frequency.exponentialRampToValueAtTime(600, t + 0.6);
      g.connect(lp).connect(out);
      osc(ctx, "triangle", freq(note), t, 1.5, g);
      osc(ctx, "sine", freq(note) * 2, t, 0.4, g);
    },
    flute(ctx, note, t, out, gain, step) {
      const len = step * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16 * gain, t + 0.06);
      g.gain.setValueAtTime(0.16 * gain, t + len * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      g.connect(out);
      const o = osc(ctx, "sine", freq(note), t, len + 0.05, g);
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = freq(note) * 0.012;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + len + 0.05);
    },
    bell(ctx, note, t, out, gain) {
      const g = envGain(ctx, t, 0.14 * gain, 0.002, 2.2);
      g.connect(out);
      osc(ctx, "sine", freq(note), t, 2.3, g);
      osc(ctx, "sine", freq(note) * 2.76, t, 0.8, g);
    },
    drum(ctx, _note, t, out, gain) {
      const g = envGain(ctx, t, 0.5 * gain, 0.003, 0.45);
      g.connect(out);
      const o = osc(ctx, "sine", 110, t, 0.5, g);
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.4);
    },
  };

  // ───────── 再生 ─────────
  function startSynth(ctx: AudioContext, track: Track, out: AudioNode) {
    const step = 60 / track.bpm / 2;
    const steps = Math.max(...track.voices.map((v) => v.notes.length));
    const drones = (track.drone || []).map((n) => {
      const g = ctx.createGain();
      g.gain.value = 0.05;
      g.connect(out);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = freq(n);
      o.connect(g);
      o.start();
      return o;
    });

    let i = 0;
    let next = ctx.currentTime + 0.1;
    const tick = () => {
      while (next < ctx.currentTime + 0.3) {
        for (const v of track.voices) {
          const note = v.notes[i % v.notes.length];
          if (note != null) voices[v.type](ctx, note, next, out, v.gain ?? 1, step);
        }
        i = (i + 1) % steps;
        next += step;
      }
    };
    tick();
    const timer = setInterval(tick, 100);
    return () => {
      clearInterval(timer);
      for (const o of drones) o.stop();
    };
  }

  function startFile(ctx: AudioContext, src: string, out: AudioNode) {
    const audio = new Audio(src);
    audio.loop = true;
    const node = ctx.createMediaElementSource(audio);
    node.connect(out);
    audio.play().catch(() => {});
    return () => audio.pause();
  }

  function fadeOut() {
    if (!ctx || !current) return;
    const { gain, stop } = current;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE_SEC);
    setTimeout(stop, FADE_SEC * 1000 + 50);
    current = null;
  }

  function start(id: string) {
    if (!ctx || !master) return;
    fadeOut();
    const file = assets.bgm[id];
    const track = TRACKS[id];
    if (!file && !track) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_SEC);
    gain.connect(master);
    const stop = file ? startFile(ctx, file, gain) : startSynth(ctx, track, gain);
    current = { id, gain, stop };
  }

  // 曲を切り替える。null で止める。
  function play(id: string | null) {
    wanted = id || null;
    if (!ctx || !enabled) return;
    if (!wanted) fadeOut();
    else if (!current || current.id !== wanted) start(wanted);
  }

  function toggle() {
    enabled = !enabled;
    savePref();
    unlock();
    if (!ctx) return enabled;
    if (enabled) play(wanted);
    else fadeOut();
    return enabled;
  }

  return { play, unlock, toggle, isEnabled: () => enabled, current: () => wanted };
})();
