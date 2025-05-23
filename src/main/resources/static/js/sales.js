const companySearchInput = document.getElementById('companySearchInput');
const dataList = document.getElementById('companyList');
const selectedCustIdx = document.getElementById('selectedCustIdx');
const itemList = document.getElementById('itemList');
let originalOptions = [];

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
            row.onclick = () => openSalesDetail(sale.orderCode);

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
			const itemCodeCell = document.createElement('td');
			itemCodeCell.textContent = sale.itemCode || '';
			row.appendChild(itemCodeCell);

            // 품목 코드
			const itemNameCell = document.createElement('td');
			itemNameCell.textContent = sale.itemName || '';
			row.appendChild(itemNameCell);

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
			deliveryDateCell.textContent = sale.deliveryDate || '';
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

function fetchOrderNo() {
    fetch('/api/orders/getno')
      .then(response => response.json())
      .then(data => {
        document.getElementById("orderNo").value = data.orderNo;
      })
      .catch(error => {
        console.error('주문번호 요청 실패:', error);
      });
}

async function openModal() {
    const title = document.getElementById('modalTitle');
    title.textContent = '접수 등록';
    document.getElementById('modal').style.display = 'flex';
    document.querySelector('#modalForm Button[name="save"]').style.display = 'block';
    document.querySelector('#modalForm Button[name="edit"]').style.display = 'none';
	fetchOrderNo();
	try {
	        const response = await fetch('/api/customers/names');
	        if (!response.ok) throw new Error('데이터 요청 실패');
	
	        const customer = await response.json();
	        customer.forEach(customer => {
	            const option = document.createElement('option');
				option.value = customer.custNm;
				option.dataset.idx = customer.custIdx;
	            dataList.appendChild(option);
	        });
	    } catch (err) {
	        console.error('거래처 목록 불러오기 오류:', err);
	    }
		originalOptions = Array.from(dataList.options);

}

companySearchInput.addEventListener('input', function () {
    const keyword = this.value.toLowerCase();

    // datalist 초기화
    dataList.innerHTML = '';
	
    // 필터링된 옵션만 다시 추가
	originalOptions.forEach(option => {
	    if (option.value.toLowerCase().includes(keyword)) {
	        const clone = document.createElement('option');
	        clone.value = option.value;
	        clone.dataset.idx = option.dataset.idx;
	        dataList.appendChild(clone);
	    }
	});
	
	const match = Array.from(dataList.options).find(opt => opt.value === this.value);
	document.getElementById('selectedCustIdx').value = match ? match.dataset.idx : '';
	
	const event = new Event('input');
	document.getElementById('selectedCustIdx').dispatchEvent(event);
});

selectedCustIdx.addEventListener('input', async function () {
    const custIdx = this.value;
	console.log(custIdx);

    // 이전 품목 리스트 초기화
    itemList.innerHTML = '';
	document.getElementById('itemSearchInput').value = '';
	
    if (!custIdx) return;

    try {
        const response = await fetch(`/api/items/active-for-selection?custIdx=${custIdx}`);
        if (!response.ok) {
            if (response.status === 204) {
                console.log('해당 거래처의 품목이 없습니다.');
                return;
            }
            throw new Error('품목 요청 실패');
        }

        const items = await response.json();
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.itemNm; // 품목명 표시
            itemList.appendChild(option);
        });
    } catch (err) {
        console.error('품목 불러오기 오류:', err);
    }
});

function openSalesDetail(orderCode) {
    openModal();
    document.getElementById('modalTitle').textContent = '접수 정보';

    document.querySelector('#modalForm input[name="save"]').style.display = 'none';
    document.querySelector('#modalForm input[name="edit"]').style.display = 'block';
}

function closeModal() {
	document.getElementById('modal').style.display = 'none';
	document.querySelector('#modal input[type="text"]').value = '';

	dataList.innerHTML = '';

	if (companySearchInput) companySearchInput.value = '';
	dataList.innerHTML = '';
	
}

function outsideClick(e) {
    if (e.target.id === 'modal') {
        closeModal();
    }
}