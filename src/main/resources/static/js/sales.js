const companySearchInput = document.getElementById('companySearchInput');
const dataList = document.getElementById('companyList');
const selectedCustIdx = document.getElementById('selectedCustIdx');
const itemCycleTime = document.getElementById('itemCycleTime');
const itemList = document.getElementById('itemList');

const startDateInput = document.getElementById('startDate');
const quantityInput = document.getElementById('quantity');
const dueDateInput = document.getElementById('dueDate');
const cycleTimeInput = document.getElementById('itemCycleTime');

let itemDataMap = {};
let originalCustomerOptions = [];
let warehouseOptions = [];
let currentTh = null;
let currentOrder = 'asc';
	
document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	loadSales('deliveryDate', 'asc');
});

function order(sortBy) {//정렬
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => a.textContent = '↓');


	if (currentTh === sortBy) {
	    currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
	    currentOrder = 'asc';
	    currentTh = sortBy;
	}


	loadSales(sortBy, currentOrder);


	const arrow = document.querySelector(`th[onclick="order('${sortBy}')"] a`);
	arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
}

async function loadSales(sortBy, sortDirection) {
    const salesTableBody = document.getElementById('salesTableBody');
    if (!salesTableBody) {
        console.warn("ID가 'salesTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }

    const apiUrl = `/api/orders/sales?sortBy=${sortBy}&sortDirection=${sortDirection}`;
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
            row.onclick = () => openSalesDetail(sale.orderIdx);

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
			
			// 주문 고유 번호
			const idxCell = document.createElement('input');
			idxCell.type = 'hidden';
			idxCell.value = sale.orderIdx || '';
			row.appendChild(idxCell);
			
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
			
			const orderStatusCell = document.createElement('td');
			const statusText = sale.orderStatus === 'S1' ? '출고대기' :
					           sale.orderStatus === 'S2' ? '부분출고' :
					           sale.orderStatus === 'S3' ? '출고완료' : '';
					
			orderStatusCell.textContent = statusText;
			row.appendChild(orderStatusCell);

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
    noDataCell.setAttribute('style', 'grid-column: span 8; justify-content: center; text-align: center;');

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
    errorCell.setAttribute('style', 'grid-column: span 8; justify-content: center; text-align: center;');

    errorRow.appendChild(errorCell);
    salesTableBody.appendChild(errorRow);
}

function searchItems() {
    const searchQuery = document.getElementById('searchInput').value;

    const apiUrl = `/api/orders/search?searchTerm=${searchQuery}`;

    // Ajax 요청 보내기
	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			rendersales(data);
		})
		.catch(error => {
			console.error('검색 오류:', error);
			renderErrorMessage('검색중 오류가 발생하였습니다.');
		});
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);; // 예: 2025. 5. 30.
}

// 모달 열기
async function openModal(data = null) {
    const title = document.getElementById('modalTitle');
    title.textContent = '접수 등록';
    document.getElementById('modal').style.display = 'flex';
    document.querySelector('#modalForm button[name="save"]').style.display = 'block';
    document.querySelector('#modalForm button[name="edit"]').style.display = 'none';


    if(data){
		saveBtn.style.display = 'none';
		editBtn.style.display = 'block';
		document.getElementById('orderNo').value = data.orderCode || '';
	   	document.getElementById('startDate').value = formatDate(data.orderDate);
	   	document.getElementById('dueDate').value = formatDate(data.deliveryDate);
	   	document.getElementById('companySearchInput').value = data.customerName || '';
	   	document.getElementById('itemSearchInput').value = data.itemName || '';
		document.getElementById('quantity').value = data.orderQty || '';
	   	document.getElementById('userName').value = data.managerName || '';
	   	document.getElementById('userTel').value = data.managerTel || '';
	   	document.getElementById('remark').value = data.remark || '';
	} else{
	    fetchOrderNo(); // 주문번호 초기화 (있다면)
		loadCustomer();
		loadWarehouse();
	}
}

// 거래처 목록 불러오기
async function loadCustomer(){
    try {
        const customerResponse = await fetch('/api/customers/names');
        if (!customerResponse.ok) throw new Error('데이터 요청 실패');

        const customers = await customerResponse.json();
        const dataList = document.getElementById('companyList');
        dataList.innerHTML = '';
        originalCustomerOptions = [];

        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.custNm;
            option.dataset.idx = customer.custIdx;
            dataList.appendChild(option);
            originalCustomerOptions.push(option); // 필터링용
        });	
    } catch (err) {
        console.error('데이터 요청 오류:', err);
    }
}


// 창고 목록 불러오기
async function loadWarehouse(){
	try{
	const warehouseResponse = await fetch('/api/warehouses');
	if (!warehouseResponse.ok) throw new Error('창고 데이터 요청 실패');
	
	const warehouses = await warehouseResponse.json();
	const warehouseList = document.getElementById("whList");
	
	warehouseList.innerHTML = '';
	warehouseOptions = [];
	
	warehouses.forEach(wh => {
		const whOption = document.createElement('option');
		whOption.value = wh.whNm;
		whOption.dataset.idx = wh.whIdx;
		warehouseList.appendChild(whOption);
		warehouseOptions.push(whOption);
	})
	} catch(err){
		console.log("창고 로드 오류 : ",err);
	}
}

document.getElementById('whSearchInput').addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    const dataList = document.getElementById('whList');
    
    // 필터링된 창고 목록을 업데이트
    const filteredWhOptions = warehouseOptions.filter(option => 
        option.value.toLowerCase().includes(keyword)
    );

    // 기존 datalist를 비우고 필터링된 옵션을 다시 추가
    dataList.innerHTML = '';
    filteredWhOptions.forEach(option => {
        dataList.appendChild(option);
    });

    // 창고 목록에서 입력한 값이 일치하는 옵션을 찾고, 해당 whIdx를 hidden input에 설정
    const selectedOption = filteredWhOptions.find(option => option.value.toLowerCase() === keyword);
    if (selectedOption) {
        document.getElementById('selectedwhIdx').value = selectedOption.dataset.idx;
    } else {
        document.getElementById('selectedwhIdx').value = ''; // 일치하는 값이 없으면 빈 값으로 설정
    }
});

// 거래처 입력되면 custIdx 저장 + 품목 불러오기
document.getElementById('companySearchInput').addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const dataList = document.getElementById('companyList');
    dataList.innerHTML = '';

    originalCustomerOptions.forEach(option => {
        if (option.value.toLowerCase().includes(keyword)) {
            const clone = document.createElement('option');
            clone.value = option.value;
            clone.dataset.idx = option.dataset.idx;
            dataList.appendChild(clone);
        }
    });

    const match = Array.from(dataList.options).find(opt => opt.value === this.value);
    const custIdx = match ? match.dataset.idx : '';
    const selectedCustIdxEl = document.getElementById('selectedCustIdx');
    selectedCustIdxEl.value = custIdx;

    // custIdx가 있을 경우에만 품목 데이터 로딩
    const event = new Event('input');
    selectedCustIdxEl.dispatchEvent(event);
});

// custIdx에 따른 해당 품목 목록 가져오기
document.getElementById('selectedCustIdx').addEventListener('input', async function () {
    const custIdx = this.value;
    const itemList = document.getElementById('itemList');
    const itemSearchInput = document.getElementById('itemSearchInput');
    const itemCycleTime = document.getElementById('itemCycleTime');

    itemList.innerHTML = '';
    itemSearchInput.value = '';
    itemCycleTime.value = '';
    itemDataMap = {}; // reset

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
            option.value = item.itemNm;
            itemList.appendChild(option);

            // map 저장: 품목명 → cycleTime
			itemDataMap[item.itemNm] = {
			  cycleTime: item.cycleTime,
			  itemCost: item.itemCost,
			  itemIdx: item.itemIdx
			};
        });
    } catch (err) {
        console.error('품목 불러오기 오류:', err);
    }
});

// 품목 입력되면 해당 cycleTime, itemCost hidden에 저장
document.getElementById('itemSearchInput').addEventListener('input', function () {
    const selectedItemName = this.value;
    const itemInfo = itemDataMap[selectedItemName]; // 객체로 접근

    if (itemInfo) {
        document.getElementById('itemCycleTime').value = itemInfo.cycleTime || '';
        document.getElementById('itemPrice').value = itemInfo.itemCost || '';
        document.getElementById('itemIdx').value = itemInfo.itemIdx || '';
    } else {
        document.getElementById('itemCycleTime').value = '';
		document.getElementById('itemPrice').value  = '';
		document.getElementById('itemIdx').value = '';
    }
});

// 납기일 계산
function calculateDueDate() {
    const startDateStr = startDateInput.value;
    const quantity = Number(quantityInput.value);
    const cycleTime = Number(cycleTimeInput.value); // 분 단위

    if (!startDateStr || !quantity || quantity <= 0 || !cycleTime || cycleTime <= 0) {
        dueDateInput.value = '';
        return;
    }

    // 착수일을 Date 객체로 생성 (자정 0시 기준)
    const startDate = new Date(startDateStr + 'T00:00:00');

    // 총 소요시간(분) 계산
    const totalMinutes = quantity * cycleTime;

    // 총 소요시간을 밀리초로 변환 후 착수일에 더함
    const dueDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

    // 납기일을 yyyy-MM-dd 형식으로 포맷팅
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');

    dueDateInput.value = `${yyyy}-${mm}-${dd}`;
}

// 착수일, 수량, cycleTime 변경 시 납기일 계산
startDateInput.addEventListener('change', calculateDueDate);
quantityInput.addEventListener('input', calculateDueDate);

// 신규등록 DB저장
document.querySelector('button[name="save"]').addEventListener('click', async () => {

    if (!document.getElementById("startDate")) {
        alert('착수일을 입력해주세요.');
        return;
    } else if(!document.getElementById("quantity")){
		alert('수량을 입력해주세요.');
		return;
	} else if(!document.getElementById("companySearchInput")){
		alert("거래처를 입력해주세요.");
		return;
	} else if(!document.getElementById("itemIdx")){
		alert("품목을 선택해주세요.");
		return;
	}

    const orderData = {
		orderCode: document.getElementById("orderNo").value,
        orderType: 'S',
        orderDate: document.getElementById("startDate").value,
        custIdx: document.getElementById("selectedCustIdx").value,
		itemIdx: document.getElementById("itemIdx").value,
        orderQty: Number(document.getElementById("quantity").value),
        unitPrice: Number(document.getElementById("itemPrice").value),
		deliveryDate: document.getElementById("dueDate").value,
		userIdx : document.getElementById("userIdx").value,
		remark : document.getElementById("remark").value,
		expectedWhIdx : document.getElementById("selectedwhIdx").value,
		orderStatus: 'S1'
    };
	
	console.log(orderData);
    try {
        const response = await fetch('/api/orders/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('저장 실패');

        alert('주문이 등록되었습니다.');
        closeModal();
		loadSales();
    } catch (err) {
        alert('저장 중 오류가 발생했습니다.');
        console.error(err);
    }
});

async function openSalesDetail(orderIdx) {
    document.getElementById('modalTitle').textContent = '접수 정보';

    document.querySelector('#modalForm Button[name="save"]').style.display = 'none';
    document.querySelector('#modalForm Button[name="edit"]').style.display = 'block';
	try {
	  const response = await fetch(`/api/orders/detail/${orderIdx}`);
	  if (!response.ok) throw new Error('데이터 로딩 실패');

	  const data = await response.json();
	  openModal(data); // 받은 데이터로 모달 열기
	} catch (error) {
	  console.error(error);
	  alert('상세 데이터를 불러오는 데 실패했습니다.');
	}
}

function closeModal() {
	document.getElementById('modal').style.display = 'none';
	
	document.getElementById('itemSearchInput').value = '';
	document.getElementById('whSearchInput').value = '';
	document.getElementById('itemIdx').value = '';
	document.getElementById('itemPrice').value = '';
	document.getElementById('itemCycleTime').value = '';
	document.getElementById('quantity').value = '';
	document.getElementById('startDate').value = '';
	document.getElementById('dueDate').value = '';
	document.getElementById('remark').value = '';
	companySearchInput.value = '';
	
	dataList.innerHTML = '';
	
}

function outsideClick(e) {
    if (e.target.id === 'modal') {
        closeModal();
    }
}