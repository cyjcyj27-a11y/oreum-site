/* 8교시 시간표: 영역마다 문항을 만들고 지수로 바꾼다 */
(function () {
'use strict';
const EN = new URLSearchParams(location.search).get('lang') === 'en';
const L = (ko, en) => EN ? en : ko;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function bank(list, seed) {
  return list.map((it, i) => {
    const R = GEN.rng(seed + i * 97);
    const o = GEN.shuffle(R, it[1].map((t, k) => ({ t, k })));
    return { stem: { t: 'text', html: esc(it[0]) }, opts: o.map(x => ({ t: esc(x.t) })), ans: o.findIndex(x => x.k === 0), lay: 'txt', ol: 'list' };
  });
}

const TESTS = [
  { id: 'iq', name: L('IQ 테스트', 'IQ TEST'), area: L('도형·수리·언어·공간·기억', 'Figure · Number · Verbal · Space · Memory'), tag: 'IQ', min: 25, mu: .533, sd: .156, seeded: true,
    /* 35문항: 도형 행렬 15 · 수 7 · 낱말 5 · 도형 돌리기 5 · 숫자 기억 3. 일곱 문제씩 돌며 점점 어렵게, 풀 때마다 같은 난이도의 다른 문제 */
    build: seed => {
      seed = seed || 0;
      const R = GEN.rng(424242 + seed * 7);
      const mat = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28].map(i => IQ.one(i, seed))
        .map(q => ({ stem: { t: 'mat', q }, opts: q.opts.map(o => ({ svg: IQ.svg(o) })), ans: q.ans, lay: 'mat', kind: 'mat' }));
      const num = GEN.logicSet(['ar+', 'alt', 'geo', 'diff', 'sym2', 'fib', 'inter'], 78001 + seed * 7).map(it => ({ stem: { t: 'html', html: it.stemHtml, cap: L('?에 알맞은 수는?', 'Which number is ?') },
        opts: it.opts.map(v => ({ t: String(v) })), ans: it.ans, lay: 'txt', ol: 'grid', kind: 'num' }));
      const pool = BANK.iqv[EN ? 'en' : 'ko'];
      const verb = [0, 1, 2, 3, 4].map(tier => { const c = pool.filter(x => x[0] === tier); return c[Math.floor(R() * c.length)]; })
        .map((x, k) => Object.assign(bank([[x[1], x[2]]], 79001 + seed * 11 + k)[0], { ol: 'grid', kind: 'verb' }));
      const spc = GEN.spaceSet([5, 6, 7, 7, 8], 89001 + seed * 13).map(it => ({ stem: { t: 'pic', svg: it.stemSvg, cap: L('돌려서 같은 도형은?', 'Same shape, rotated?') },
        opts: it.optSvg.map(sv => ({ svg: sv })), ans: it.ans, lay: 'pic', kind: 'space' }));
      const mem = [6, 7, 8].map((n, k) => { const it = GEN.memItem(GEN.rng(90001 + seed * 17 + k * 31), n);
        return { stem: { t: 'mem', digits: it.digits, cap: L('방금 본 숫자는?', 'Which number did you see?') }, opts: it.opts.map(x => ({ t: x })), ans: it.ans, lay: 'txt', ol: 'list', kind: 'mem' }; });
      const extra = [num[5], mem[0], num[6], mem[1], mem[2]], out = [];
      for (let r = 0; r < 5; r++) out.push(mat[r * 3], num[r], mat[r * 3 + 1], verb[r], mat[r * 3 + 2], spc[r], extra[r]);
      return balance(out, 30011 + seed);
    } },
  { id: 'eq', name: L('EQ 테스트', 'EQ TEST'), area: L('감정 읽기·이해·관리', 'Read · Understand · Manage'), tag: 'EQ', min: 15, weighted: true,
    /* 글 문항만. 보기마다 점수(2·1·0), 100점 만점 */
    build: () => BANK.eq2[EN ? 'en' : 'ko'].map((x, i) => {
      const R = GEN.rng(56001 + i * 13), o = GEN.shuffle(R, x[2].map(([t, w]) => ({ t: esc(t), w })));
      return { stem: { t: 'text', html: esc(x[1]) }, opts: o, ans: o.findIndex(y => y.w === 2), lay: 'txt', ol: 'list', sub: x[0] };
    }) },
  { id: 'lang', name: L('언어 지능', 'Linguistic'), area: L('언어 영역', 'Language'), tag: L('언어', 'LANGUAGE'), min: 8, mu: .68, sd: .18,
    build: () => bank(BANK.lang[EN ? 'en' : 'ko'], 61001) },
  { id: 'logic', name: L('논리수학 지능', 'Logical-Math'), area: L('수리 영역', 'Numbers'), tag: L('논리수학', 'LOGIC'), min: 10, mu: .55, sd: .2,
    build: () => GEN.logic().map(it => ({ stem: { t: 'html', html: it.stemHtml, cap: L('?에 알맞은 수는?', 'Which number is ?') },
      opts: it.opts.map(v => ({ t: String(v) })), ans: it.ans, lay: 'txt', ol: 'grid' })) },
  { id: 'space', name: L('공간 지능', 'Spatial'), area: L('공간 영역', 'Space'), tag: L('공간', 'SPATIAL'), min: 8, mu: .6, sd: .2,
    build: () => GEN.space().map(it => ({ stem: { t: 'pic', svg: it.stemSvg, cap: L('돌려서 같은 도형은?', 'Same shape, rotated?') },
      opts: it.optSvg.map(s => ({ svg: s })), ans: it.ans, lay: 'pic' })) },
  { id: 'music', name: L('음악 지능', 'Musical'), area: L('듣기 영역', 'Listening'), tag: L('음악', 'MUSICAL'), min: 8, mu: .6, sd: .2,
    build: () => GEN.music().map(it => {
      const cap = it.mk === 'high' ? L('가장 높은 음은?', 'Which note is highest?') : it.mk === 'diff' ? L('몇 번째 음이 바뀌었나?', 'Which note changed?') : L('들은 리듬은?', 'Which rhythm did you hear?');
      const opts = it.mk === 'rhy' ? it.opts.map(m => ({ svg: GEN.rhythmSVG(m), wide: 1 })) : Array.from({ length: it.n }, (_, i) => ({ t: String(i + 1) }));
      return { stem: { t: 'listen', m: it, cap }, opts, ans: it.ans, lay: 'txt', ol: it.mk === 'rhy' ? 'list' : 'one' };
    }) },
  { id: 'body', name: L('신체운동 지능', 'Bodily-Kinesthetic'), area: L('반응 영역', 'Reaction'), tag: L('신체운동', 'BODILY'), min: 3, motor: true },
  { id: 'nature', name: L('자연탐구 지능', 'Naturalist'), area: L('자연 영역', 'Nature'), tag: L('자연탐구', 'NATURALIST'), min: 7, mu: .65, sd: .18,
    build: () => bank(BANK.nature[EN ? 'en' : 'ko'], 71001) },
];
TESTS.forEach((t, i) => { t.no = i + 1; });

/* 정답 자리를 고르게: 한 번호만 찍어서 점수가 나오지 않게 (숫자 줄 보기는 순서가 곧 답이라 빼고) */
function balance(Q, seed) {
  const R = GEN.rng(seed), bag = {};
  Q.forEach(q => {
    if (q.ol === 'one') return;
    const k = q.opts.length;
    if (!bag[k] || !bag[k].length) bag[k] = GEN.shuffle(R, Array.from({ length: k }, (_, i) => i));
    const to = bag[k].pop(), from = q.ans;
    const t = q.opts[to]; q.opts[to] = q.opts[from]; q.opts[from] = t; q.ans = to;
  });
  return Q;
}
TESTS.forEach((t, i) => { if (t.build && t.id !== 'iq') { const b = t.build; t.build = () => balance(b(), 31337 + i * 101); } });

const idx = (raw, n, mu, sd) => n ? Math.round(Math.max(55, Math.min(145, 100 + (raw / n - mu) / sd * 15))) : null;

/* 다중지능 8칸: EQ 는 대인관계·자기성찰 두 칸으로 나뉜다 */
const AXES = [
  { k: 'lang', name: L('언어', 'Linguistic') }, { k: 'logic', name: L('논리수학', 'Logical') }, { k: 'space', name: L('공간', 'Spatial') },
  { k: 'music', name: L('음악', 'Musical') }, { k: 'body', name: L('신체운동', 'Bodily') }, { k: 'inter', name: L('대인관계', 'Interpersonal') },
  { k: 'intra', name: L('자기성찰', 'Intrapersonal') }, { k: 'nature', name: L('자연탐구', 'Naturalist') },
];

window.TESTS = { list: TESTS, byId: id => TESTS.find(t => t.id === id), idx, AXES, EN, L };
})();
