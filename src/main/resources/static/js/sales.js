document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	loadSales();
});


async function loadSales() {
    const salesTableBody = document.getElementById('salesTableBody');
    if (!salesTableBody) {
        console.warn("ID가 'salesTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }

    const apiUrl = `/api/orders/sales`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sales = await response.json();
        salesTableBody.innerHTML = '';

        if (sales && sales.length > 0) {
            rendersales(sales);
        } else {
            renderNoDataMessage();
        }
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.');
    }
}

// 테이블 랜더링
function rendersales(sales) {
    const salesTableBody = document.getElementById('salesTableBody');
    salesTableBody.innerHTML = '';

    if (sales && sales.length > 0) {
        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.dataset.id = sale.orderCode;
            row.onclick = () => opensalesDetail(sale.orderCode);

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
                const checkboxes = document.querySelectorAll('#salesTableBody input[type="checkbox"]');
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                document.getElementById('selectAllCheckbox').checked = allChecked;
            });

            // 주문번호
            const nameCell = document.createElement('td');
            nameCell.textContent = sale.orderCode || '';
            row.appendChild(nameCell);

            // 품목명
            const itemNameCell = document.createElement('td');
            itemNameCell.textContent = sale.itemName || '';
            row.appendChild(itemNameCell);

            // 품목 코드
            const itemCodeCell = document.createElement('td');
            itemCodeCell.textContent = sale.itemCode || '';
            row.appendChild(itemCodeCell);

            // 수량
            const quantityCell = document.createElement('td');
            quantityCell.textContent = sale.quantity || '';
            row.appendChild(quantityCell);
            
			// 거래처명
			const customerNameCell = document.createElement('td');
            customerNameCell.textContent = sale.customerName || '';
            row.appendChild(customerNameCell);
			
			// 납기일
			const deliveryDateCell = document.createElement('td');
			deliveryDateCell.textContent = sale.customerName || '';
			row.appendChild(deliveryDateCell);

            salesTableBody.appendChild(row);
        });
    } else {
        renderNoDataMessage();
    }
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