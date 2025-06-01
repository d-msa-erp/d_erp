let itemList = []; // 품목 리스트를 담을 배열
const companyCustMap = new Map(); // 거래처명에 따른 idx를 담을 map
let currentPage = 0;
let sortBy = 'deliveryDate';
let sortDirection = 'asc';
let currentOrderIdx = null;

document.addEventListener('DOMContentLoaded', () => {
	// 탭 로딩
	loadPurchases('deliveryDate', 'asc');
	loadLowInventoryItems();

	const selectAllMainCb = document.getElementById('selectAllCheckbox'); // 메인 테이블의 전체 선택 체크박스 ID
	if (selectAllMainCb) selectAllMainCb.addEventListener('change', function() {
		document.querySelectorAll('#purchasesTableBody .purchase-checkbox').forEach(cb => {
			cb.checked = this.checked;
		});
	});

	// 이전 버튼
	document.getElementById("btn-prev-page")?.addEventListener('click', () => {
		if (currentPage > 0) {
			currentPage--;
			loadPurchases(sortBy, sortDirection);
		}
	});

	// 다음 버튼
	document.getElementById("btn-next-page")?.addEventListener('click', () => {
		if (currentPage < totalPages - 1) {
			currentPage++;
			loadPurchases(sortBy, sortDirection);
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

	document.getElementById('searchTransStatus').addEventListener('change', searchItems);

});
//옆에 창 토글기능
document.getElementById("toggleLowStockBtn").addEventListener("click", function() {
	const box = document.getElementById("lowStockNotice");

	if (box.style.display === "none") {
		box.style.display = "block";
		this.textContent = "닫기";
	} else {
		box.style.display = "none";
		this.textContent = "열기";
	}
});









function setdate() {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const todayStr = `${yyyy}-${mm}-${dd}`;

	document.getElementById('orderDate').value = todayStr;
	
	const deliveryDateInput = document.getElementById('deliveryDate');
	if (deliveryDateInput) {
		deliveryDateInput.min = todayStr;

		if (deliveryDateInput.value && deliveryDateInput.value < todayStr) {
			deliveryDateInput.value = '';
		}
	}
};


async function loadPurchases(sortBy, sortDirection) {
	const purchasesTableBody = document.getElementById('purchasesTableBody');
	if (!purchasesTableBody) {
		console.warn("ID가 'purchasesTableBody'인 요소를 찾을 수 없습니다.");
		return;
	}

	const apiUrl = `/api/orders/purchases?sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}`;
	try {
		const response = await fetch(apiUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const purchases = await response.json();
		purchasesTableBody.innerHTML = '';
		const paginationInfo = document.getElementById("paginationInfo");
		if (paginationInfo) {
			paginationInfo.textContent = `총 ${purchases.totalElements}건 ${purchases.number + 1}/${purchases.totalPages}페이지`;
		}
		console.log("총 페이지 수:", purchases.totalPages);
		// 현재 페이지 표시
		const currentPageInput = document.getElementById("currentPageInput");
		if (currentPageInput) {
			currentPageInput.value = purchases.number + 1;
		}
		totalPages = purchases.totalPages;

		if (purchases && purchases.content && purchases.content.length > 0) {
			renderPurchases(purchases.content);
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

	if (!purchases || purchases.length === 0) {
		renderNoDataMessage();
		return;
	}
	const onlyPurchase = purchases.filter(purchases => purchases.orderType === 'P');
	const paginationInfo = document.getElementById("paginationInfo");
	const perPage = 10;
	const totalPages = Math.ceil(onlyPurchase.length / perPage);
	if (paginationInfo) {
		paginationInfo.textContent = `총 ${onlyPurchase.length}건 ${currentPage + 1}/${totalPages}페이지`;
	}
	onlyPurchase.forEach(purchase => {
		const row = document.createElement('tr');
		row.dataset.id = purchase.orderCode;
		row.onclick = () => openPurchasedetail(purchase.orderIdx);

		// 체크박스 셀
		const checkboxCell = document.createElement('td');
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.classList.add('purchase-checkbox');
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
	noDataCell.colSpan = 9;
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

	errorCell.colSpan = 9;
	errorCell.textContent = message || '데이터 로딩 중 오류가 발생했습니다.';
	errorCell.style.color = 'red';
	errorCell.setAttribute('style', 'grid-column: span 10; justify-content: center; text-align: center;');

	errorRow.appendChild(errorCell);
	purchasesTableBody.appendChild(errorRow);
}

function searchItems() {
	const searchQuery = document.getElementById('searchInput')?.value?.trim() || '';
	const transStatus = document.getElementById('searchTransStatus').value;

	const queryParams = new URLSearchParams({
		searchTerm: searchQuery,
		page: currentPage,
		transStatus
	});

	const apiUrl = `/api/orders/search?${queryParams.toString()}`;

	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			if (data && data.content) {
				const onlyPurchases = data.content.filter(p => p.orderType === 'P');
				renderPurchases(onlyPurchases);

				const paginationInfo = document.getElementById('paginationInfo');
				if (paginationInfo) {
					const total = onlyPurchases.length;
					const perPage = 10;
					const totalPages = Math.ceil(total / perPage);
					const currentPageNum = currentPage + 1;

					if (total === 0) {
						paginationInfo.textContent = '총 0건';
					} else {
						paginationInfo.textContent = `총 ${total}건 ${currentPageNum}/${totalPages}페이지`;
					}
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


let currentTh = null;
let currentOrder = 'desc';

function order(column) { // 정렬
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => {
		a.textContent = '↓';
		a.style.color = '#000';
		a.style.opacity = '0.3';
	});

	// 기존에 클릭된 컬럼이면 정렬 방향을 변경, 아니면 기본 'asc'
	if (currentTh === sortBy) {
		currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
		currentOrder = 'asc';  // 다른 컬럼 클릭 시 기본 'asc'로 설정
		currentTh = sortBy;
	}
	sortBy = column;
	sortDirection = currentOrder;
	// 서버로 정렬된 데이터를 요청
	loadPurchases(sortBy, currentOrder);

	// 화살표 방향 갱신 및 스타일 적용
	const arrow = document.querySelector(`th[onclick="order('${sortBy}')"] a`);
	if (arrow) {
		arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
		arrow.style.color = '#000';
		arrow.style.opacity = '1';
	}
}

async function loadItems() {
	try {
		const response = await fetch('/api/inventory/qty');
		if (!response.ok) throw new Error("서버 오류");
		itemList = await response.json();

		// 자재명 datalist 초기화
		const itemNameList = document.getElementById("itemList");
		itemNameList.innerHTML = "";

		// 자재명만 중복 제거해서 datalist에 추가
		const uniqueItemNames = [...new Set(itemList.map(item => item.itemNm))];

		uniqueItemNames.forEach(name => {
			const option = document.createElement("option");
			option.value = name;
			itemNameList.appendChild(option);
		});

	} catch (err) {
		console.error("자재 불러오기 실패:", err);
	}
}

async function openModal(data = null) {
	const title = document.getElementById('modalTitle');
	title.textContent = '발주 등록';
	document.getElementById('modal').style.display = 'flex';
	document.querySelector('#modalForm Button[name="save"]').style.display = 'block';
	document.querySelector('#modalForm Button[name="edit"]').style.display = 'none';
	document.getElementById('optimalInventory').style.display = 'block';
	document.getElementById('currentInventory').style.display = 'block';
	document.getElementById('optimalInventoryText').style.display = 'block';
	document.getElementById('currentInventoryText').style.display = 'block';
	document.getElementById('itemCode').readOnly = false;
	document.getElementById('itemName').readOnly = false;
	document.getElementById('unitPrice').readOnly = true;
	document.getElementById('companySearchInput').readOnly = false;

	if (data) {
		if (data.origin === 'lowInventory') {
			// 재고 부족 박스에서 온 경우
			await loadItems();
			loadWarehouse();
			setdate();
			fetchOrderNo();
			document.getElementById('itemCode').value = data.itemCd || '';
			document.getElementById('itemName').value = data.itemNm || '';
			document.getElementById('unitPrice').value = data.itemCost || '';
			document.getElementById('quantity').value = '';
			document.getElementById('optimalInventory').textContent = data.optimalInv ?? '';
			document.getElementById('currentInventory').textContent = data.stockQty ?? '';
			document.getElementById('itemIdx').value = data.itemIdx;
			document.getElementById('itemName').dispatchEvent(new Event('change')); // 거래처 목록을 받아오기 위한 강제 이벤트 발생
		} else {
			console.log("🔍 모달 데이터 구조 확인:", data);
			title.textContent = '발주 정보';
			saveBtn.style.display = 'none';
			editBtn.style.display = 'block';
			loadWarehouse();
			loadItems();
			document.getElementById("orderIdx").value = data.orderIdx;
			document.getElementById('itemCode').value = data.itemCode;
			document.getElementById('itemCode').readOnly = true;
			document.getElementById('itemName').value = data.itemName;
			document.getElementById('itemName').readOnly = true;
			document.getElementById('unitPrice').value = data.unitPrice;
			document.getElementById('quantity').value = data.orderQty;
			document.getElementById('companySearchInput').value = data.customerName;
			document.getElementById('companySearchInput').readOnly = true;
			document.getElementById('selectedCustIdx').value = data.customerIdx;
			document.getElementById('whSearchInput').value = data.whNm;
			document.getElementById('selectedwhIdx').value = data.whIdx;
			document.getElementById('orderDate').value = data.orderDate.substring(0, 10);
			document.getElementById('deliveryDate').value = data.deliveryDate.substring(0, 10);
			document.getElementById('optimalInventory').style.display = 'none';
			document.getElementById('currentInventory').style.display = 'none';
			document.getElementById('optimalInventoryText').style.display = 'none';
			document.getElementById('currentInventoryText').style.display = 'none';
		}
	} else {
		loadItems();
		loadWarehouse();
		setdate();
		fetchOrderNo();
	}
}

document.getElementById("itemName").addEventListener("change", async () => {
	const selectedItemName = document.getElementById("itemName").value;

	if (!selectedItemName) {
		// 품목명 지우면 필드 초기화
		document.getElementById("itemCode").value = '';
		document.getElementById("unitPrice").value = '';
		document.getElementById("itemIdx").value = '';
		document.getElementById("currentInventory").textContent = '0';
		document.getElementById("optimalInventory").textContent = '0';
		document.getElementById("companySearchInput").value = '';
		document.getElementById("selectedCustIdx").value = '';

		const currentInventoryEl = document.getElementById("currentInventory");
		currentInventoryEl.style.color = "";
		currentInventoryEl.style.fontWeight = "";

		return;
	}

	const matchingItems = itemList.filter(item => item.itemNm === selectedItemName);
	if (matchingItems.length === 0) return;

	const firstMatch = matchingItems[0];
	const itemIdx = firstMatch.itemIdx;

	document.getElementById("itemCode").value = firstMatch.itemCd || '';
	document.getElementById("unitPrice").value = firstMatch.itemCost || '';
	document.getElementById("itemIdx").value = itemIdx || '';

	//  재고 총합 
	try {
		const response = await fetch(`/api/inventory/total-stock?itemIdx=${itemIdx}`);
		if (!response.ok) throw new Error('재고 조회 실패');
		const totalStock = await response.json();
		document.getElementById("currentInventory").textContent = totalStock ?? '0';

		const optimal = Number(firstMatch.optimalInv ?? 0);
		const current = Number(totalStock ?? 0);
		const currentInventoryEl = document.getElementById("currentInventory");

		if (current < optimal) {
			currentInventoryEl.style.color = "red";
			currentInventoryEl.style.fontWeight = "bold";
		} else {
			currentInventoryEl.style.color = "";
			currentInventoryEl.style.fontWeight = "";
		}
	} catch (err) {
		console.error("재고 조회 오류:", err);
		document.getElementById("currentInventory").textContent = "조회 실패";
	}

	document.getElementById("optimalInventory").textContent = firstMatch.optimalInv ?? '0';

	// 거래처 리스트 생성
	const companyList = document.getElementById("companyList");
	companyList.innerHTML = "";
	companyCustMap.clear();

	const uniqueCompanies = new Map();
	matchingItems.forEach(item => {
		if (!uniqueCompanies.has(item.custNm)) {
			uniqueCompanies.set(item.custNm, item.custIdx);
		}
	});

	for (const [custNm, custIdx] of uniqueCompanies) {
		companyCustMap.set(custNm, custIdx);
		const option = document.createElement("option");
		option.value = custNm;
		companyList.appendChild(option);
	}

	document.getElementById("companySearchInput").value = '';
	document.getElementById("selectedCustIdx").value = '';
});

// 거래처 선택시 idx값 들어가게 설정
document.getElementById("companySearchInput").addEventListener("change", () => {
	const selectedCompany = document.getElementById("companySearchInput").value;

	if (companyCustMap.has(selectedCompany)) {
		document.getElementById("selectedCustIdx").value = companyCustMap.get(selectedCompany);
	} else {
		document.getElementById("selectedCustIdx").value = '';
	}
});

// 신규등록 DB저장
document.getElementById("saveBtn").addEventListener('click', async () => {

	if (!document.getElementById("quantity").value) {
		alert('수량을 입력해주세요.');
		return;
	} else if (!document.getElementById("companySearchInput").value) {
		alert("거래처를 입력해주세요.");
		return;
	} else if (!document.getElementById("itemIdx").value) {
		alert("품목을 선택해주세요.");
		return;
	} else if (!document.getElementById("deliveryDate").value) {
		alert("납기 예정일을 입력해주세요");
		return;
	}

	const orderData = {
		orderCode: document.getElementById("orderNo").value,
		orderType: 'P',
		orderDate: document.getElementById("orderDate").value,
		custIdx: document.getElementById("selectedCustIdx").value,
		itemIdx: document.getElementById("itemIdx").value,
		orderQty: Number(document.getElementById("quantity").value),
		unitPrice: Number(document.getElementById("unitPrice").value),
		deliveryDate: document.getElementById("deliveryDate").value,
		userIdx: document.getElementById("userIdx").value,
		remark: document.getElementById("remark").value,
		expectedWhIdx: document.getElementById("selectedwhIdx").value,
		orderStatus: 'P1'
	};

	console.log(orderData);
	try {
		const response = await fetch('/api/orders/save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(orderData),
		});

		if (!response.ok) throw new Error('저장 실패');

		alert('주문이 등록되었습니다.');
		closeModal();
		loadPurchases('deliveryDate', 'asc');
	} catch (err) {
		alert('저장 중 오류가 발생했습니다.');
		console.error(err);
	}
});

function closeModal() {
	document.getElementById('modal').style.display = 'none';
	document.getElementById('modalForm').reset();
}

function outsideClick(e) {
	if (e.target.id === 'modal') {
		closeModal();
	}
}

function submitModal(event) {
	event.preventDefault();
	const siteName = document.querySelector('#modalForm input[name="siteName"]').value;
	closeModal();
}


//테이블 클릭 시 출력되는 modal
async function openPurchasedetail(orderIdx) {
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

// 창고 목록 불러오기
async function loadWarehouse() {
	try {
		const warehouseResponse = await fetch('/api/warehouses');
		if (!warehouseResponse.ok) throw new Error('창고 데이터 요청 실패');

		const warehouses = await warehouseResponse.json();
		const warehouseList = document.getElementById("whList");
		const warehouseArray = warehouses.content || warehouses;

		warehouseList.innerHTML = '';
		warehouseOptions = [];

		warehouseArray.forEach(wh => {
			const whOption = document.createElement('option');
			whOption.value = wh.whNm;
			whOption.dataset.idx = wh.whIdx;
			warehouseList.appendChild(whOption);
			warehouseOptions.push(whOption);
		})
	} catch (err) {
		console.log("창고 로드 오류 : ", err);
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

// 적정 재고 미만 품목
async function loadLowInventoryItems() {
	try {
		const response = await fetch('/api/inventory/qty-low');
		if (!response.ok) {
			throw new Error(`서버 응답 오류: ${response.status}`);
		}

		const items = await response.json();
		const container = document.getElementById('lowStockNotice');

		if (items.length === 0) {
			container.innerHTML = "모든 품목이 적정 재고 이상입니다.";
			return;
		}

		const list = items.map(item => {
			item.origin = 'lowInventory'; // 추가
			return `
		        <div class="low-item" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}'>
		            <strong>${item.itemNm}</strong> (${item.itemCd}) <br> 재고: ${item.totalStockQty}, 적정: ${item.optimalInv}
		        </div>
		    `;
		}).join('');

		container.innerHTML = `<p>적정 재고 미달 품목:</p>${list}`;
	} catch (error) {
		console.error('재고 데이터를 불러오는 데 실패했습니다.', error);
	}
}


document.getElementById('lowStockNotice').addEventListener('click', function(e) {
	const target = e.target.closest('.low-item');
	if (target) {
		const data = JSON.parse(target.dataset.item.replace(/&apos;/g, "'"));
		openModal(data);
	}
});

document.getElementById("editBtn").addEventListener("click", async () => {
	const orderCode = document.getElementById("orderNo").value;

	const orderData = {
		orderIdx: document.getElementById("orderIdx").value,
		orderCode: orderCode,
		orderType: 'P',
		orderDate: document.getElementById("orderDate").value,
		custIdx: document.getElementById("selectedCustIdx").value,
		itemIdx: document.getElementById("itemIdx").value,
		orderQty: Number(document.getElementById("quantity").value),
		unitPrice: Number(document.getElementById("unitPrice").value),
		deliveryDate: document.getElementById("deliveryDate").value,
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
		loadPurchases('deliveryDate', 'asc');
	} catch (err) {
		alert('수정 중 오류 발생');
		console.error(err);
	}
});


async function downloadExcel() {
	const checked = document.querySelectorAll('#purchasesTableBody input.purchase-checkbox:checked');
	const ids = Array.from(checked).map(cb =>
		cb.closest('tr').querySelector('input[type="hidden"]').value);
				
	if (ids.length === 0) {
		alert('엑셀로 내보낼 항목을 선택해주세요.');
		return;
	}
	
	
	const url = `/api/orders/purchase/excel?${ids.map(id => `id=${id}`).join('&')}`;
	const response = await fetch(url);

	if (!response.ok) {
		alert('엑셀 다운로드 실패');
		return;
	}

	const blob = await response.blob();


	const disposition = response.headers.get('Content-Disposition');
	let fileName = 'purchase.xlsx'; // 기본값

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

function printSelectedPurchase() {
	const checked = document.querySelectorAll('#purchasesTableBody input.purchase-checkbox:checked');
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

	printByIds(ids, fetchUrlFn, columns, '발주 인쇄');
}

function formatDate(dateStr) {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}