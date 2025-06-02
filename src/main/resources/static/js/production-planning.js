// production-planning.js

const daysEl = document.getElementById("days");
const monthYearEl = document.getElementById("month-year");
const selectedDateEl = document.getElementById("selected-date");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

// --- 모달 관련 DOM 요소 ---
const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const customerInput = document.getElementById('customerInput');
const itemInput = document.getElementById('itemInput');
const orderQtyInput = document.getElementById('orderQtyInput');
const orderInfoList = document.getElementById('orderInfoList');
const addPlanBtn = document.getElementById('addPlanBtn');
const userIdxHiddenInput = document.getElementById('userIdx');

let today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let productionOrders = [];

async function fetchProductionOrders() {
  try {
    const res = await fetch('/api/production/orders');
    if (!res.ok) throw new Error("생산 주문 데이터 로딩 실패");
    productionOrders = await res.json();
    renderCalendar(currentYear, currentMonth);
  } catch (err) {
    console.error("생산 주문 데이터 로딩 중 오류:", err);
  }
}

function renderCalendar(year, month) {
  daysEl.innerHTML = '';
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  if (monthYearEl) monthYearEl.innerText = `${year}년 ${month + 1}월`;
  for (let i = 0; i < firstDayOfMonth; i++) daysEl.innerHTML += `<div></div>`;
  for (let d = 1; d <= lastDateOfMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isTodayDate = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
    const isSelectedDate = selectedDateEl && (selectedDateEl.dataset.dateValue === dateStr);
    const ordersForDate = productionOrders.filter(order => order.orderDate === dateStr || order.deliveryDate === dateStr);
    const orderMap = new Map();
    ordersForDate.forEach(order => {
      const existing = orderMap.get(order.orderCode) || { received: false, delivery: false };
      if (order.orderDate === dateStr) existing.received = true;
      if (order.deliveryDate === dateStr) existing.delivery = true;
      orderMap.set(order.orderCode, existing);
    });
    const markersHtml = Array.from(orderMap.values()).map(state => {
      if (state.received && state.delivery) return '<span class="dot both" title="접수 및 출고예정"></span>';
      if (state.received) return '<span class="dot received" title="접수"></span>';
      if (state.delivery) return '<span class="dot delivery" title="출고예정"></span>';
      return '';
    }).join('');
    let dayDivClasses = [];
    if (isTodayDate) dayDivClasses.push('today');
    if (isSelectedDate) dayDivClasses.push('selected');
    daysEl.innerHTML += `
      <div class="${dayDivClasses.join(' ')}" data-date="${dateStr}" onclick="selectDate('${dateStr}')">
        ${d}
        <div class="marker-container">${markersHtml}</div>
      </div>`;
  }
}

function selectDate(dateStr) {
  if (selectedDateEl) {
    const dateObj = new Date(dateStr);
    selectedDateEl.innerText = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
    selectedDateEl.dataset.dateValue = dateStr;
  }
  document.querySelectorAll('.days div').forEach(div => {
    div.classList.remove('selected');
    if (div.dataset.date === dateStr) div.classList.add('selected');
  });
  const ordersOnSelectedDate = productionOrders.filter(o => o.orderDate === dateStr || o.deliveryDate === dateStr);
  let receivedCount = 0;
  let deliveryCount = 0;
  const uniqueOrderCodes = new Set();
  ordersOnSelectedDate.forEach(o => {
    if (o.orderDate === dateStr && !uniqueOrderCodes.has(o.orderCode + '_received')) {
      receivedCount++;
      uniqueOrderCodes.add(o.orderCode + '_received');
    }
    if (o.deliveryDate === dateStr && !uniqueOrderCodes.has(o.orderCode + '_delivery')) {
      deliveryCount++;
      uniqueOrderCodes.add(o.orderCode + '_delivery');
    }
  });
  document.getElementById('order-count').innerText = receivedCount;
  document.getElementById('delivery-count').innerText = deliveryCount;
  if (startDateInput) startDateInput.value = dateStr;
  if (endDateInput) endDateInput.value = dateStr;
  const uniqueOrdersMap = new Map();
  ordersOnSelectedDate.forEach(o => {
    if (!uniqueOrdersMap.has(o.orderCode)) {
      uniqueOrdersMap.set(o.orderCode, {
        ...o,
        isReceivedToday: o.orderDate === dateStr,
        isDeliveryToday: o.deliveryDate === dateStr
      });
    } else {
      const existing = uniqueOrdersMap.get(o.orderCode);
      if (o.orderDate === dateStr) existing.isReceivedToday = true;
      if (o.deliveryDate === dateStr) existing.isDeliveryToday = true;
    }
  });
  const mergedOrders = Array.from(uniqueOrdersMap.values());
  let needProduceCount = 0;
  if (orderInfoList) {
    if (mergedOrders.length > 0) {
      orderInfoList.innerHTML = `
        <div style="font-size: 24px;">📦 예정 목록:</div>
        <ul style="padding-left: 16px; margin-top: 4px; font-size: 20px;">
          ${mergedOrders.map(o => {
            const labelHTML = o.isReceivedToday && o.isDeliveryToday
              ? '<span class="label both">접수+출고</span>'
              : o.isReceivedToday
              ? '<span class="label received">접수</span>'
              : '<span class="label delivery">출고 예정</span>';
            const currentStock = Number(o.stockQty ?? 0);
            const requiredQty = Number(o.orderQty ?? 0);
            const isEnoughStock = currentStock >= requiredQty;
            const status = isEnoughStock
              ? '<span style="color: green;">출고 가능</span>'
              : '<span style="color: red;">생산 필요</span>';
            if (!isEnoughStock && o.isReceivedToday) needProduceCount++;
            return `
              <li class="order-item ${o.isReceivedToday ? 'order-item-clickable' : ''}"
                  data-order='${JSON.stringify(o).replace(/'/g, "&apos;")}'
                  style="cursor:pointer;">
                ${labelHTML} [${o.orderCode}] ${o.custNm} / ${o.itemNm} / 주문 수량 ${requiredQty}개 / 현재 수량 ${currentStock}개
                → ${status}
              </li>`;
          }).join('')}
        </ul>`;
      document.querySelectorAll('.order-item-clickable').forEach(item => {
        item.addEventListener('click', handleOrderItemClick);
      });
    } else {
      orderInfoList.innerHTML = '<p style="text-align:center;">선택된 날짜의 주문/출고 예정이 없습니다.</p>';
    }
  }
  document.getElementById('need-produce').textContent = needProduceCount;
  if (addPlanBtn) addPlanBtn.disabled = true;
  resetAddPlanForm();
}

function handleOrderItemClick() {
  const orderData = JSON.parse(this.dataset.order.replace(/&apos;/g, "'"));
  if (startDateInput) startDateInput.value = orderData.orderDate || selectedDateEl.dataset.dateValue;
  if (endDateInput) endDateInput.value = orderData.deliveryDate || '';
  if (customerInput) customerInput.value = orderData.custNm || '';
  if (itemInput) itemInput.value = orderData.itemNm || '';
  if (orderQtyInput) orderQtyInput.value = orderData.orderQty || '';
  document.querySelectorAll('.order-item').forEach(el => el.classList.remove('active'));
  this.classList.add('active');
  if (addPlanBtn) {
    const currentStock = Number(orderData.stockQty || 0);
    const requiredQty = Number(orderData.orderQty || 0);
    addPlanBtn.disabled = !(orderData.isReceivedToday && currentStock < requiredQty);
  }
}

function resetAddPlanForm() {
  if (customerInput) customerInput.value = '';
  if (itemInput) itemInput.value = '';
  if (orderQtyInput) orderQtyInput.value = '';
  document.querySelectorAll('.order-item.active').forEach(el => el.classList.remove('active'));
  if (addPlanBtn) addPlanBtn.disabled = true;
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });
}

const addPlanForm = document.getElementById('addPlanForm');
if (addPlanForm) {
  addPlanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedOrderEl = document.querySelector('.order-item.active');
    if (!selectedOrderEl) {
      alert("생산 지시를 내릴 주문 항목을 목록에서 선택해주세요.");
      return;
    }
    const orderData = JSON.parse(selectedOrderEl.dataset.order.replace(/&apos;/g, "'"));
    const payload = {
      whIdx: orderData.whIdx,
      itemIdx: orderData.itemIdx,
      quantity: parseInt(orderQtyInput.value),
      userIdx: userIdxHiddenInput ? parseInt(userIdxHiddenInput.value) : null,
      custIdx: orderData.custIdx,
      unitPrice: orderData.unitPrice,
      planStartDate: startDateInput.value,
      planEndDate: endDateInput.value,
      originalOrderCode: orderData.orderCode
    };
    if (isNaN(payload.quantity) || payload.quantity <= 0) {
      alert("유효한 생산 수량을 입력해주세요.");
      return;
    }
    if (!payload.planStartDate || !payload.planEndDate) {
      alert("착수일과 납기일을 모두 입력해주세요.");
      return;
    }
    if (new Date(payload.planEndDate) < new Date(payload.planStartDate)) {
      alert("납기일은 착수일보다 빠를 수 없습니다.");
      return;
    }
    try {
      const res = await fetch('/api/production/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "생산 지시 추가 실패" }));
        throw new Error(errorData.message);
      } else{
		location.reload();
	  }
      const result = await res.json();
      alert(result.message || '✅ 생산 지시가 추가되었습니다.');
      resetAddPlanForm();
      fetchProductionOrders();
      const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      selectDate(selectedDateEl.dataset.dateValue || todayDateStr);
    } catch (err) {
      console.error("생산 지시 추가 중 오류:", err);
      alert(`❌ 생산 지시 추가 중 오류 발생: ${err.message}`);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  fetchProductionOrders().then(() => {
    selectDate(todayDateStr);
  });
});
