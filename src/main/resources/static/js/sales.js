const companySearchInput = document.getElementById('companySearchInput');
const dataList = document.getElementById('companyList');
const selectedCustIdx = document.getElementById('selectedCustIdx');
const itemCycleTime = document.getElementById('itemCycleTime');
const itemList = document.getElementById('itemList');

const startDateInput = document.getElementById('sDate');
const quantityInput = document.getElementById('quantity');
const dueDateInput = document.getElementById('dueDate');
const cycleTimeInput = document.getElementById('itemCycleTime');
const today = new Date().toISOString().split('T')[0];

let itemDataMap = {};
let originalCustomerOptions = [];
let warehouseOptions = [];
let qtyLowData = [];
let currentTh = 'orderIdx';
let currentOrder = 'desc';
let currentPage = 0;
let isDueDate = false;

document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	loadSales('orderIdx', 'desc', isDueDate);

	const selectAllMainCb = document.getElementById('selectAllCheckbox'); // 메인 테이블의 전체 선택 체크박스 ID
	if (selectAllMainCb) selectAllMainCb.addEventListener('change', function() {
		document.querySelectorAll('#salesTableBody .sales-checkbox').forEach(cb => {
			cb.checked = this.checked;
		});
	});

	document.getElementById("btn-prev-page")?.addEventListener('click', () => {
		if (currentPage > 0) {
			currentPage--;
			loadSales(currentTh, currentOrder, isDueDate);
		}
	});

	document.getElementById("btn-next-page")?.addEventListener('click', () => {
		if (currentPage < totalPages - 1) {
			currentPage++;
			loadSales(currentTh, currentOrder, isDueDate);
		}
	});

	document.getElementById("currentPageInput")?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') {
			const page = parseInt(e.target.value);
			if (!isNaN(page) && page >= 1 && page <= totalPages) {
				currentPage = page - 1;
				loadSales(currentTh, currentOrder, isDueDate);
			} else {
				alert('올바른 페이지 번호를 입력하세요.');
				e.target.value = currentPage + 1;
			}
		}
	});

	document.getElementById("sDate").addEventListener("change", searchItems);
	document.getElementById("endDate").addEventListener("change", searchItems);
	document.getElementById("toggleDateType").addEventListener("change", searchItems);
	document.getElementById('searchTransStatus').addEventListener('change', searchItems);

	document.getElementById("sDate").setAttribute("min", today);
});
function order(sortBy) {
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => {
		a.textContent = '↓';
		a.style.color = '#000';
		a.style.opacity = '0.3';
	});

	if (currentTh === sortBy) {
		currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
		currentTh = sortBy;
		currentOrder = 'asc';
	}

	currentPage = 0; // 🔥 정렬 시 페이지 초기화

	// 화살표 UI 업데이트
	const arrow = document.querySelector(`th[onclick="order('${sortBy}')"] a`);
	if (arrow) {
		arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
		arrow.style.color = '#000';
		arrow.style.opacity = '1';
	}

	loadSales(sortBy, currentOrder);
}


async function loadSales(sortBy, sortDirection, isDueDate) {
	const salesTableBody = document.getElementById('salesTableBody');;

	if (!salesTableBody) {
		console.warn("ID가 'salesTableBody'인 요소를 찾을 수 없습니다.");
		return;
	}

	const apiUrl = `/api/orders/sales?sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}`;
	try {
		const response = await fetch(apiUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const sales = await response.json();
		salesTableBody.innerHTML = '';
		totalPages = sales.totalPages;
		const paginationInfo = document.getElementById("paginationInfo");
		if (paginationInfo) {
			paginationInfo.textContent = `총 ${sales.totalElements}건 ${sales.number + 1}/${sales.totalPages}페이지`;
		}

		// 현재 페이지 표시
		const currentPageInput = document.getElementById("currentPageInput");
		if (currentPageInput) {
			currentPageInput.value = sales.number + 1;
		}

		if (sales && sales.content && sales.content.length > 0) {
			rendersales(sales.content, isDueDate);
		} else {
			renderNoDataMessage();
		}
	} catch (error) {
		console.error('데이터 로딩 실패:', error);
		renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.');
	}
}

// 테이블 랜더링
function rendersales(sales, isDueDate) {
	const salesTableBody = document.getElementById('salesTableBody');
	salesTableBody.innerHTML = '';

	if (!sales || sales.length === 0) {
		renderNoDataMessage();
		return;
	}

	// 주문만 추림
	const onlySales = sales.filter(sale => sale.orderType === 'S');
	const paginationInfo = document.getElementById("paginationInfo");
	const perPage = 10;
	const totalPages = Math.ceil(onlySales.length / perPage);
	if (paginationInfo) {
		paginationInfo.textContent = `총 ${onlySales.length}건 ${currentPage + 1}/${totalPages}페이지`;
	}
	if (onlySales.length > 0) {
		onlySales.forEach(sale => {
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

			checkbox.addEventListener('click', (event) => {
				event.stopPropagation();
			});
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

			// 납기일 또는 착수일
			const dateCell = document.createElement('td');
			dateCell.textContent = isDueDate ? sale.deliveryDate : sale.orderDate;
			row.appendChild(dateCell);

			// 상태
			const orderStatusCell = document.createElement('td');
			const statusText = sale.orderStatus === 'S1' ? '출고대기' :
				sale.orderStatus === 'S2' ? '출고가능' :
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
	noDataCell.colSpan = 8;
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

	errorCell.colSpan = 8;
	errorCell.textContent = message || '데이터 로딩 중 오류가 발생했습니다.';
	errorCell.style.color = 'red';
	errorCell.setAttribute('style', 'grid-column: span 8; justify-content: center; text-align: center;');

	errorRow.appendChild(errorCell);
	salesTableBody.appendChild(errorRow);
}

function searchItems() {
	const searchQuery = document.getElementById('searchInput')?.value?.trim() || '';
	const dateType = document.getElementById('toggleDateType').checked ? 'deliveryDate' : 'orderDate';
	const startDate = document.getElementById('startDate').value;
	const endDate = document.getElementById('endDate').value;
	const transStatus = document.getElementById('searchTransStatus').value;
	
	
	const queryParams = new URLSearchParams({
		searchTerm: searchQuery,
		page: currentPage,
		dateType,
		startDate,
		endDate,
		transStatus
	});

	const apiUrl = `/api/orders/search?${queryParams.toString()}`;
	console.log(apiUrl);
	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			let onlySales = data.content.filter(p => p.orderType === 'S');

			const selectedStatus = document.getElementById('searchTransStatus')?.value;
			if (selectedStatus) {
				onlySales = onlySales.filter(s => s.orderStatus === selectedStatus);
			}
			rendersales(onlySales, isDueDate);

			const paginationInfo = document.getElementById('paginationInfo');
			if (paginationInfo) {
				const total = onlySales.length;
				const perPage = 10;
				const totalPages = Math.max(1, Math.ceil(total / perPage));
				const currentPageNum = currentPage + 1;

				if (total === 0) {
					paginationInfo.textContent = '총 0건';
				} else {
					paginationInfo.textContent = `총 ${total}건 ${currentPageNum}/${totalPages}페이지`;
				}
			} else {
				renderNoDataMessage();
			}
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
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function setdate() {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	document.getElementById('sDate').value = `${yyyy}-${mm}-${dd}`;
};

// 모달 열기
async function openModal(data = null) {
	const title = document.getElementById('modalTitle');
	title.textContent = '접수 등록';
	document.getElementById('modal').style.display = 'flex';
	document.querySelector('#modalForm button[name="save"]').style.display = 'block';
	document.querySelector('#modalForm button[name="edit"]').style.display = 'none';
	const inputs = modal.querySelectorAll('input');

	if (data) {
		title.textContent = '주문 정보';
		saveBtn.style.display = 'none';
		editBtn.style.display = 'block';
		document.getElementById("orderIdx").value = data.orderIdx;
		document.getElementById("orderNo").value = data.orderCode;
		document.getElementById("unitPrice").value = data.unitPrice;
		document.getElementById("itemCycleTime").value = data.cycleTime;
		document.getElementById("itemIdx").value = data.itemIdx;
		document.getElementById('orderNo').value = data.orderCode || '';
		document.getElementById('sDate').value = formatDate(data.orderDate);
		document.getElementById('dueDate').value = formatDate(data.deliveryDate);
		document.getElementById('companySearchInput').value = data.customerName || '';
		document.getElementById('selectedCustIdx').value = data.customerIdx;
		document.getElementById('itemSearchInput').value = data.itemName || '';
		document.getElementById('quantity').value = data.orderQty || '';
		document.getElementById('userName').value = data.managerName || '';
		document.getElementById('userTel').value = data.managerTel || '';
		document.getElementById('remark').value = data.remark || '';
		document.getElementById('whSearchInput').value = data.whNm || '';
		document.getElementById('selectedwhIdx').value = data.whIdx;

		inputs.forEach(input => {
			if (input.type !== 'hidden') {
				input.readOnly = true;
			}
		});
		
		document.getElementById('quantity').readOnly = false;
		document.getElementById('whSearchInput').readOnly = false;
		loadWarehouse();
	} else {
		inputs.forEach(input => {
			if (input.type !== 'hidden') {
				input.readOnly = false;
			}
		});
		fetchOrderNo(); // 주문번호 초기화 (있다면)
		loadCustomer();
		loadWarehouse();
		setdate();
	}
}

// 거래처 목록 불러오기
async function loadCustomer() {
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
async function loadWarehouse() {
	try {
		const response = await fetch('/api/warehouses');
		if (!response.ok) throw new Error('창고 데이터 요청 실패');

		const warehouses = await response.json();
		const warehousesContent = warehouses.content;
		const warehouseList = document.getElementById("whList");

		warehouseList.innerHTML = '';
		warehouseOptions = [];

		warehousesContent.forEach(wh => {
			const option = document.createElement('option');
			option.value = wh.whNm;
			option.dataset.idx = wh.whIdx;
			warehouseList.appendChild(option);
			warehouseOptions.push(option);
		});
	} catch (err) {
		console.error("창고 로드 오류:", err);
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
document.getElementById('companySearchInput').addEventListener('input', function() {
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
document.getElementById('selectedCustIdx').addEventListener('input', async function() {
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
document.getElementById('itemSearchInput').addEventListener('input', function() {
	const selectedItemName = this.value;
	const itemInfo = itemDataMap[selectedItemName];

	if (itemInfo) {
		document.getElementById('itemCycleTime').value = itemInfo.cycleTime || '';
		document.getElementById('itemPrice').value = itemInfo.itemCost || '';
		document.getElementById('itemIdx').value = itemInfo.itemIdx || '';

		const warehouseList = document.getElementById('whList');
		warehouseList.innerHTML = '';
		warehouseOptions.forEach(option => {
			warehouseList.appendChild(option.cloneNode(true));
		});
	} else {
		document.getElementById('itemCycleTime').value = '';
		document.getElementById('itemPrice').value = '';
		document.getElementById('itemIdx').value = '';

		// ❗ 품목이 잘못 입력됐을 때만 창고 초기화
		const warehouseList = document.getElementById('whList');
		warehouseList.innerHTML = '';
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

	if (!document.getElementById("sDate").value) {
		alert('착수일을 입력해주세요.');
		return;
	} else if (!document.getElementById("quantity").value) {
		alert('수량을 입력해주세요.');
		return;
	} else if (!document.getElementById("companySearchInput").value) {
		alert("거래처를 입력해주세요.");
		return;
	} else if (!document.getElementById("itemIdx").value) {
		alert("품목을 선택해주세요.");
		return;
	}

	const orderData = {
		orderCode: document.getElementById("orderNo").value,
		orderType: 'S',
		orderDate: document.getElementById("sDate").value,
		custIdx: document.getElementById("selectedCustIdx").value,
		itemIdx: document.getElementById("itemIdx").value,
		orderQty: Number(document.getElementById("quantity").value),
		unitPrice: Number(document.getElementById("itemPrice").value),
		deliveryDate: document.getElementById("dueDate").value,
		userIdx: document.getElementById("userIdx").value,
		remark: document.getElementById("remark").value,
		expectedWhIdx: document.getElementById("selectedwhIdx").value,
		orderStatus: 'S1'
	};

	try {
		const response = await fetch('/api/orders/save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderData),
		});

		if (!response.ok) throw new Error('저장 실패');

		const result = await response.json();

		let message = '✅ 주문이 등록되었습니다.';

		// 자재 부족 경고가 있으면 메시지에 추가
		if (result.productShortage) {
			message += '\n⚠ [주의] 완제품 재고 부족. \n제품 생산이 필요합니다';
		}
		if (result.materialShortage) {
			message += '\n⚠ [주의] 원자재가 부족하여 생산이 불가능합니다.';
		}
		if (result.warnings && result.warnings.length > 0) {
			message += '\n\n📦 부족 자재 목록:\n' + result.warnings.join('\n');
		}

		alert(message); // 최종 메시지 출력

		closeModal();
		loadSales('deliveryDate', 'asc');
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

document.getElementById("editBtn").addEventListener("click", async () => {
	const orderCode = document.getElementById("orderNo").value;

	const orderData = {
		orderIdx: document.getElementById("orderIdx").value,
		orderCode: orderCode,
		orderType: 'S',
		orderDate: document.getElementById("sDate").value,
		custIdx: document.getElementById("selectedCustIdx").value,
		itemIdx: document.getElementById("itemIdx").value,
		orderQty: Number(document.getElementById("quantity").value),
		unitPrice: Number(document.getElementById("unitPrice").value),
		deliveryDate: document.getElementById("dueDate").value,
		userIdx: document.getElementById("userIdx").value,
		remark: document.getElementById("remark").value,
		expectedWhIdx: document.getElementById("selectedwhIdx").value
	};

	try {
		const response = await fetch('/api/orders/update', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderData)
		});
		if (!response.ok) throw new Error('수정 실패');

		alert('수정 완료');
		closeModal();
		loadSales('orderIdx', 'desc', isDueDate);
	} catch (err) {
		alert('수정 중 오류 발생');
		console.error(err);
	}
});

function toggleText(checkbox) {
	const label = document.getElementById('toggleState');
	isDueDate = checkbox.checked;

	label.textContent = isDueDate ? '납기일' : '착수일';

	const dateHeader = document.getElementById('dateColumnHeader');
	if (dateHeader) {
		const arrow = dateHeader.querySelector('a'); // 화살표 요소 분리
		dateHeader.innerHTML = ''; // 기존 전체 제거
		dateHeader.append(isDueDate ? '납기일' : '착수일');
		if (arrow) dateHeader.appendChild(arrow); // 기존 화살표 다시 붙이기
	}

	const sortBy = isDueDate ? 'deliveryDate' : 'orderDate';
	loadSales(sortBy, currentOrder, isDueDate);
}

function closeModal() {
	document.getElementById('modal').style.display = 'none';
	document.getElementById('modalForm').reset();

	dataList.innerHTML = '';

}

function outsideClick(e) {
	if (e.target.id === 'modal') {
		closeModal();
	}
}


async function downloadExcel() {
	const checked = document.querySelectorAll('#salesTableBody input.sales-checkbox:checked');
	const ids = Array.from(checked).map(cb =>
		cb.closest('tr').querySelector('input[type="hidden"]').value);
				
	if (ids.length === 0) {
		alert('엑셀로 내보낼 항목을 선택해주세요.');
		return;
	}


	const url = `/api/orders/sale/excel?${ids.map(id => `id=${id}`).join('&')}`;
	const response = await fetch(url);

	if (!response.ok) {
		alert('엑셀 다운로드 실패');
		return;
	}

	const blob = await response.blob();


	const disposition = response.headers.get('Content-Disposition');
	let fileName = 'sale.xlsx'; // 기본값

	if (disposition && disposition.includes('filename=')) {
		const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
		if (matches != null && matches[1]) {
			fileName = decodeURIComponent(matches[1].replace(/['"]/g, ''));
		}
	}

	const a = document.createElement('a');
	a.href = window.URL.createObjectURL(blob);
	a.download = fileName;
	a.click();
}

function printSelectedSales() {
	const checked = document.querySelectorAll('#salesTableBody input.sales-checkbox:checked');
	const ids = Array.from(checked).map(cb =>
		cb.closest('tr').querySelector('input[type="hidden"]').value
	);

	const fetchUrlFn = id => `/api/orders/printsales?${ids.map(id => `id=${id}`).join('&')}`;
	const columns = [
		{ key: 'orderCode', label: '주문번호' },
		{ key: 'itemName', label: '품목명' },
		{ key: 'customerName', label: '거래처' },
		{ key: 'quantity', label: '수량' },
		{ key: 'orderDate', label: '발주일', render: formatDate },
		{ key: 'deliveryDate', label: '납기일', render: formatDate },
		{ key: 'totalPrice', label: '총액' },
		{ key: 'userName', label: '담당자' }
	];

	printByIds(ids, fetchUrlFn, columns, '주문 인쇄');
}

document.getElementById('startDate').addEventListener('change', function () {
	const startDate = this.value;
	const endDateInput = document.getElementById('endDate');

	if (startDate) {
		endDateInput.min = startDate;
		if (endDateInput.value && endDateInput.value < startDate) {
			endDateInput.value = '';
		}
	}
});


