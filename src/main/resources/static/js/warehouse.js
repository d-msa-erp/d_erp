// === 전역 변수 ===
let currentSortBy = 'whIdx';             // 현재 정렬 기준 컬럼
let currentOrder = 'asc';                // 현재 정렬 순서 (asc: 오름차순, desc: 내림차순)
let currentKeyword = '';                 // 현재 검색 키워드
let currentWhIdxForModal = null;         // 현재 모달에서 열린 창고의 ID (신규 등록 시 null)
let managersData = [];                   // 담당자 데이터를 저장할 배열 (datalist용)

// === 테이블 데이터 로드 함수 ===
/**
 * 창고 목록 테이블을 서버에서 데이터를 가져와 갱신합니다.
 * @param {string} sortBy - 정렬 기준이 될 컬럼 이름
 * @param {string} sortDirection - 정렬 방향 ('asc' 또는 'desc')
 * @param {string} keyword - 검색 키워드
 */
async function loadWarehousesTable(sortBy = currentSortBy, sortDirection = currentOrder, keyword = currentKeyword) {
	currentSortBy = sortBy;
	currentOrder = sortDirection;
	currentKeyword = keyword;

	const tableBody = document.getElementById('warehouseTableBody');
	tableBody.innerHTML = ''; // 기존 데이터 초기화

	try {
		const response = await fetch(`/api/warehouses?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${keyword}`);
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error fetching warehouses list: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		const warehouses = await response.json();

		if (warehouses.length === 0) {
			tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center;">등록된 데이터가 없습니다.</td></tr>';
			return;
		}

		warehouses.forEach(warehouse => {
			const row = document.createElement('tr');
			row.dataset.whIdx = warehouse.whIdx; // 데이터 속성으로 whIdx 저장

			row.innerHTML = `
                <td><input type="checkbox" class="warehouse-checkbox" data-wh-idx="${warehouse.whIdx}" /></td>
                <td>${warehouse.whCd || ''}</td>
                <td>${warehouse.whNm || ''}</td>
                <td>${(warehouse.whType1 === 'Y' ? '자재 ' : '') + (warehouse.whType2 === 'Y' ? '제품 ' : '') + (warehouse.whType3 === 'Y' ? '반품 ' : '').trim() || ''}</td>
                <td>${warehouse.useFlag === 'Y' ? '사용' : '미사용'}</td>
                <td>${warehouse.whLocation || ''}</td>
                <td>${warehouse.remark || ''}</td>
                <td>${warehouse.whUserNm || '미지정'}</td> `;

			// 행 전체 클릭 시 모달 열기 (체크박스 클릭 제외)
			row.addEventListener('click', (event) => {
				if (event.target.type === 'checkbox' || event.target.tagName === 'A') {
					return;
				}
				openModal('view', warehouse.whIdx); // 'view' 모드로 변경
			});
			tableBody.appendChild(row);
		});

	} catch (error) {
		console.error('Error loading warehouses:', error);
		tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center; color: red;">데이터 로드 실패</td></tr>';
	}
}

// === 담당자 목록 datalist 채우기 및 초기화 함수 ===
async function loadManagersIntoDatalist(inputElementId, datalistElementId, hiddenUserIdxInputId, selectedUserIdx = null) {
	const datalist = document.getElementById(datalistElementId);
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);

	datalist.innerHTML = '';
	input.value = '';
	hiddenUserIdxInput.value = '';

	try {
		const response = await fetch('/api/warehouses/users/active-for-selection');
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error fetching managers list: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		managersData = await response.json();

		managersData.forEach(user => {
			const option = document.createElement('option');
			option.value = `${user.userNm} (${user.userId})`;
			option.dataset.userIdx = user.userIdx;
			datalist.appendChild(option);
		});

		if (selectedUserIdx !== null) {
			const selectedManager = managersData.find(m => String(m.userIdx) === String(selectedUserIdx));
			if (selectedManager) {
				input.value = `${selectedManager.userNm} (${selectedManager.userId})`;
				hiddenUserIdxInput.value = selectedManager.userIdx;
			}
		}
	} catch (error) {
		console.error("담당자 목록 로드 실패:", error);
	}
}

// === datalist input과 hidden userIdx 동기화 함수 ===
function setHiddenUserIdx(inputElementId, hiddenUserIdxInputId) {
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);
	const inputValue = input.value;
	const matchedManager = managersData.find(user => `${user.userNm} (${user.userId})` === inputValue);

	if (matchedManager) {
		hiddenUserIdxInput.value = matchedManager.userIdx;
		input.setCustomValidity('');
	} else {
		hiddenUserIdxInput.value = '';
	}
}

// === 테이블 정렬 함수 ===
function order(thElement) {
	const newSortBy = thElement.dataset.sortBy;
	if (!newSortBy) return;

	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
	} else {
		currentOrder = 'asc';
		currentSortBy = newSortBy;
	}
	document.querySelectorAll('th a').forEach(a => a.textContent = '↓');
	const currentThAnchor = thElement.querySelector('a');
	if (currentThAnchor) {
		currentThAnchor.textContent = currentOrder === 'asc' ? '↑' : '↓';
	}
	loadWarehousesTable(currentSortBy, currentOrder, currentKeyword);
}

// === 모달 탭 전환 함수 ===
function openTab(tabName) {
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
	document.getElementById(`${tabName}Tab`).classList.add('active');
	document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

	const saveButton = document.querySelector('#modalForm button[name="save"]');
	const editButton = document.querySelector('#modalForm button[name="edit"]');
	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');

	if (tabName === 'info') {
		if (currentWhIdxForModal === null) { // 신규 등록 모드
			saveButton.style.display = 'block';
			editButton.style.display = 'none';
			if (whCdInput) {
				whCdInput.value = '자동 생성';
				whCdInput.readOnly = true;
			}
		} else { // 수정 모드
			saveButton.style.display = 'none';
			editButton.style.display = 'block';
			if (whCdInput) {
				whCdInput.readOnly = true;
			}
		}
	} else { // 재고 현황 탭 등 다른 탭일 경우
		saveButton.style.display = 'none';
		editButton.style.display = 'none';
	}
}

// === 모달 닫기 함수 ===
function closeModal() {
	document.getElementById('modal').style.display = 'none';
	document.getElementById('modalForm').reset();
	currentWhIdxForModal = null; // 모달 닫을 때 현재 창고 ID 초기화

	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');
	if (whCdInput) whCdInput.readOnly = false;

	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
	displayNoStockMessage();
	document.getElementById('selectAllStockCheckboxes').checked = false;
}

// === 모달 외부 클릭 시 닫기 함수 ===
function outsideClick(event) {
	if (event.target.id === 'modal') {
		closeModal();
	}
}

// === 모달 열기 함수 (신규 등록, 상세 조회, 수정) ===
async function openModal(mode, whIdx = null) {
	const modal = document.getElementById('modal');
	const modalTitle = document.getElementById('modalTitle');
	const modalForm = document.getElementById('modalForm');
	const saveButton = modalForm.querySelector('button[name="save"]');
	const editButton = modalForm.querySelector('button[name="edit"]');

	const whCdInput = modalForm.querySelector('input[name="whCd"]');
	const whNmInput = modalForm.querySelector('input[name="whNm"]');
	const remarkInput = modalForm.querySelector('input[name="remark"]');
	const whType1Checkbox = modalForm.querySelector('input[name="whType1"]');
	const whType2Checkbox = modalForm.querySelector('input[name="whType2"]');
	const whType3Checkbox = modalForm.querySelector('input[name="whType3"]');
	const useFlagCheckbox = modalForm.querySelector('input[name="useFlag"]');
	const whLocationInput = modalForm.querySelector('input[name="whLocation"]');
	const whIdxInput = modalForm.querySelector('input[name="whIdx"]'); // HTML에 <input type="hidden" name="whIdx"> 가 있다고 가정

	const whUserNmInput = document.getElementById('modalWhUserNm');
	const hiddenWhUserIdxInput = document.getElementById('hiddenWhUserIdx');
	const tabsContainer = document.querySelector('.modal-tabs');
	const stockTabContent = document.getElementById('stockTab');
	const infoTabContent = document.getElementById('infoTab');

	modalForm.reset();
	currentWhIdxForModal = whIdx; // 신규 시 null, 수정/조회 시 whIdx 값 할당

	// 신규 등록 모드일 경우, HTML의 whIdx input 필드 값을 확실하게 비워줍니다.
	if (mode === 'new' && whIdxInput) {
		whIdxInput.value = '';
        // console.log('신규 모드 진입: HTML input[name="whIdx"] 값 초기화됨:', whIdxInput.value);
	}

	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

	if (mode === 'new') {
		currentWhIdxForModal = null; // 명시적으로 null 설정하여 신규 모드임을 확실히 함
		modalTitle.textContent = '신규 창고 등록';
		tabsContainer.style.display = 'none';
		infoTabContent.classList.add('active');
		const infoTabButton = document.querySelector('.tab-button[data-tab="info"]');
        if(infoTabButton) infoTabButton.classList.add('active');

		saveButton.style.display = 'block';
		editButton.style.display = 'none';
		if (whCdInput) {
			whCdInput.value = '자동 생성';
			whCdInput.readOnly = true;
		}
		if (useFlagCheckbox) useFlagCheckbox.checked = true;
		await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx');
		displayNoStockMessage();

	} else if (mode === 'view' && whIdx !== null) { // whIdx가 null이 아닌 경우 수정/조회로 간주
		modalTitle.textContent = '창고 상세 정보';
		tabsContainer.style.display = 'flex';
		stockTabContent.classList.add('active');
        const stockTabButton = document.querySelector('.tab-button[data-tab="stock"]');
		if(stockTabButton) stockTabButton.classList.add('active');

		saveButton.style.display = 'none';
		editButton.style.display = 'none';
		if (whCdInput) whCdInput.readOnly = true;

		try {
			const warehouseResponse = await fetch(`/api/warehouses/${whIdx}`);
			if (!warehouseResponse.ok) {
                const errorText = await warehouseResponse.text();
				console.error(`Error fetching warehouse details: HTTP status ${warehouseResponse.status}`, errorText);
                throw new Error(`HTTP error! status: ${warehouseResponse.status}, Message: ${errorText}`);
            }
			const warehouse = await warehouseResponse.json();

			if (whIdxInput) whIdxInput.value = warehouse.whIdx || ''; // 수정 모드를 위해 HTML input에 ID 설정
			if (whNmInput) whNmInput.value = warehouse.whNm || '';
			if (whCdInput) whCdInput.value = warehouse.whCd || '';
			if (remarkInput) remarkInput.value = warehouse.remark || '';
			if (whType1Checkbox) whType1Checkbox.checked = (warehouse.whType1 === 'Y');
			if (whType2Checkbox) whType2Checkbox.checked = (warehouse.whType2 === 'Y');
			if (whType3Checkbox) whType3Checkbox.checked = (warehouse.whType3 === 'Y');
			if (useFlagCheckbox) useFlagCheckbox.checked = (warehouse.useFlag === 'Y');
			if (whLocationInput) whLocationInput.value = warehouse.whLocation || '';
			await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx', warehouse.whUserIdx);
			await loadWarehouseStockDetails(whIdx);
		} catch (error) {
			console.error('창고 상세 정보를 불러오는 중 오류 발생:', error);
			alert('창고 정보를 불러오는데 실패했습니다.');
			closeModal();
			return;
		}
	} else {
        console.error("openModal 함수 호출 오류: 유효하지 않은 mode 또는 whIdx.", { mode, whIdx });
		alert('모달을 여는 중 오류가 발생했습니다.');
		return;
	}
	modal.style.display = 'flex';
}

// === 검색 폼 제출 처리 함수 ===
function handleSearchSubmit(event) {
	event.preventDefault();
	const keyword = document.getElementById('searchInput').value;
	loadWarehousesTable(currentSortBy, currentOrder, keyword);
}

// === 창고 재고 데이터 로드 및 렌더링 함수 ===
async function loadWarehouseStockDetails(whIdx) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');
	warehouseStockTableBody.innerHTML = '';

	try {
		const response = await fetch(`/api/warehouses/${whIdx}/inventory-details`);
		if (!response.ok) {
			if (response.status === 204) { // 데이터 없음
				displayNoStockMessage(); return;
			}
            const errorText = await response.text();
			console.error(`Error fetching warehouse stock details: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		const stockDetails = await response.json();
		if (stockDetails && stockDetails.length > 0) {
			stockDetails.forEach(stock => {
				const row = document.createElement('tr');
				row.dataset.invIdx = stock.invIdx;
				row.dataset.itemIdx = stock.itemIdx;
				row.innerHTML = `
                    <td><input type="checkbox" class="stock-checkbox" data-inv-idx="${stock.invIdx}" data-item-idx="${stock.itemIdx}" /></td>
                    <td>${stock.itemNm || 'N/A'}</td> <td>${stock.itemCd || 'N/A'}</td>
                    <td>${stock.itemSpec || 'N/A'}</td> <td>${stock.stockQty !== null ? stock.stockQty : '0'}</td>
                    <td>${stock.itemUnitNm || 'N/A'}</td> <td>${stock.itemCustNm || 'N/A'}</td>
                    <td>${stock.itemRemark || 'N/A'}</td>`;
				warehouseStockTableBody.appendChild(row);
			});
			selectAllStockCheckboxes.disabled = false;
			moveStockButton.disabled = false;
			deleteStockButton.disabled = false;
		} else {
			displayNoStockMessage();
		}
	} catch (error) {
		console.error('창고 재고 정보를 불러오는 중 오류 발생:', error);
		displayNoStockMessage(true);
	}
}

// === 재고 없음 메시지 표시 및 버튼 비활성화 함수 ===
function displayNoStockMessage(isError = false) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');
	const message = isError ? '재고 데이터 로드 실패' : '재고 데이터 없음';
	const color = isError ? 'red' : 'inherit';
	warehouseStockTableBody.innerHTML = `<tr style="display: contents;">
	<td colspan="8" style="grid-column: 1 / -1; text-align: center; color: ${color}; display: block; padding: 20px 0;">
	${message}</td> </tr>`;
	selectAllStockCheckboxes.disabled = true;
	selectAllStockCheckboxes.checked = false;
	moveStockButton.disabled = true;
	deleteStockButton.disabled = true;
}

// === 이벤트 리스너 등록 ===
document.addEventListener('DOMContentLoaded', () => {
	loadWarehousesTable();

	document.querySelectorAll('.tab-button').forEach(button => {
		button.addEventListener('click', (event) => openTab(event.target.dataset.tab));
	});

	document.getElementById('newRegistrationButton').addEventListener('click', () => openModal('new'));

	const modalWhUserNmInput = document.getElementById('modalWhUserNm');
	modalWhUserNmInput.addEventListener('input', () => setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx'));
	modalWhUserNmInput.addEventListener('change', () => setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx'));

	document.getElementById('modalForm').addEventListener('submit', async (event) => {
		event.preventDefault();

		const whUserNmInputValue = document.getElementById('modalWhUserNm').value;
		const hiddenWhUserIdxValue = document.getElementById('hiddenWhUserIdx').value;

		if (whUserNmInputValue.trim() !== '' && !hiddenWhUserIdxValue) {
			alert("담당자를 목록에서 선택하거나, 입력값을 비워주세요.");
			document.getElementById('modalWhUserNm').focus();
			return;
		}
        if (whUserNmInputValue.trim() === '' && hiddenWhUserIdxValue) { // 이름은 지웠는데 ID는 남아있는 경우
             document.getElementById('hiddenWhUserIdx').value = ''; // ID도 비워줌
        }

		const formData = new FormData(event.target);
		const data = {};
		formData.forEach((value, key) => {
			if (key === 'whType1' || key === 'whType2' || key === 'whType3' || key === 'useFlag') {
				data[key] = event.target.elements[key].checked ? 'Y' : 'N';
			} else if (key !== 'whIdx') { // whIdx는 currentWhIdxForModal을 통해 관리되므로 FormData에서 직접 가져오지 않음
				data[key] = value;
			}
		});
		data.whUserIdx = document.getElementById('hiddenWhUserIdx').value || null;

		const isEditMode = currentWhIdxForModal !== null;

		if (isEditMode) {
			data.whIdx = currentWhIdxForModal; // 수정 모드일 때만 whIdx를 data 객체에 포함
		}
        // 신규 등록 시에는 data 객체에 whIdx가 명시적으로 설정되지 않음 (서버에서 자동 생성되거나 null로 처리)

		const url = isEditMode ? `/api/warehouses/${currentWhIdxForModal}` : '/api/warehouses';
		const method = isEditMode ? 'PUT' : 'POST';

        // === 디버깅을 위한 로그 추가 ===
        console.log('제출 전송 데이터:', {
            isEditMode: isEditMode,
            currentWhIdxForModal: currentWhIdxForModal, // 신규 등록 시 이 값이 null 이어야 합니다.
            url: url,
            method: method,
            payload: data // 전송될 데이터
        });
        // ===========================

		try {
			const response = await fetch(url, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `HTTP error! Status: ${response.status}, Message: ${errorText}`;
				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage;
				} catch (e) { /* JSON 파싱 실패 시 기존 메시지 사용 */ }
				throw new Error(errorMessage);
			}

			alert(isEditMode ? '창고 정보가 성공적으로 수정되었습니다.' : '신규 창고가 성공적으로 등록되었습니다.');
			closeModal();
			loadWarehousesTable();
		} catch (error) {
			console.error('Error saving warehouse:', error);
			alert(`창고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
		}
	});

	document.getElementById('deleteButton').addEventListener('click', async () => {
		const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input[type="checkbox"]:checked');
		const whIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);
		if (whIdxesToDelete.length === 0) {
			alert('삭제할 창고를 선택해주세요.'); return;
		}
		if (!confirm(`${whIdxesToDelete.length}개의 창고를 정말로 삭제하시겠습니까?`)) return;

		try {
			const response = await fetch('/api/warehouses', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(whIdxesToDelete)
			});
			if (!response.ok) {
				const errorText = await response.text();
                let errorMessage = `HTTP error! Status: ${response.status}, Message: ${errorText}`;
				try {
					const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
				} catch (e) { /* JSON 파싱 실패 시 기존 메시지 사용 */ }
				throw new Error(errorMessage);
			}
			alert('선택된 창고가 성공적으로 삭제되었습니다.');
			loadWarehousesTable();
		} catch (error) {
			console.error('Error deleting warehouses:', error);
			alert(`창고 삭제에 실패했습니다: ${error.message}. (재고를 모두 옮긴 후 다시 시도해주세요.)`);
		}
	});

	document.getElementById('selectAllCheckboxes').addEventListener('change', function() {
		document.querySelectorAll('.warehouse-checkbox').forEach(checkbox => checkbox.checked = this.checked);
	});

	const stockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStock = document.getElementById('selectAllStockCheckboxes');

	selectAllStock.addEventListener('change', function() {
		stockTableBody.querySelectorAll('.stock-checkbox').forEach(checkbox => checkbox.checked = this.checked);
	});

	stockTableBody.addEventListener('change', function(event) {
		if (event.target.classList.contains('stock-checkbox')) {
			const allCB = stockTableBody.querySelectorAll('.stock-checkbox');
			const checkedCB = stockTableBody.querySelectorAll('.stock-checkbox:checked');
			selectAllStock.checked = allCB.length > 0 && allCB.length === checkedCB.length;
		}
	});

	document.getElementById('moveStockButton').addEventListener('click', function() {
		const selectedStock = Array.from(stockTableBody.querySelectorAll('.stock-checkbox:checked'))
			.map(cb => ({ invIdx: cb.dataset.invIdx, itemIdx: cb.dataset.itemIdx }));
		if (selectedStock.length > 0) {
			alert('선택된 재고 이동 기능은 구현 예정입니다: ' + JSON.stringify(selectedStock));
		} else {
			alert('이동할 재고를 선택해주세요.');
		}
	});

	document.getElementById('deleteStockButton').addEventListener('click', function() {
		const selectedInvIdxes = Array.from(stockTableBody.querySelectorAll('.stock-checkbox:checked'))
			.map(cb => cb.dataset.invIdx);
		if (selectedInvIdxes.length > 0) {
			if (confirm('선택된 재고를 정말 삭제하시겠습니까? (이 기능은 구현 예정입니다)')) {
				alert('선택된 재고 삭제 기능은 구현 예정입니다: ' + JSON.stringify(selectedInvIdxes));
			}
		} else {
			alert('삭제할 재고를 선택해주세요.');
		}
	});
	displayNoStockMessage();
});