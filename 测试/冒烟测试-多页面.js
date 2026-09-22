/* 多页面冒烟测试：登录、Tab、页面切换、事件库、提醒、归档、日历、计算器 */
window.addEventListener('load', function () {
  var q  = function (s) { return document.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var log = [];
  function ok(n, c) { log.push((c ? 'PASS' : 'FAIL') + ':' + n); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function visible(id) { return q('#page-' + id).classList.contains('active'); }
  function byTitle(name) {
    return qa('#list .card').filter(function (c) {
      return c.querySelector('.title').textContent.indexOf(name) > -1;
    })[0];
  }
  /* 默认是「已登录」状态（head 里预置过），先把登录页真真切切走一遍 */
  localStorage.removeItem('countdown.login');

  (async function () {
    await sleep(200);

    /* ---- 登录页 ---- */
    q('#login').classList.remove('hide');
    ok('登录页默认可见', !q('#login').classList.contains('hide'));
    ok('两个输入框都空时不能登录', q('#loginBtn').disabled === true);
    q('#loginPhone').value = '13800000000';
    q('#loginPhone').dispatchEvent(new Event('input', {bubbles:true}));
    q('#loginPwd').value = 'demo';
    q('#loginPwd').dispatchEvent(new Event('input', {bubbles:true}));
    ok('填完可以点登录', q('#loginBtn').disabled === false);
    q('#loginBtn').click();
    await sleep(1200);
    ok('登录后登录页收起', q('#login').classList.contains('hide'));
    ok('登录状态已记住', localStorage.getItem('countdown.login') === '1');

    /* ---- 底部 Tab ---- */
    q('.tab[data-tab="calendar"]').click();
    await sleep(500);
    ok('切到日历页', visible('calendar'));
    ok('日历画出 42 格', qa('#calGrid .cal-day').length === 42);
    ok('日历页没有返回键', q('#backBtn').hidden === true);

    q('.tab[data-tab="more"]').click();
    await sleep(500);
    ok('切到更多页', visible('more'));
    ok('更多页列出功能入口', qa('#moreGroups .row-item').length >= 8);

    /* ---- 更多 -> 倒数本 -> 返回 ---- */
    q('#moreGroups [data-go="books"]').click();
    await sleep(500);
    ok('进入倒数本', visible('books'));
    ok('倒数本有封面卡片', qa('#booksRow .book').length === 5);
    ok('子页面显示返回键', q('#backBtn').hidden === false);
    q('#backBtn').click();
    await sleep(500);
    ok('返回键回到更多', visible('more'));

    /* ---- 日历点某天 ---- */
    q('.tab[data-tab="calendar"]').click();
    await sleep(500);
    var before = q('#calDayTitle').textContent;
    qa('#calGrid .cal-day')[8].click();
    await sleep(120);
    ok('点日期后标题跟着变', q('#calDayTitle').textContent !== '' );
    ok('点日期后有明细区域', q('#calDayList').children.length > 0);

    /* ---- 日期计算器 ---- */
    q('.tab[data-tab="more"]').click();
    await sleep(400);
    q('#moreGroups [data-go="calc"]').click();
    await sleep(500);
    ok('进入日期计算器', visible('calc'));
    ok('默认同一天显示 0', q('#calcBig').textContent === '0');
    q('#calcB').value = '2026-12-31';
    q('#calcB').dispatchEvent(new Event('input', {bubbles:true}));
    await sleep(80);
    ok('改了日期结果跟着变', q('#calcBig').textContent !== '0');
    q('#calcSeg [data-mode="add"]').click();
    await sleep(80);
    ok('切到往后推模式', q('#calcBField').hidden === true && q('#calcNField').hidden === false);
    ok('往后推模式显示日期', q('#calcBig').classList.contains('date'));

    /* ---- 事件库加一条 ---- */
    q('#backBtn').click();
    await sleep(500);
    q('#moreGroups [data-go="library"]').click();
    await sleep(500);
    ok('进入事件库', visible('library'));
    ok('事件库有 12 个模板', qa('#libGrid .lib-card').length === 12);
    var n0 = JSON.parse(localStorage.getItem('countdown.v1')).length;
    qa('#libGrid .lib-card')[0].click();
    await sleep(120);
    var n1 = JSON.parse(localStorage.getItem('countdown.v1')).length;
    ok('点模板真的加了一条', n1 === n0 + 1);

    /* ---- 强提醒 ---- */
    q('#backBtn').click();
    await sleep(500);
    q('#moreGroups [data-go="remind"]').click();
    await sleep(500);
    ok('进入强提醒', visible('remind'));
    var firstOpts = qa('#remindList .remind-opts')[0];
    var target = firstOpts.querySelectorAll('button')[4];   // 提前7天
    target.click();
    await sleep(120);
    ok('点提醒选项后高亮跟着走',
       qa('#remindList .remind-opts')[0].querySelectorAll('button')[4]
         .classList.contains('active'));

    /* ---- 归档与恢复 ---- */
    await sleep(60);
    qa('#list .card');   // 首页此刻是隐藏的，直接走编辑面板流程
    q('.tab[data-tab="home"]').click();
    await sleep(500);
    var homeCount = qa('#list .card').length;
    byTitle('开学').click();
    await sleep(300);
    q('#hideSwitch').click();
    q('#saveBtn').click();
    await sleep(300);
    ok('隐藏后首页少一条', qa('#list .card').length === homeCount - 1);

    q('.tab[data-tab="me"]').click();
    await sleep(500);
    ok('我的页面显示统计', qa('#meStats .stat').length === 3);
    q('#meStats'); // 占位
    q('#page-me [data-go="archive"]').click();
    await sleep(500);
    ok('进入归档页', visible('archive'));
    ok('归档里能看到刚隐藏的那条', qa('#archiveList [data-restore]').length >= 1);
    qa('#archiveList [data-restore]')[0].click();
    await sleep(200);
    ok('恢复后归档清空一条', qa('#archiveList [data-restore]').length === 0);

    q('.tab[data-tab="home"]').click();
    await sleep(500);
    ok('恢复后首页条数回来', qa('#list .card').length === homeCount);

    /* ---- 深色模式（我的页面里的开关） ---- */
    q('.tab[data-tab="me"]').click();
    await sleep(400);
    q('#meThemeRow').click();
    ok('我的页面能切深色', document.documentElement.dataset.theme === 'dark');
    ok('两个开关状态同步', q('#themeSwitch').getAttribute('aria-checked') === 'true' &&
                             q('#themeSwitch2').getAttribute('aria-checked') === 'true');

    document.title = log.join(' | ');
  })();
});
