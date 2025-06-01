const daysEl = document.getElementById("days");
const monthYearEl = document.getElementById("month-year");
const selectedDateEl = document.getElementById("selected-date");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");


let today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let productionOrders = [];

async function fetchProductionOrders() {
	try {
		const res = await fetch('/api/production/orders');
		if (!res.ok) throw new Error("데이터 로딩 실패");
		productionOrders = await res.json();
		renderCalendar(currentYear, currentMonth); // 데이터 받아온 후 렌더링
	} catch (err) {
		console.error(err);
	}
}

function renderCalendar(year, month) {
	daysEl.innerHTML = '';
	const firstDay = new Date(year, month, 1).getDay();
	const lastDate = new Date(year, month + 1, 0).getDate();

	monthYearEl.innerText = `${year}년 ${month + 1}월`;

	for (let i = 0; i < firstDay; i++) {
		daysEl.innerHTML += `<div></div>`;
	}

	for (let d = 1; d <= lastDate; d++) {
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
		const isSelected = selectedDateEl.innerText === dateStr;

		const ordersForDate = productionOrders.filter(order =>
			order.orderDate === dateStr || order.deliveryDate === dateStr
		);

		// 중복 제거 + 상태 병합
		const orderMap = new Map();

		ordersForDate.forEach(order => {
			const existing = orderMap.get(order.orderCode) || { received: false, delivery: false };
			if (order.orderDate === dateStr) existing.received = true;
			if (order.deliveryDate === dateStr) existing.delivery = true;
			orderMap.set(order.orderCode, existing);
		});

		const markers = [...orderMap.values()].map(state => {
			if (state.received && state.delivery) return '<span class="dot both"></span>';
			if (state.received) return '<span class="dot received"></span>';
			if (state.delivery) return '<span class="dot delivery"></span>';
			return '';
		});

		let classList = [];
		if (isToday) classList.push('today');
		if (isSelected) classList.push('selected');

		daysEl.innerHTML += `
		    <div class="${classList.join(' ')}" data-date="${dateStr}" onclick="selectDate('${dateStr}')">
		      ${d}
		      <div class="marker-container">${markers.join('')}</div>
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
        if (div.dataset.date === dateStr) {
            div.classList.add('selected');
        }
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

                        const isEnoughStock = (o.stockQty ?? 0) >= o.orderQty;
                        const status = isEnoughStock
                            ? '<span style="color: green;">출고 가능</span>'
                            : '<span style="color: red;">생산 필요</span>';

                        if (!isEnoughStock && o.isReceivedToday) needProduceCount++;

                        return `
                            <li class="order-item ${o.isReceivedToday ? 'order-item-clickable' : ''}"
                                data-order='${JSON.stringify(o).replace(/'/g, "&apos;")}'
                                style="cursor:pointer;">
                              ${labelHTML} [${o.orderCode}] ${o.custNm} / ${o.itemNm} / 주문 수량 ${o.orderQty}개 / 현재 수량 ${(o.stockQty ?? 0)}개
                              → ${status}
                            </li>`;
                    }).join('')}
                </ul>
            `;

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


prevBtn.addEventListener("click", () => {
	currentMonth--;
	if (currentMonth < 0) {
		currentMonth = 11;
		currentYear--;
	}
	renderCalendar(currentYear, currentMonth);
});

nextBtn.addEventListener("click", () => {
	currentMonth++;
	if (currentMonth > 11) {
		currentMonth = 0;
		currentYear++;
	}
	renderCalendar(currentYear, currentMonth);

});

document.querySelector('.addPlan').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const selectedOrder = document.querySelector('.order-item.active');
  if (!selectedOrder) return;

  const orderData = JSON.parse(selectedOrder.dataset.order);

  const payload = {
    whIdx: orderData.whIdx,
    itemIdx: orderData.itemIdx,
    quantity: orderData.orderQty,
    userIdx: document.getElementById('userIdx').value,
	custIdx: orderData.custIdx,
	unitPrice: orderData.unitPrice
  };

  try {
    const res = await fetch('/api/production/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("재고 추가 실패");

    alert('✅ 재고가 반영되었습니다.');
  } catch (err) {
    console.error(err);
    alert('❌ 재고 반영 중 오류 발생');
  }
  location.reload();
});


window.addEventListener('DOMContentLoaded', () => {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const dateStr = `${yyyy}-${mm}-${dd}`;

	// 주문 데이터를 먼저 가져오고, 렌더링 및 날짜 선택
	fetchProductionOrders().then(() => {
		renderCalendar(currentYear, currentMonth); // 이 함수 내부에서 selectDate도 자동 호출 가능하지만
		selectDate(dateStr); // 강제로 오늘 날짜 클릭 효과까지 적용
	});
});