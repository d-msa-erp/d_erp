document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	loadPurchases('deliveryDate', 'asc');
});

async function loadPurchases(sortBy, sortDirection) {
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    if (!purchasesTableBody) {
        console.warn("ID가 'purchasesTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }

    const apiUrl = `/api/orders/purchases?sortBy=${sortBy}&sortDirection=${sortDirection}`;
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
	purchasesTableBody.innerHTML = '';
    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        row.dataset.id = purchase.orderCode;
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
		
		// 총액
		const totalPriceCell = document.createElement('td');
		totalPriceCell.textContent = purchase.totalPrice || '';
		row.appendChild(totalPriceCell);
		
		// 담당자명
		const userNameCell = document.createElement('td');
		userNameCell.textContent = purchase.userName || '';
		row.appendChild(userNameCell);		
		
		// 상태
		const orderStatusCell = document.createElement('td');
		const statusText = purchase.orderStatus === 'P1' ? '입고대기' :
		                   purchase.orderStatus === 'P2' ? '부분입고' :
		                   purchase.orderStatus === 'P3' ? '입고완료' : '';
		
		orderStatusCell.textContent = statusText;
		row.appendChild(orderStatusCell);		
		
        purchasesTableBody.appendChild(row);
    });
}

function renderNoDataMessage() {
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    purchasesTableBody.innerHTML = '';

    const noDataRow = document.createElement('tr');
    const noDataCell = document.createElement('td');

    noDataCell.className = 'nodata';
    noDataCell.colSpan = 5;
    noDataCell.textContent = '등록된 데이터가 없습니다.';
    noDataCell.setAttribute('style', 'grid-column: span 10; justify-content: center; text-align: center;');

    noDataRow.appendChild(noDataCell);
    purchasesTableBody.appendChild(noDataRow);
}


function renderErrorMessage(message) {
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    purchasesTableBody.innerHTML = '';

    const errorRow = document.createElement('tr');
    const errorCell = document.createElement('td');

    errorCell.colSpan = 5;
    errorCell.textContent = message || '데이터 로딩 중 오류가 발생했습니다.';
    errorCell.style.color = 'red';
    errorCell.setAttribute('style', 'grid-column: span 10; justify-content: center; text-align: center;');

    errorRow.appendChild(errorCell);
    purchasesTableBody.appendChild(errorRow);
}

function searchItems() {
    const searchQuery = document.getElementById('searchInput').value;

    const apiUrl = `/api/orders/search?searchTerm=${searchQuery}`;

    // Ajax 요청 보내기
	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			renderPurchases(data);
		})
		.catch(error => {
			console.error('검색 오류:', error);
			renderErrorMessage('검색중 오류가 발생하였습니다.');
		});
}


let currentTh = null;
let currentOrder = 'desc';

function order(sortBy) {//정렬
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => a.textContent = '↓');  // 화살표 초기화

	// 기존에 클릭된 컬럼이면 정렬 방향을 변경, 아니면 기본 'asc'
	if (currentTh === sortBy) {
	    currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
	    currentOrder = 'asc';  // 다른 컬럼 클릭 시 기본 'asc'로 설정
	    currentTh = sortBy;
	}

	// 서버로 정렬된 데이터를 요청
	loadPurchases(sortBy, currentOrder);

	// 화살표 방향 갱신
	const arrow = document.querySelector(`th[onclick="order('${sortBy}')"] a`);
	arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
}