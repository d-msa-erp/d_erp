// production-planning.js

const daysEl = document.getElementById("days");
const monthYearEl = document.getElementById("month-year");
const selectedDateEl = document.getElementById("selected-date");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

// --- 모달 관련 DOM 요소 (openModal 함수에서 사용될 것들) ---
const startDateInput = document.getElementById('startDateInput');
const endDateInput = document.getElementById('endDateInput');
const customerInput = document.getElementById('customerInput');
const itemInput = document.getElementById('itemInput');
const orderQtyInput = document.getElementById('orderQtyInput');
const orderInfoList = document.getElementById('orderInfoList');
const addPlanBtn = document.getElementById('addPlanBtn');
const userIdxHiddenInput = document.getElementById('userIdx'); // HTML에 name="userIdx" 추가

let today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let productionOrders = []; // 서버에서 받아온 생산 관련 주문/계획 목록

async function fetchProductionOrders() {
    try {
        const res = await fetch('/api/production/orders'); // 이 API가 생산계획에 필요한 모든 데이터를 반환한다고 가정
        if (!res.ok) throw new Error("생산 주문 데이터 로딩 실패");
        productionOrders = await res.json();
        console.log("Fetched Production Orders:", productionOrders);
        renderCalendar(currentYear, currentMonth); // 데이터 로드 후 달력 다시 그리기
    } catch (err) {
        console.error("생산 주문 데이터 로딩 중 오류:", err);
        // 사용자에게 오류 알림 (예: alert 또는 화면에 메시지 표시)
    }
}

function renderCalendar(year, month) {
    daysEl.innerHTML = '';
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 해당 월의 첫 번째 날의 요일 (0=일요일, 1=월요일...)
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날짜

    if (monthYearEl) monthYearEl.innerText = `${year}년 ${month + 1}월`;

    // 첫 번째 날 이전의 빈 div 채우기
    for (let i = 0; i < firstDayOfMonth; i++) {
        daysEl.innerHTML += `<div></div>`;
    }

    // 해당 월의 날짜 채우기
    for (let d = 1; d <= lastDateOfMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isTodayDate = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
        // selectedDateEl.innerText 는 "YYYY년 M월 D일" 형식이거나 dateStr 형식일 수 있음. 일관성 필요.
        // 여기서는 dateStr 형식으로 비교한다고 가정
        const isSelectedDate = selectedDateEl && (selectedDateEl.dataset.dateValue === dateStr);


        // 해당 날짜에 대한 주문 찾기 (orderDate 또는 deliveryDate 기준)
        const ordersForDate = productionOrders.filter(order =>
            order.orderDate === dateStr || order.deliveryDate === dateStr
        );

        const orderMap = new Map(); // 중복 주문코드 제거 및 상태 병합용
        ordersForDate.forEach(order => {
            const existing = orderMap.get(order.orderCode) || { received: false, delivery: false, isOrder: false };
            if (order.orderDate === dateStr) {
                existing.received = true; // '접수' 마커
                existing.isOrder = true; // 생산 지시 대상이 될 수 있음
            }
            if (order.deliveryDate === dateStr) existing.delivery = true; // '출고' 마커
            orderMap.set(order.orderCode, existing);
        });

        // 마커 생성 (CSS 클래스 .dot .received, .dot .delivery, .dot .both 사용)
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
        selectedDateEl.dataset.dateValue = dateStr; // 실제 값 저장 (비교용)
    }

    document.querySelectorAll('.days div').forEach(div => {
        div.classList.remove('selected');
        if (div.dataset.date === dateStr) {
            div.classList.add('selected');
        }
    });

    // 해당 날짜의 주문 정보 필터링
    const ordersOnSelectedDate = productionOrders.filter(o => o.orderDate === dateStr || o.deliveryDate === dateStr);
    
    let receivedCount = 0;
    let deliveryCount = 0;
    const uniqueOrderCodesForDate = new Set(); // 중복 방지

    ordersOnSelectedDate.forEach(o => {
        if (o.orderDate === dateStr) {
             if(!uniqueOrderCodesForDate.has(o.orderCode + '_received')) {
                receivedCount++;
                uniqueOrderCodesForDate.add(o.orderCode + '_received');
             }
        }
        if (o.deliveryDate === dateStr) {
             if(!uniqueOrderCodesForDate.has(o.orderCode + '_delivery')) {
                deliveryCount++;
                uniqueOrderCodesForDate.add(o.orderCode + '_delivery');
             }
        }
    });

    document.getElementById('order-count').innerText = receivedCount;
    document.getElementById('delivery-count').innerText = deliveryCount;

    // 생산 지시 추가 폼의 착수일/납기일 자동 설정
    if (startDateInput) startDateInput.value = dateStr;
    if (endDateInput) endDateInput.value = dateStr; // 기본은 동일, 필요시 JS 로직 추가

    // 플래너 하단 목록 업데이트
    const uniqueOrdersMap = new Map();
    ordersOnSelectedDate.forEach(o => {
        if (!uniqueOrdersMap.has(o.orderCode)) {
            uniqueOrdersMap.set(o.orderCode, {
                ...o, // orderCode, custNm, itemNm, orderQty, stockQty, whIdx, itemIdx, unitPrice 등 DTO 필드
                isReceivedToday: o.orderDate === dateStr,
                isDeliveryToday: o.deliveryDate === dateStr
            });
        } else {
            const existing = uniqueOrdersMap.get(o.orderCode);
            if (o.orderDate === dateStr) existing.isReceivedToday = true;
            if (o.deliveryDate === dateStr) existing.isDeliveryToday = true;
        }
    });
    
    const mergedOrdersForDisplay = Array.from(uniqueOrdersMap.values());
    let needProduceCount = 0;

    if (orderInfoList) {
        if (mergedOrdersForDisplay.length > 0) {
            orderInfoList.innerHTML = `
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #33475b;">🗓️ 선택된 날짜의 주문/출고 예정 목록:</div>
              <ul style="padding-left: 0; margin-top: 4px; font-size: 14px; max-height: 150px; overflow-y: auto;">
                ${mergedOrdersForDisplay.map(o => {
                    let labelHTML = '';
                    if (o.isReceivedToday && o.isDeliveryToday) {
                        labelHTML = '<span class="label both">접수+출고</span>';
                    } else if (o.isReceivedToday) {
                        labelHTML = '<span class="label received">접수</span>';
                    } else if (o.isDeliveryToday) {
                        labelHTML = '<span class="label delivery">출고 예정</span>';
                    }
                    // stockQty와 orderQty는 숫자여야 함
                    const currentStock = Number(o.stockQty || 0);
                    const requiredQty = Number(o.orderQty || 0);
                    const isEnoughStock = currentStock >= requiredQty;
                    const statusText = isEnoughStock ? '<span style="color: green;">(재고충분) 출고가능</span>' : '<span style="color: red;">(재고부족) 생산필요</span>';
                    if (!isEnoughStock && o.isReceivedToday) { // 접수된 주문 중 재고 부족 건만 생산 필요 카운트
                        needProduceCount++;
                    }
                    // 클릭 시 생산 지시 폼에 정보 채우기 (isReceivedToday 건에 대해서만)
                    const itemClickable = o.isReceivedToday ? 'order-item-clickable' : '';
                    return `
                        <li class="order-item ${itemClickable}" data-order='${JSON.stringify(o).replace(/'/g, "&apos;")}'>
                          ${labelHTML} [${o.orderCode}] ${o.custNm} / ${o.itemNm} / 주문: ${requiredQty} / 현재고: ${currentStock}
                          → ${statusText}
                        </li>`;
                }).join('')}
              </ul>`;

            // 새로 생성된 .order-item 요소에 클릭 이벤트 리스너 추가
            document.querySelectorAll('.order-item-clickable').forEach(item => {
                item.addEventListener('click', handleOrderItemClick);
            });

        } else {
            orderInfoList.innerHTML = '<p style="text-align:center; color:#777; padding:10px 0;">선택된 날짜에 해당하는 주문/출고 예정이 없습니다.</p>';
        }
    }
    document.getElementById('need-produce').innerText = needProduceCount;
    if(addPlanBtn) addPlanBtn.disabled = true; // 날짜 선택 시 생산 지시 버튼 초기 비활성화
    resetAddPlanForm(); // 생산 지시 폼 초기화
}

function handleOrderItemClick() { // 주문 항목 클릭 시 생산 지시 폼 채우기
    const orderData = JSON.parse(this.dataset.order.replace(/&apos;/g, "'"));
    
    if (startDateInput) startDateInput.value = orderData.orderDate || selectedDateEl.dataset.dateValue; // 접수일 또는 선택일
    if (endDateInput) endDateInput.value = orderData.deliveryDate || ''; // 납기일
    if (customerInput) customerInput.value = orderData.custNm || '';
    if (itemInput) itemInput.value = orderData.itemNm || '';
    if (orderQtyInput) orderQtyInput.value = orderData.orderQty || '';
    
    // 현재 클릭된 항목에 active 클래스 부여, 다른 항목에서는 제거
    document.querySelectorAll('.order-item').forEach(el => el.classList.remove('active'));
    this.classList.add('active');

    if (addPlanBtn) {
        // 재고 부족하고, '접수' 상태인 주문에 대해서만 생산 지시 버튼 활성화
        const currentStock = Number(orderData.stockQty || 0);
        const requiredQty = Number(orderData.orderQty || 0);
        addPlanBtn.disabled = !(orderData.isReceivedToday && currentStock < requiredQty);
    }
}

function resetAddPlanForm() {
    if(customerInput) customerInput.value = '';
    if(itemInput) itemInput.value = '';
    if(orderQtyInput) orderQtyInput.value = '';
    // 착수일, 납기일은 selectDate에서 이미 설정되므로 유지
    document.querySelectorAll('.order-item.active').forEach(el => el.classList.remove('active'));
    if(addPlanBtn) addPlanBtn.disabled = true;
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

// 생산 지시 추가 폼 제출
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

      // 현재 입력된 값으로 페이로드 구성 (사용자가 수정했을 수 있으므로)
      const payload = {
        whIdx: orderData.whIdx,       // 원본 주문의 창고 ID (생산품 입고 창고)
        itemIdx: orderData.itemIdx,   // 생산할 품목 ID
        quantity: parseInt(document.getElementById('orderQtyInput').value), // 사용자가 입력한 생산 수량
        userIdx: userIdxHiddenInput ? parseInt(userIdxHiddenInput.value) : null, // 담당자 ID
        custIdx: orderData.custIdx,   // 원본 주문의 거래처 ID
        unitPrice: orderData.unitPrice, // 원본 주문의 단가 (참고용)
        planStartDate: document.getElementById('startDateInput').value, // 사용자가 입력한 착수일
        planEndDate: document.getElementById('endDateInput').value,     // 사용자가 입력한 납기일 (생산 완료일)
        originalOrderCode: orderData.orderCode, // 참조 원본 주문 코드
        // 추가적으로 생산 계획에 필요한 정보 (예: 생산 라인, 우선순위 등)
      };

      // 유효성 검사
      if (isNaN(payload.quantity) || payload.quantity <= 0) {
          alert("유효한 생산 수량을 입력해주세요.");
          return;
      }
      if (!payload.planStartDate || !payload.planEndDate) {
          alert("착수일과 납기일을 모두 입력해주세요.");
          return;
      }
      const startDate = new Date(payload.planStartDate);
      const endDate = new Date(payload.planEndDate);
      if (endDate < startDate) {
          alert("납기일은 착수일보다 빠를 수 없습니다.");
          return;
      }


      console.log("생산 지시 데이터:", payload);

      try {
        // API 엔드포인트는 실제 구현에 맞게 수정해야 함
        const res = await fetch('/api/production/plan/add', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(()=> ({message: "생산 지시 추가 실패"}));
            throw new Error(errorData.message);
        }
        
        const result = await res.json();
        alert(result.message || '✅ 생산 지시가 추가되었습니다.');
        // 성공 후 폼 초기화 및 목록 업데이트 등
        resetAddPlanForm();
        fetchProductionOrders(); // 전체 목록 갱신하여 마커 등 업데이트
        // 당일 날짜를 다시 선택하여 플래너 UI 업데이트
        const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        selectDate(selectedDateEl.dataset.dateValue || todayDateStr);


      } catch (err) {
        console.error("생산 지시 추가 중 오류:",err);
        alert(`❌ 생산 지시 추가 중 오류 발생: ${err.message}`);
      }
    });
}


// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', () => {
    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    fetchProductionOrders().then(() => {
        // renderCalendar(currentYear, currentMonth); // fetchProductionOrders 내부에서 호출됨
        selectDate(todayDateStr); // 오늘 날짜로 플래너 정보 초기화
    });
});