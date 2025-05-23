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
/**
 * 담당자 목록을 서버에서 가져와 <datalist>에 채우고, 관련 input 필드를 초기화/설정합니다.
 * @param {string} inputElementId - 담당자 이름/ID를 입력할 input 요소의 ID
 * @param {string} datalistElementId - 담당자 목록을 표시할 datalist 요소의 ID
 * @param {string} hiddenUserIdxInputId - 선택된 담당자의 userIdx를 저장할 hidden input 요소의 ID
 * @param {number|null} selectedUserIdx - (선택 사항) 수정 모드에서 미리 선택될 담당자의 userIdx
 */
async function loadManagersIntoDatalist(inputElementId, datalistElementId, hiddenUserIdxInputId, selectedUserIdx = null) {
	const datalist = document.getElementById(datalistElementId);
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);

	datalist.innerHTML = ''; // 기존 옵션 초기화
	input.value = ''; // input 값 초기화
	hiddenUserIdxInput.value = ''; // 숨겨진 userIdx 값 초기화

	try {
		const response = await fetch('/api/warehouses/users/active-for-selection');
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error fetching managers list: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		managersData = await response.json(); // 전역 변수에 담당자 데이터 저장

		managersData.forEach(user => {
			const option = document.createElement('option');
			option.value = `${user.userNm} (${user.userId})`; // 사용자에게 보여질 값 (예: 홍길동 (user01))
			option.dataset.userIdx = user.userIdx; // 실제 userIdx를 data 속성에 저장
			datalist.appendChild(option);
		});

		// 수정/조회 모드에서 기존 담당자 자동 선택
		if (selectedUserIdx !== null) {
			const selectedManager = managersData.find(m => String(m.userIdx) === String(selectedUserIdx));
			if (selectedManager) {
				input.value = `${selectedManager.userNm} (${selectedManager.userId})`;
				hiddenUserIdxInput.value = selectedManager.userIdx;
			} else {
				// 선택된 담당자가 목록에 없으면 input과 hidden 필드 초기화
				input.value = '';
				hiddenUserIdxInput.value = '';
			}
		}

	} catch (error) {
		console.error("담당자 목록 로드 실패:", error);
		// alert("담당자 목록을 불러오는 데 실패했습니다."); // 사용자에게 직접적인 알림은 필요에 따라 활성화
	}
}

// === datalist input과 hidden userIdx 동기화 함수 ===
/**
 * datalist 입력 필드의 변경을 감지하고, 선택된/입력된 값에 따라 숨겨진 userIdx 필드를 설정합니다.
 * @param {string} inputElementId - 담당자 이름/ID input 요소의 ID
 * @param {string} hiddenUserIdxInputId - 숨겨진 userIdx input 요소의 ID
 */
function setHiddenUserIdx(inputElementId, hiddenUserIdxInputId) {
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);

	const inputValue = input.value;
	const matchedManager = managersData.find(user => `${user.userNm} (${user.userId})` === inputValue);

	if (matchedManager) {
		hiddenUserIdxInput.value = matchedManager.userIdx;
		input.setCustomValidity(''); // 유효성 검사 메시지 초기화
	} else {
		hiddenUserIdxInput.value = ''; // 일치하는 담당자가 없으면 hidden userIdx 초기화
		// input.setCustomValidity('유효한 담당자를 목록에서 선택하거나 입력해주세요.'); // 필요 시 유효성 검사 메시지 설정
	}
}

// === 테이블 정렬 함수 ===
/**
 * 테이블 헤더 클릭 시 데이터를 정렬하여 다시 로드합니다.
 * @param {HTMLElement} thElement - 클릭된 <th> 요소
 */
function order(thElement) {
	const newSortBy = thElement.dataset.sortBy;

	if (!newSortBy) {
		console.warn("data-sort-by 속성이 정의되지 않았거나 비어있습니다. 정렬 불가.", thElement);
		return;
	}

	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'asc' ? 'desc' : 'asc'; // 현재 컬럼이면 정렬 방향 토글
	} else {
		currentOrder = 'asc'; // 다른 컬럼이면 오름차순으로 초기화
		currentSortBy = newSortBy;
	}

	// 모든 정렬 아이콘 초기화
	document.querySelectorAll('th a').forEach(a => {
		a.textContent = '↓';
	});

	// 현재 정렬 컬럼에만 정렬 방향 아이콘 표시
	const currentThAnchor = thElement.querySelector('a');
	if (currentThAnchor) {
		currentThAnchor.textContent = currentOrder === 'asc' ? '↑' : '↓';
	}

	loadWarehousesTable(currentSortBy, currentOrder, currentKeyword);
}

// === 모달 탭 전환 함수 ===
/**
 * 모달 내에서 탭을 전환합니다.
 * @param {string} tabName - 활성화할 탭의 이름 ('info' 또는 'stock')
 */
function openTab(tabName) {
	document.querySelectorAll('.tab-content').forEach(content => {
		content.classList.remove('active');
	});
	document.querySelectorAll('.tab-button').forEach(button => {
		button.classList.remove('active');
	});

	document.getElementById(`${tabName}Tab`).classList.add('active');
	document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

	const saveButton = document.querySelector('#modalForm button[name="save"]');
	const editButton = document.querySelector('#modalForm button[name="edit"]');
	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');

	if (tabName === 'info') {
		if (currentWhIdxForModal === null) { // 신규 등록 모드
			saveButton.style.display = 'block';
			editButton.style.display = 'none';
			whCdInput.value = '자동 생성';
			whCdInput.readOnly = true;
		} else { // 수정 모드
			saveButton.style.display = 'none';
			editButton.style.display = 'block';
			whCdInput.readOnly = true; // 수정 모드에서는 창고 코드 변경 불가
		}
	} else { // 재고 현황 탭으로 돌아오면 저장/수정 버튼 숨김
		saveButton.style.display = 'none';
		editButton.style.display = 'none';
	}
}

// === 모달 닫기 함수 ===
function closeModal() {
	document.getElementById('modal').style.display = 'none';
	document.getElementById('modalForm').reset();
	currentWhIdxForModal = null; // 모달 닫을 때 현재 창고 ID 초기화

	// 모달 닫을 때 whCd input의 readonly 속성 해제 (신규 등록 시 다시 입력 가능하도록)
	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');
	if (whCdInput) whCdInput.readOnly = false;

	// 모든 탭의 active 클래스 제거 및 재고 탭 관련 UI 초기화
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
	displayNoStockMessage(); // 재고 테이블 초기화 및 메시지 표시
	document.getElementById('selectAllStockCheckboxes').checked = false; // 재고 전체 선택 체크박스 초기화
}

// === 모달 외부 클릭 시 닫기 함수 ===
function outsideClick(event) {
	if (event.target.id === 'modal') {
		closeModal();
	}
}

// === 모달 열기 함수 (신규 등록, 상세 조회, 수정) ===
/**
 * 창고 모달을 열고 모드에 따라 UI 및 데이터를 설정합니다.
 * @param {'new'|'view'} mode - 모달 모드 ('new' 신규 등록, 'view' 상세 조회/수정)
 * @param {number|null} whIdx - (선택 사항) 조회/수정 모드일 경우 창고 ID
 */
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
	const whIdxInput = modalForm.querySelector('input[name="whIdx"]');

	// Datalist 관련 요소
	const whUserNmInput = document.getElementById('modalWhUserNm');
	const hiddenWhUserIdxInput = document.getElementById('hiddenWhUserIdx');

	// 탭 관련 UI 요소
	const tabsContainer = document.querySelector('.modal-tabs');
	const stockTabContent = document.getElementById('stockTab');
	const infoTabContent = document.getElementById('infoTab');

	modalForm.reset();
	currentWhIdxForModal = whIdx; // 현재 모달에서 열린 창고 ID 저장

	// 모달이 열릴 때 모든 탭의 active 클래스 초기화
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

	// --- 모달 모드에 따른 UI 조정 ---
	if (mode === 'new') {
		modalTitle.textContent = '신규 창고 등록';
		tabsContainer.style.display = 'none'; // 신규 등록 시 재고 탭 숨김

		// 신규 등록 시 '정보 수정' 탭만 활성화
		infoTabContent.classList.add('active');
		document.querySelector('.tab-button[data-tab="info"]').classList.add('active');

		saveButton.style.display = 'block';
		editButton.style.display = 'none';

		if (whCdInput) {
			whCdInput.value = '자동 생성';
			whCdInput.readOnly = true;
		}
		if (useFlagCheckbox) useFlagCheckbox.checked = true;

		await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx'); // 담당자 Datalist 로드
		displayNoStockMessage(); // 신규 등록 시 재고 테이블 초기화

	} else if (mode === 'view' && whIdx !== null) { // 상세 조회 및 수정 모드
		modalTitle.textContent = '창고 상세 정보';
		tabsContainer.style.display = 'flex'; // 탭 보이기

		// 상세 조회 시 '재고 현황' 탭을 기본으로 활성화
		stockTabContent.classList.add('active');
		document.querySelector('.tab-button[data-tab="stock"]').classList.add('active');

		saveButton.style.display = 'none'; // 조회 모드에서는 저장/수정 버튼 숨김
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

			// 가져온 데이터로 모달 폼 필드 채우기
			if (whIdxInput) whIdxInput.value = warehouse.whIdx || '';
			if (whNmInput) whNmInput.value = warehouse.whNm || '';
			if (whCdInput) whCdInput.value = warehouse.whCd || '';
			if (remarkInput) remarkInput.value = warehouse.remark || '';
			if (whType1Checkbox) whType1Checkbox.checked = (warehouse.whType1 === 'Y');
			if (whType2Checkbox) whType2Checkbox.checked = (warehouse.whType2 === 'Y');
			if (whType3Checkbox) whType3Checkbox.checked = (warehouse.whType3 === 'Y');
			if (useFlagCheckbox) useFlagCheckbox.checked = (warehouse.useFlag === 'Y');
			if (whLocationInput) whLocationInput.value = warehouse.whLocation || '';

			// 담당자 Datalist 로드 및 기존 담당자 선택
			await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx', warehouse.whUserIdx);

			// 재고 데이터 로드
			await loadWarehouseStockDetails(whIdx);

		} catch (error) {
			console.error('창고 상세 정보를 불러오는 중 오류 발생:', error);
			alert('창고 정보를 불러오는데 실패했습니다.');
			closeModal();
			return;
		}
	} else {
		console.error("openModal 함수 호출 오류: 유효하지 않은 모드 또는 whIdx가 누락되었습니다.", mode, whIdx);
		alert('모달을 여는 중 오류가 발생했습니다.');
		return;
	}
	modal.style.display = 'flex'; // 모달 표시
}

// === 검색 폼 제출 처리 함수 ===
/**
 * 검색 폼 제출 시 테이블을 검색 키워드로 다시 로드합니다.
 * @param {Event} event - 제출 이벤트 객체
 */
function handleSearchSubmit(event) {
	event.preventDefault();
	const keyword = document.getElementById('searchInput').value;
	loadWarehousesTable(currentSortBy, currentOrder, keyword);
}

// === 창고 재고 데이터 로드 및 렌더링 함수 ===
/**
 * 특정 창고의 재고 상세 정보를 서버에서 가져와 재고 테이블을 갱신합니다.
 * @param {number} whIdx - 재고를 조회할 창고의 ID
 */
async function loadWarehouseStockDetails(whIdx) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');

	warehouseStockTableBody.innerHTML = ''; // 기존 내용 삭제

	try {
		const response = await fetch(`/api/warehouses/${whIdx}/inventory-details`);
		if (!response.ok) {
			if (response.status === 204) { // 204 No Content (데이터는 없지만 성공)
				console.warn(`창고 ID ${whIdx}에 대한 재고 정보가 없습니다 (204 No Content).`);
				displayNoStockMessage();
				return;
			}
			const errorText = await response.text();
			console.error(`Error fetching warehouse stock details: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		const stockDetails = await response.json();

		if (stockDetails && stockDetails.length > 0) {
			stockDetails.forEach(stock => {
				const row = document.createElement('tr');
				row.dataset.invIdx = stock.invIdx; // invIdx를 data 속성으로 저장
				row.dataset.itemIdx = stock.itemIdx; // itemIdx를 data 속성으로 저장
				row.innerHTML = `
                    <td><input type="checkbox" class="stock-checkbox" data-inv-idx="${stock.invIdx}" data-item-idx="${stock.itemIdx}" /></td>
                    <td>${stock.itemNm || 'N/A'}</td>
                    <td>${stock.itemCd || 'N/A'}</td>
                    <td>${stock.itemSpec || 'N/A'}</td>
                    <td>${stock.stockQty !== null ? stock.stockQty : '0'}</td>
                    <td>${stock.itemUnitNm || 'N/A'}</td>
                    <td>${stock.itemCustNm || 'N/A'}</td>
                    <td>${stock.itemRemark || 'N/A'}</td> `;
				warehouseStockTableBody.appendChild(row);
			});
			// 재고 데이터가 있으면 '전체 선택' 체크박스 및 버튼 활성화
			selectAllStockCheckboxes.disabled = false;
			moveStockButton.disabled = false;
			deleteStockButton.disabled = false;
		} else {
			displayNoStockMessage(); // 재고가 없는 경우 메시지 표시 및 비활성화
		}

	} catch (error) {
		console.error('창고 재고 정보를 불러오는 중 오류 발생:', error);
		displayNoStockMessage(true); // 에러 발생 시 메시지 표시 및 비활성화
	}
}

// === 재고 없음 메시지 표시 및 버튼 비활성화 함수 ===
/**
 * 재고 테이블에 "데이터 없음" 또는 "로드 실패" 메시지를 표시하고 관련 버튼을 비활성화합니다.
 * @param {boolean} isError - 에러 상태인지 여부 (true이면 에러 메시지 표시)
 */
function displayNoStockMessage(isError = false) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');

	const message = isError ? '재고 데이터 로드 실패' : '재고 데이터 없음';
	const color = isError ? 'red' : 'inherit';
	const colspan = 8; // HTML 테이블 헤더 컬럼 수에 맞게 조정 (<td>의 colspan에 사용)

	warehouseStockTableBody.innerHTML = `
        <tr>
            <td colspan="${colspan}" style="text-align: center; color: ${color};">${message}</td>
        </tr>
    `;
	selectAllStockCheckboxes.disabled = true;
	selectAllStockCheckboxes.checked = false; // 체크 해제
	moveStockButton.disabled = true;
	deleteStockButton.disabled = true;
}


// === 이벤트 리스너 등록 ===
document.addEventListener('DOMContentLoaded', () => {
	loadWarehousesTable(); // 페이지 로드 시 창고 목록 로드

	// 탭 버튼 클릭 이벤트
	document.querySelectorAll('.tab-button').forEach(button => {
		button.addEventListener('click', (event) => {
			openTab(event.target.dataset.tab);
		});
	});

	// 신규 등록 버튼 클릭 이벤트
	document.getElementById('newRegistrationButton').addEventListener('click', () => {
		openModal('new');
	});

	// Datalist input 변경 이벤트 (사용자 입력/선택 시 hidden userIdx 업데이트)
	document.getElementById('modalWhUserNm').addEventListener('input', () => {
		setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx');
	});
	document.getElementById('modalWhUserNm').addEventListener('change', () => { // 목록 선택 시에도 반영
		setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx');
	});

	// 폼 제출 이벤트 (창고 등록/수정)
	document.getElementById('modalForm').addEventListener('submit', async (event) => {
		event.preventDefault();

		const whUserIdx = document.getElementById('hiddenWhUserIdx').value;
		if (!whUserIdx) {
			alert("담당자를 목록에서 선택하거나 정확히 입력해주세요.");
			document.getElementById('modalWhUserNm').focus();
			return;
		}

		const formData = new FormData(event.target);
		const data = {};
		formData.forEach((value, key) => {
			if (key === 'whType1' || key === 'whType2' || key === 'whType3' || key === 'useFlag') {
				data[key] = event.target.elements[key].checked ? 'Y' : 'N';
			} else {
				data[key] = value;
			}
		});
		data.whUserIdx = whUserIdx; // hidden 필드에서 가져온 담당자 userIdx 설정

		const isEditMode = data.whIdx && data.whIdx !== '';
		const url = isEditMode ? `/api/warehouses/${data.whIdx}` : '/api/warehouses';
		const method = isEditMode ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method: method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const errorText = await response.text();
				try {
					const errorJson = JSON.parse(errorText);
					throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
				} catch (e) {
					throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
				}
			}

			alert(isEditMode ? '창고 정보가 성공적으로 수정되었습니다.' : '신규 창고가 성공적으로 등록되었습니다.');
			closeModal();
			loadWarehousesTable();
		} catch (error) {
			console.error('Error saving warehouse:', error);
			alert(`창고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
		}
	});

	// 창고 삭제 버튼 클릭 이벤트
	document.getElementById('deleteButton').addEventListener('click', async () => {
		const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input[type="checkbox"]:checked');
		const whIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);

		if (whIdxesToDelete.length === 0) {
			alert('삭제할 창고를 선택해주세요.');
			return;
		}

		if (!confirm(`${whIdxesToDelete.length}개의 창고를 정말로 삭제하시겠습니까?`)) {
			return;
		}

		try {
			const response = await fetch('/api/warehouses', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(whIdxesToDelete)
			});

			if (!response.ok) {
				const errorText = await response.text();
				try {
					const errorJson = JSON.parse(errorText);
					throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
				} catch (e) {
					throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
				}
			}

			alert('선택된 창고가 성공적으로 삭제되었습니다.');
			loadWarehousesTable();
		} catch (error) {
			console.error('Error deleting warehouses:', error);
			alert(`창고 삭제에 실패했습니다: ${error.message}. (재고를 모두 옮긴 후 다시 시도해주세요.)`);
		}
	});

	// 창고 목록 헤더 체크박스 전체 선택/해제
	document.getElementById('selectAllCheckboxes').addEventListener('change', function() {
		const isChecked = this.checked;
		document.querySelectorAll('.warehouse-checkbox').forEach(checkbox => {
			checkbox.checked = isChecked;
		});
	});

	// 재고 탭 전체 선택/해제 체크박스 기능
	document.getElementById('selectAllStockCheckboxes').addEventListener('change', function() {
		const checkboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox');
		checkboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	// 재고 탭 개별 체크박스 상태 변경 시 전체 선택 체크박스 상태 업데이트
	document.getElementById('warehouseStockTableBody').addEventListener('change', function(event) {
		if (event.target.classList.contains('stock-checkbox')) {
			const allCheckboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox');
			const checkedCheckboxes = document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked');
			document.getElementById('selectAllStockCheckboxes').checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
		}
	});

	// 재고 이동 버튼 클릭 이벤트 (예시)
	document.getElementById('moveStockButton').addEventListener('click', function() {
		const selectedStock = Array.from(document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked'))
			.map(cb => ({
				invIdx: cb.dataset.invIdx,
				itemIdx: cb.dataset.itemIdx
			}));
		if (selectedStock.length > 0) {
			alert('선택된 재고 이동: ' + JSON.stringify(selectedStock));
			// TODO: 여기에 재고 이동 모달을 열거나, 재고 이동 API 호출 로직 추가
			// 이동 후 loadWarehouseStockDetails(currentWhIdxForModal) 다시 호출하여 테이블 갱신 필요
		} else {
			alert('이동할 재고를 선택해주세요.');
		}
	});

	// 재고 삭제 버튼 클릭 이벤트 (예시)
	document.getElementById('deleteStockButton').addEventListener('click', function() {
		const selectedInvIdxes = Array.from(document.querySelectorAll('#warehouseStockTableBody .stock-checkbox:checked'))
			.map(cb => cb.dataset.invIdx);
		if (selectedInvIdxes.length > 0) {
			if (confirm('선택된 재고를 정말 삭제하시겠습니까?')) {
				alert('선택된 재고 삭제: ' + JSON.stringify(selectedInvIdxes));
				// TODO: 여기에 재고 삭제 API 호출 로직 추가 (예: DELETE /api/inventory, Body: invIdxes)
				// 삭제 후 loadWarehouseStockDetails(currentWhIdxForModal) 다시 호출하여 테이블 갱신 필요
			}
		} else {
			alert('삭제할 재고를 선택해주세요.');
		}
	});

	// 초기 로드 시 재고 없음 메시지 및 버튼 비활성화 상태로 설정
	displayNoStockMessage();
});