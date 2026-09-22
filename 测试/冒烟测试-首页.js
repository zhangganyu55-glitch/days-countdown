/* 冒烟测试（异步版）：等动画走完再断言，把结果写进标题 */
window.addEventListener('load', function () {
  var q  = function (s) { return document.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var log = [];
  function ok(name, cond) { log.push((cond ? 'PASS' : 'FAIL') + ':' + name); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function byTitle(name) {
    return qa('#list .card').filter(function (c) {
      return c.querySelector('.title').textContent.indexOf(name) > -1;
    })[0];
  }

  (async function () {
    await sleep(300);
    var n0 = qa('#list .card').length;
    ok('初始渲染4条', n0 === 4);
    ok('顶部信息条有日期', q('#todayText').textContent.length > 6);
    ok('每条都有进度线', qa('#list .bar > i').length === n0);
    ok('进度线长度已生成', (q('#list .bar > i').dataset.w || '').length > 0);

    /* 动画跑完后，数字和进度线必须落在正确值上 */
    await sleep(1400);
    ok('数字最终值正确', qa('#list .num').every(function (el) {
      return el.textContent === el.dataset.n;
    }));
    ok('进度线宽度已生效', qa('#list .bar > i').every(function (el) {
      return el.style.width === el.dataset.w + '%';
    }));

    /* ---- 新增 ---- */
    q('#addBtn').click();
    ok('面板打开', q('#sheet').classList.contains('open'));
    ok('遮罩出现', q('#backdrop').classList.contains('open'));
    ok('没填内容时保存禁用', q('#saveBtn').disabled === true);
    var t = q('#titleInput');
    t.value = '测试事件';
    t.dispatchEvent(new Event('input', {bubbles:true}));
    var d = q('#dateInput');
    d.value = '2026-12-31';
    d.dispatchEvent(new Event('change', {bubbles:true}));
    ok('填完可以保存', q('#saveBtn').disabled === false);
    ok('预览跟着变', q('.preview .title').textContent.indexOf('测试事件') > -1);
    q('#saveBtn').click();
    await sleep(60);
    ok('保存后卡片+1', qa('#list .card').length === n0 + 1);
    ok('面板已关闭', !q('#sheet').classList.contains('open'));

    /* ---- 置顶 ---- */
    var pin0 = qa('#list .pin-dot').length;
    byTitle('生日').querySelector('[data-act="pin"]').click();
    await sleep(60);
    ok('取消置顶后图钉少一个', qa('#list .pin-dot').length === pin0 - 1);
    ok('取消置顶后掉出第一位', qa('#list .card')[0].querySelector('.title').textContent.indexOf('生日') === -1);
    byTitle('旅行计划').querySelector('[data-act="pin"]').click();
    await sleep(60);
    ok('置顶后图钉回来', qa('#list .pin-dot').length === pin0);
    ok('置顶的排到第一位', qa('#list .card')[0].querySelector('.title').textContent.indexOf('旅行计划') > -1);

    /* ---- 分类筛选（切换现在有 150ms 交叉淡出，要等） ---- */
    q('#catBtn').click();
    ok('分类菜单打开', q('#catMenu').classList.contains('open'));
    q('#catMenu [data-cat="study"]').click();
    ok('标题立刻变成学习', q('#catLabel').textContent === '学习');
    await sleep(450);
    var studyTitles = qa('#list .card').map(function (c) {
      return c.querySelector('.title').textContent;
    });
    ok('筛选后只剩学习分类',
       studyTitles.length > 0 && studyTitles.length < n0 + 1 &&
       studyTitles.every(function (x) {
         return x.indexOf('开学') > -1 || x.indexOf('测试事件') > -1;
       }));
    q('#catBtn').click();
    q('#catMenu [data-cat="all"]').click();
    await sleep(450);
    ok('切回全部', qa('#list .card').length === n0 + 1);
    ok('淡出状态已清除', !q('#list').classList.contains('fading'));

    /* ---- 点卡片编辑 ---- */
    qa('#list .card')[0].click();
    await sleep(60);
    ok('点卡片打开编辑', q('#sheet').classList.contains('open'));
    ok('编辑态有删除按钮', q('#deleteBtn').style.display === 'block');
    var t2 = q('#titleInput');
    t2.value = '改过的名字';
    t2.dispatchEvent(new Event('input', {bubbles:true}));
    q('#saveBtn').click();
    await sleep(60);
    ok('改名生效', qa('#list .card')[0].querySelector('.title').textContent.indexOf('改过的名字') > -1);

    /* ---- 删除（影子 + 补位重叠） ---- */
    var before = qa('#list .card').length;
    qa('#list .card')[0].querySelector('[data-act="del"]').click();
    ok('弹出确认框', q('#dialog').classList.contains('open'));
    q('#dlgOk').click();
    await sleep(120);
    ok('确认后真的删掉', qa('#list .card').length === before - 1);
    ok('留下了正在滑出的影子', qa('.card.ghost').length === 1);
    await sleep(500);
    ok('影子滑完自己消失', qa('.card.ghost').length === 0);

    /* ---- 视图切换 ---- */
    q('#viewBtn').click();
    await sleep(60);
    ok('切成网格', q('#list').classList.contains('grid'));
    q('#viewBtn').click();
    await sleep(60);
    ok('切回列表', !q('#list').classList.contains('grid'));

    /* ---- 设置 / 深色 ---- */
    q('#setBtn').click();
    ok('设置面板打开', q('#setSheet').classList.contains('open'));
    q('#themeRow').click();
    ok('切到深色', document.documentElement.dataset.theme === 'dark');
    q('#setDoneBtn').click();
    await sleep(60);
    ok('设置面板关闭', !q('#setSheet').classList.contains('open'));

    /* ---- 本地存储 ---- */
    var stored = 'ERR';
    try {
      localStorage.setItem('__probe', '1');
      stored = localStorage.getItem('__probe');
      localStorage.removeItem('__probe');
    } catch (e) { stored = 'ERR:' + e.name; }
    ok('localStorage可用', stored === '1');
    ok('数据已落盘', (localStorage.getItem('countdown.v1') || '').length > 10);

    document.title = log.join(' | ');
  })();
});
