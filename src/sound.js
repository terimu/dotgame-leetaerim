// 효과음 (GAME_DESIGN.md 7장): Web Audio 합성만. 모듈을 불러올 때는 AudioContext를 만들지 않는다.
export const MASTER_GAIN = 0.25;
export const ATTACK_MS = 5;
export const RELEASE_MS = 40;

// 사건 → 파형과 [Hz, ms] 음 목록. 수치는 7장 표가 기준이다.
export const SOUND_TABLE = {
  ending: { wave: 'triangle', notes: [[523, 130], [659, 130], [784, 130], [1047, 520]] },
  fail: { wave: 'triangle', notes: [[392, 180], [330, 180], [262, 180]] },
  clear: { wave: 'triangle', notes: [[523, 90], [659, 90], [784, 90]] },
  stun: { wave: 'square', notes: [[110, 300]] },
  lamp: { wave: 'sine', notes: [[880, 120]] },
};

let context = null;
let master = null;

// 첫 keydown에서 부른다. 만들 수 없으면 소리 없이 계속한다.
export function unlock() {
  try {
    if (context === null) {
      const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Ctor) return;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume();
  } catch {
    context = null;
    master = null;
  }
}

// 음 k는 앞 음 길이의 합에서 시작한다. 게인은 어택 구간에서 올라가고 음 끝의 릴리즈 구간에서 0으로 내려간다.
export function play(name) {
  if (context === null) return;
  const sound = SOUND_TABLE[name];
  if (!sound) return;
  try {
    let start = context.currentTime;
    for (const [hz, ms] of sound.notes) {
      const end = start + ms / 1000;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = sound.wave;
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + ATTACK_MS / 1000);
      gain.gain.setValueAtTime(1, end - RELEASE_MS / 1000);
      gain.gain.linearRampToValueAtTime(0, end);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(end);
      start = end;
    }
  } catch {
    // 재생 실패는 무음으로 넘긴다.
  }
}
