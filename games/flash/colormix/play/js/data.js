// 그림·카드 정보
window.DATA = {
  // 그림 10장
  paints: [
    { n: 1, name: '언덕 위 집' },
    { n: 2, name: '과일 그릇' },
    { n: 3, name: '바닷가 등대' },
    { n: 4, name: '해바라기' },
    { n: 5, name: '노을 지붕' },
    { n: 6, name: '숲속 호수' },
    { n: 7, name: '눈 오는 마을' },
    { n: 8, name: '열기구' },
    { n: 9, name: '작은 항구' },
    { n: 10, name: '별밤' },
  ],
  total: 10,
  // 카드: 판을 깰 때마다 셋 중 하나. k = 쓰는 방법(blob: 방울을 누른다, now: 바로)
  cards: [],
};
(function () {
  const C = window.DATA.cards, col = [['R', '빨강'], ['Y', '노랑'], ['B', '파랑'], ['W', '흰색'], ['K', '검정']];
  col.forEach(([c, n], pig) => {
    C.push({ id: 't' + c, name: n + ' 튜브', e: '+1', k: 'blob', pig, amt: 1 });
    C.push({ id: 't' + c + '2', name: '큰 ' + n + ' 튜브', e: '+2', k: 'blob', pig, amt: 2 });
    C.push({ id: 't' + c + '3', name: '황금 ' + n + ' 튜브', e: '+3', k: 'blob', pig, amt: 3, gold: 1 });
  });
  C.push(
    { id: 'cup', name: '물 한 컵', e: '+1 MOVE', k: 'now', mv: 1 },
    { id: 'cup2', name: '물 두 컵', e: '+2 MOVES', k: 'now', mv: 2 },
    { id: 'cup3', name: '물 세 컵', e: '+3 MOVES', k: 'now', mv: 3 },
    { id: 'can', name: '물뿌리개', e: '+4 MOVES', k: 'now', mv: 4 },
    { id: 'jar', name: '황금 물통', e: '+5 MOVES', k: 'now', mv: 5, gold: 1 },
    { id: 'rag', name: '헝겊', e: '지우기', k: 'blob' },
    { id: 'drop', name: '스포이트', e: '덜기', k: 'blob' },
    { id: 'knife', name: '나이프', e: '옮기기', k: 'blob' },
    { id: 'brush', name: '황금 붓', e: '완성', k: 'now', gold: 1 },
  );
})();
