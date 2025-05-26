async function loadPurchases() {
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    if (!purchasesTableBody) {
        console.warn("ID가 'salesTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }

    const apiUrl = `/api/orders/purchases`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const purchases = await response.json();
        purchasesTableBody.innerHTML = '';

        if (purchases && purchases.length > 0) {
           	renderPurchases(purchases);
        } else {
            renderNoDataMessage();
        }
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.');
    }
}

// 테이블 랜더링
function renderPurchases(purchases) {
    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        row.dataset.id = sale.orderCode;
        row.onclick = () => openPurchaseDetail(purchase.orderIdx);

        // 체크박스 셀
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('sales-checkbox');
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        // 행 클릭 막기
        checkbox.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // 체크박스 상태 변경 시 전체선택 동기화
        checkbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('#purchasesTableBody input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            document.getElementById('selectAllCheckbox').checked = allChecked;
        });
		
		// 주문 고유 번호
		const idxCell = document.createElement('input');
		idxCell.type = 'hidden';
		idxCell.value = purchase.orderIdx || '';
		row.appendChild(idxCell);
		
        // 자재 번호 (품목 코드)
        const nameCell = document.createElement('td');
        nameCell.textContent = purchase.itemCode || '';
        row.appendChild(nameCell);

        // 품목명
		const itemCodeCell = document.createElement('td');
		itemCodeCell.textContent = purchase.itemName || '';
		row.appendChild(itemCodeCell);
       
		// 거래처명
		const customerNameCell = document.createElement('td');
        customerNameCell.textContent = purchase.customerName || '';
        row.appendChild(customerNameCell);

		// 수량
        const quantityCell = document.createElement('td');
        quantityCell.textContent = purchase.quantity || '';
        row.appendChild(quantityCell);
		
		// 발주일
		const deliveryDateCell = document.createElement('td');
		deliveryDateCell.textContent = purchase.orderDate || '';
		row.appendChild(deliveryDateCell);

        salesTableBody.appendChild(row);
    });
}

function renderNoDataMessage() {
    const salesTableBody = document.getElementById('salesTableBody');
    salesTableBody.innerHTML = '';

    const noDataRow = document.createElement('tr');
    const noDataCell = document.createElement('td');

    noDataCell.className = 'nodata';
    noDataCell.colSpan = 5;
    noDataCell.textContent = '등록된 데이터가 없습니다.';
    noDataCell.setAttribute('style', 'grid-column: span 7; justify-content: center; text-align: center;');

    noDataRow.appendChild(noDataCell);
    salesTableBody.appendChild(noDataRow);
}


function renderErrorMessage(message) {
    const salesTableBody = document.getElementById('salesTableBody');
    salesTableBody.innerHTML = '';

    const errorRow = document.createElement('tr');
    const errorCell = document.createElement('td');

    errorCell.colSpan = 5;
    errorCell.textContent = message || '데이터 로딩 중 오류가 발생했습니다.';
    errorCell.style.color = 'red';
    errorCell.setAttribute('style', 'grid-column: span 7; justify-content: center; text-align: center;');

    errorRow.appendChild(errorCell);
    salesTableBody.appendChild(errorRow);
}