// 판(STAGE) 30개: 골대 거리, 움직임, 손 보정, 목표 점수. 단계는 잘게, 아래는 넉넉히, 위는 가파르게.
(function () {
  const S = (window.STG = {});
  S.N = 30;
  S.TIME = 40;
  const lerp = (a, b, t) => a + (b - a) * t;
  // 목표 점수(10/17 로봇 셋으로 잼: 대충 던지는 사람은 7~10판쯤에서 막히고, 꾸준한 사람은 25판 안팎, 아주 잘하는 사람이 30판을 반쯤 깸)
  const GOALS = [14, 14, 16, 16, 16, 18, 18, 18, 20, 20, 20, 20, 20, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22];
  S.get = function (n) {          // n = 1..30
    const t = (n - 1) / (S.N - 1);
    const D = +(2.4 + 2.5 * Math.pow(t, 0.92)).toFixed(2);
    let mv = 'none', ax = 0, ay = 0, w = 0, late = false;
    if (n >= 5 && n <= 9) { mv = 'x'; late = true; ax = lerp(0.16, 0.3, (n - 5) / 4); w = lerp(0.55, 0.85, (n - 5) / 4); }
    else if (n >= 10 && n <= 15) { mv = 'x'; ax = lerp(0.2, 0.4, (n - 10) / 5); w = lerp(0.6, 1.0, (n - 10) / 5); }
    else if (n >= 16 && n <= 22) { mv = 'xy'; ax = lerp(0.28, 0.42, (n - 16) / 6); ay = lerp(0.1, 0.2, (n - 16) / 6); w = lerp(0.7, 1.05, (n - 16) / 6); }
    else if (n >= 23 && n <= 26) { mv = 'eight'; ax = lerp(0.36, 0.46, (n - 23) / 3); ay = lerp(0.14, 0.2, (n - 23) / 3); w = lerp(0.8, 1.0, (n - 23) / 3); }
    else if (n >= 27) { mv = 'jerk'; ax = lerp(0.34, 0.44, (n - 27) / 3); ay = lerp(0.12, 0.18, (n - 27) / 3); w = lerp(0.8, 1.0, (n - 27) / 3); }
    // 손가락 실수 중 남는 몫(작을수록 쉬움)
    const keepV = lerp(0.75, 0.9, Math.pow(t, 0.85));
    const keepA = lerp(0.75, 0.9, Math.pow(t, 0.85));
    // 목표 점수
    const goal = GOALS[n - 1];
    return { n, D, mv, ax, ay, w, late, keepV, keepA, goal };
  };
  // 골대 자리(판 시작 0초부터 tt 초 뒤). 남은 시간이 10초 아래일 때만 움직이는 판은 late.
  S.hoopAt = function (st, tt, left) {
    const base = { x: 0, y: 2.3, z: -st.D };
    if (st.mv === 'none' || (st.late && left > 10)) return base;
    let ph = tt * st.w;
    if (st.late) ph = (10 - left) * st.w;
    if (st.mv === 'jerk') {
      // 섰다 갔다: 1.6초 마디 중 앞 0.55 는 거의 멈춤
      const c = 1.6, k = tt / c, f = k - Math.floor(k);
      const sm = f < 0.55 ? 0 : (f - 0.55) / 0.45;
      ph = (Math.floor(k) + sm * sm * (3 - 2 * sm)) * 1.9;
    }
    const x = st.ax * Math.sin(ph);
    let y = 2.3;
    if (st.mv === 'xy' || st.mv === 'jerk') y += st.ay * Math.sin(ph * 0.63 + 1.1);
    if (st.mv === 'eight') y += st.ay * Math.sin(ph * 2);
    return { x, y, z: -st.D };
  };
  S.stars = (score, goal) => (score >= Math.ceil(goal * 1.7) ? 3 : score >= Math.ceil(goal * 1.35) ? 2 : score >= goal ? 1 : 0);
})();
