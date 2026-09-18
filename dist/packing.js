(() => {
  const groups = [{"id": "documents", "title": "证件与订单", "note": "放随身包", "items": [{"id": "documents-1", "text": "护照、签证信息及备份"}, {"id": "documents-2", "text": "驾照原件、租车公司认可的翻译件或相关驾驶文件"}, {"id": "documents-3", "text": "主驾驶名下信用卡；另备一张支付卡"}, {"id": "documents-4", "text": "航班、租车、住宿订单离线保存"}, {"id": "documents-5", "text": "旅行保险保单、紧急联系方式"}, {"id": "documents-6", "text": "浮潜、罗特内斯特岛船票等已预订凭证"}]}, {"id": "clothes", "title": "衣物与鞋", "note": "按中途洗一次、约 6 天换洗量准备", "items": [{"id": "clothes-1", "text": "短袖 5–6 件"}, {"id": "clothes-2", "text": "薄长袖／防晒衣 2 件"}, {"id": "clothes-3", "text": "薄抓绒或卫衣 1 件"}, {"id": "clothes-4", "text": "防风外套 1 件"}, {"id": "clothes-5", "text": "长裤 2 条、短裤 2 条"}, {"id": "clothes-6", "text": "内衣裤、袜子各 6–7 套"}, {"id": "clothes-7", "text": "睡衣 1 套"}, {"id": "clothes-8", "text": "泳衣／泳裤 2 套"}, {"id": "clothes-9", "text": "好走的运动鞋 1 双"}, {"id": "clothes-10", "text": "凉鞋或拖鞋 1 双"}, {"id": "clothes-11", "text": "洗衣袋、少量洗衣用品"}]}, {"id": "ocean", "title": "浮潜与海边", "note": "埃克斯茅斯 · Coral Bay · 罗特内斯特岛", "items": [{"id": "ocean-1", "text": "长袖水上防晒衣"}, {"id": "ocean-2", "text": "速干毛巾"}, {"id": "ocean-3", "text": "防水袋、湿衣收纳袋"}, {"id": "ocean-4", "text": "手机防水套，出发前测试密封"}, {"id": "ocean-5", "text": "自用面镜、呼吸管（活动方提供则可不带）"}, {"id": "ocean-6", "text": "近视泳镜或有度数面镜（按需）"}, {"id": "ocean-7", "text": "防晒霜、润唇膏"}, {"id": "ocean-8", "text": "墨镜、带防风绳的帽子"}, {"id": "ocean-9", "text": "小瓶保湿乳，海水冲洗后使用"}]}, {"id": "road", "title": "自驾与户外", "note": "9 天租车 · 长距离移动", "items": [{"id": "road-1", "text": "手机车载支架"}, {"id": "road-2", "text": "多接口车充、充电线"}, {"id": "road-3", "text": "离线地图和订单地址"}, {"id": "road-4", "text": "每人一个可重复使用的水瓶"}, {"id": "road-5", "text": "轻便双肩包，装当天饮水、防晒和外套"}, {"id": "road-6", "text": "头灯或小手电"}, {"id": "road-7", "text": "垃圾袋、纸巾、湿巾"}, {"id": "road-8", "text": "保温袋或折叠冷藏袋（按需）"}, {"id": "road-9", "text": "抵达后采购：饮用水、路餐及零食；长途路段出发前补足"}]}, {"id": "care", "title": "洗护、药品与电子设备", "note": "按个人使用习惯准备", "items": [{"id": "care-1", "text": "牙刷牙膏、洗护小样、剃须／个人护理用品"}, {"id": "care-2", "text": "常用药、个人处方药及相关说明"}, {"id": "care-3", "text": "晕车／晕船药（按个人情况）"}, {"id": "care-4", "text": "创可贴、水泡贴、消毒用品"}, {"id": "care-5", "text": "驱虫用品"}, {"id": "care-6", "text": "澳标转换插头"}, {"id": "care-7", "text": "手机、充电器、充电宝"}, {"id": "care-8", "text": "相机、存储卡、备用电池（按需）"}, {"id": "care-9", "text": "手机卡／eSIM 配置资料、取卡针"}, {"id": "care-10", "text": "防水文件袋、备用密封袋"}]}, {"id": "cabin", "title": "飞机随身小包", "note": "两次中转都比较长；与主清单重复的物品仅需归位", "items": [{"id": "cabin-1", "text": "护照、钱包、手机"}, {"id": "cabin-2", "text": "充电宝、充电线、耳机"}, {"id": "cabin-3", "text": "眼罩、耳塞、颈枕"}, {"id": "cabin-4", "text": "薄外套"}, {"id": "cabin-5", "text": "牙刷、少量洗漱用品"}, {"id": "cabin-6", "text": "一套换洗内衣和上衣"}, {"id": "cabin-7", "text": "空水杯"}, {"id": "cabin-8", "text": "常用药"}]}];
  const root = document.getElementById('packing-groups');
  if (!root) return;
  const key = 'travel:wa-north-20260923:packing:v1';
  let checked = {};
  try { const value = JSON.parse(localStorage.getItem(key) || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) checked = value; } catch {}
  const all = groups.flatMap(group => group.items);
  const total = document.getElementById('packing-progress');
  const bar = document.getElementById('packing-meter');
  const pending = document.getElementById('packing-pending');
  const counts = new Map();
  function update() {
    const done = all.filter(item => checked[item.id] === true).length;
    total.textContent = `${done} / ${all.length} 已整理`;
    bar.max = all.length; bar.value = done;
    groups.forEach(group => {
      const count = group.items.filter(item => checked[item.id] === true).length;
      counts.get(group.id).textContent = `${count} / ${group.items.length}`;
    });
    root.querySelectorAll('label').forEach(label => {
      const done = checked[label.dataset.item] === true;
      label.classList.toggle('is-packed', done);
      label.hidden = pending.checked && done;
    });
    document.getElementById('packing-empty').hidden = !(pending.checked && done === all.length);
  }
  groups.forEach(group => {
    const card = document.createElement('details'); card.className = 'packing-group'; card.open = true;
    const summary = document.createElement('summary');
    const title = document.createElement('span'); title.textContent = group.title;
    const count = document.createElement('span'); count.className = 'packing-count'; counts.set(group.id, count);
    summary.append(title, count); card.append(summary);
    const note = document.createElement('p'); note.className = 'packing-group-note'; note.textContent = group.note; card.append(note);
    group.items.forEach(item => {
      const label = document.createElement('label'); label.className = 'packing-item'; label.dataset.item = item.id;
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = checked[item.id] === true;
      const text = document.createElement('span'); text.textContent = item.text;
      input.addEventListener('change', () => {
        checked[item.id] = input.checked;
        try { localStorage.setItem(key, JSON.stringify(checked)); }
        catch { document.getElementById('packing-storage').textContent = '当前浏览器无法保存，勾选仅在本次打开时保留。'; }
        update();
      });
      label.append(input, text); card.append(label);
    });
    root.append(card);
  });
  pending.addEventListener('change', update);
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    try { const value = JSON.parse(event.newValue || '{}'); checked = value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    catch { return; }
    root.querySelectorAll('label').forEach(label => { label.querySelector('input').checked = checked[label.dataset.item] === true; });
    update();
  });
  update();
})();
