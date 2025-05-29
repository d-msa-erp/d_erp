// === 전역 변수 ===
let currentSortBy = 'whIdx';             // 현재 정렬 기준 컬럼 (예: 'whIdx', 'whCd', 'whNm')
let currentOrder = 'asc';                // 현재 정렬 순서 ('asc': 오름차순, 'desc': 내림차순)
let currentKeyword = '';                 // 현재 검색 키워드
let currentWhIdxForModal = null;         // 모달(팝업)에 현재 표시된 창고의 ID (신규 등록 시 null)
let managersData = [];                   // 담당자 데이터를 저장할 배열 (datalist 및 유효성 검사용)

// === 테이블 데이터 로드 함수 ===
/**
 * 서버에서 창고 목록 데이터를 가져와 HTML 테이블을 갱신합니다.
 * @param {string} sortBy - 정렬 기준이 될 컬럼 이름 (기본값: currentSortBy)
 * @param {string} sortDirection - 정렬 방향 ('asc' 또는 'desc', 기본값: currentOrder)
 * @param {string} keyword - 검색 키워드 (기본값: currentKeyword)
 */
async function loadWarehousesTable(sortBy = currentSortBy, sortDirection = currentOrder, keyword = currentKeyword) {
	currentSortBy = sortBy;
	currentOrder = sortDirection;
	currentKeyword = keyword;

	const tableBody = document.getElementById('warehouseTableBody');
	tableBody.innerHTML = ''; // 기존 테이블 데이터 초기화

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
			row.dataset.whIdx = warehouse.whIdx; // 행에 창고 ID 저장

			row.innerHTML = `
                <td><input type="checkbox" class="warehouse-checkbox" data-wh-idx="${warehouse.whIdx}" /></td>
                <td>${warehouse.whCd || ''}</td>
                <td>${warehouse.whNm || ''}</td>
                <td>${(warehouse.whType1 === 'Y' ? '자재 ' : '') + (warehouse.whType2 === 'Y' ? '제품 ' : '') + (warehouse.whType3 === 'Y' ? '반품 ' : '').trim() || ''}</td>
                <td>${warehouse.useFlag === 'Y' ? '사용' : '미사용'}</td>
                <td>${warehouse.whLocation || ''}</td>
                <td>${warehouse.remark || ''}</td>
                <td>${warehouse.whUserNm || '미지정'}</td> `;

			// 체크박스/링크 외 행 클릭 시 모달 열기
			row.addEventListener('click', (event) => {
				if (event.target.type === 'checkbox' || event.target.tagName === 'A') {
					return;
				}
				openModal('view', warehouse.whIdx); // 'view' 모드로 모달 열기
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
 * 담당자 선택을 위한 datalist를 서버 데이터로 채우고 입력 필드를 초기화합니다.
 * @param {string} inputElementId - 담당자 이름 입력 필드 ID
 * @param {string} datalistElementId - datalist 요소 ID
 * @param {string} hiddenUserIdxInputId - 숨겨진 userIdx 입력 필드 ID
 * @param {string|number|null} selectedUserIdx - 미리 선택할 담당자의 userIdx (선택 사항)
 */
async function loadManagersIntoDatalist(inputElementId, datalistElementId, hiddenUserIdxInputId, selectedUserIdx = null) {
	const datalist = document.getElementById(datalistElementId);
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);

	datalist.innerHTML = ''; // 기존 옵션 초기화
	input.value = '';        // 입력 필드 초기화
	hiddenUserIdxInput.value = ''; // 숨겨진 필드 초기화

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
			option.value = `${user.userNm} (${user.userId})`; // 사용자에게 보이는 값 (이름 (ID))
			option.dataset.userIdx = user.userIdx; // 실제 userIdx를 dataset에 저장
			datalist.appendChild(option);
		});

		// 특정 담당자를 미리 선택하는 경우
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
/**
 * datalist 입력 필드 값과 숨겨진 userIdx 필드를 동기화합니다.
 * 사용자가 datalist에서 선택하거나 직접 입력했을 때 호출됩니다.
 * @param {string} inputElementId - 담당자 이름 입력 필드 ID
 * @param {string} hiddenUserIdxInputId - 숨겨진 userIdx 입력 필드 ID
 */
function setHiddenUserIdx(inputElementId, hiddenUserIdxInputId) {
	const input = document.getElementById(inputElementId);
	const hiddenUserIdxInput = document.getElementById(hiddenUserIdxInputId);
	const inputValue = input.value;

	// 입력된 값과 일치하는 담당자를 managersData에서 찾습니다.
	const matchedManager = managersData.find(user => `${user.userNm} (${user.userId})` === inputValue);

	if (matchedManager) {
		hiddenUserIdxInput.value = matchedManager.userIdx; // 일치하면 userIdx 설정
		input.setCustomValidity(''); // 유효성 메시지 초기화
	} else {
		hiddenUserIdxInput.value = ''; // 일치하지 않으면 userIdx 초기화
	}
}

// === 테이블 정렬 함수 ===
/**
 * 테이블 헤더 클릭 시 창고 목록을 정렬합니다.
 * @param {HTMLElement} thElement - 클릭된 <th> 요소
 */
function order(thElement) {
	const newSortBy = thElement.dataset.sortBy; // 정렬 기준 컬럼명
	if (!newSortBy) return;

	// 현재 정렬 기준과 같으면 순서만 변경, 다르면 새로운 기준으로 설정하고 오름차순으로 초기화
	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
	} else {
		currentOrder = 'asc';
		currentSortBy = newSortBy;
	}

	// 모든 정렬 화살표 초기화 후 현재 정렬 컬럼에만 화살표 표시
	document.querySelectorAll('th a').forEach(a => a.textContent = '↓');
	const currentThAnchor = thElement.querySelector('a');
	if (currentThAnchor) {
		currentThAnchor.textContent = currentOrder === 'asc' ? '↑' : '↓';
	}
	loadWarehousesTable(currentSortBy, currentOrder, currentKeyword); // 정렬된 데이터 다시 로드
}

// === 모달 탭 전환 함수 ===
/**
 * 모달 내에서 탭을 전환합니다 ('info' 또는 'stock').
 * @param {string} tabName - 활성화할 탭의 이름 ('info', 'stock')
 */
function openTab(tabName) {
	// 모든 탭 콘텐츠와 버튼의 활성화 상태 제거
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

	// 선택된 탭과 버튼 활성화
	document.getElementById(`${tabName}Tab`).classList.add('active');
	document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');

	const saveButton = document.querySelector('#modalForm button[name="save"]');
	const editButton = document.querySelector('#modalForm button[name="edit"]');
	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');

	if (tabName === 'info') {
		if (currentWhIdxForModal === null) { // 신규 등록 모드인 경우
			saveButton.style.display = 'block';
			editButton.style.display = 'none';
			if (whCdInput) {
				whCdInput.value = '자동 생성'; // 창고 코드 자동 생성 표시
				whCdInput.readOnly = true;    // 읽기 전용으로 설정
			}
		} else { // 수정 모드인 경우
			saveButton.style.display = 'none';
			editButton.style.display = 'block';
			if (whCdInput) {
				whCdInput.readOnly = true; // 창고 코드 읽기 전용 유지
			}
		}
	} else { // '재고 현황' 등 다른 탭인 경우
		saveButton.style.display = 'none';
		editButton.style.display = 'none';
	}
}

// === 모달 닫기 함수 ===
function closeModal() {
	document.getElementById('modal').style.display = 'none'; // 모달 숨기기
	document.getElementById('modalForm').reset(); // 폼 필드 초기화
	currentWhIdxForModal = null; // 현재 창고 ID 초기화 (신규 모드 전환 준비)

	const whCdInput = document.querySelector('#modalForm input[name="whCd"]');
	if (whCdInput) whCdInput.readOnly = false; // 창고 코드 입력 필드 읽기 전용 해제

	// 탭 활성화 상태 초기화 및 재고 메시지 표시
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
	displayNoStockMessage(); // 재고 테이블 초기 메시지 표시
	document.getElementById('selectAllStockCheckboxes').checked = false; // 재고 전체 선택 체크박스 해제
}

// === 모달 외부 클릭 시 닫기 함수 ===
/**
 * 모달 외부 영역을 클릭했을 때 모달을 닫습니다.
 * @param {MouseEvent} event - 클릭 이벤트 객체
 */
function outsideClick(event) {
	if (event.target.id === 'modal') { // 클릭된 요소가 모달 배경(id='modal')일 경우
		closeModal();
	}
}

// === 모달 열기 함수 (신규 등록, 상세 조회, 수정) ===
/**
 * 창고 등록/조회/수정 모달을 엽니다.
 * @param {'new'|'view'} mode - 모달 모드 ('new' 또는 'view')
 * @param {string|number|null} whIdx - 조회/수정 시 창고 ID (신규 등록 시 null)
 */
async function openModal(mode, whIdx = null) {
	const modal = document.getElementById('modal');
	const modalTitle = document.getElementById('modalTitle');
	const modalForm = document.getElementById('modalForm');
	const saveButton = modalForm.querySelector('button[name="save"]');
	const editButton = modalForm.querySelector('button[name="edit"]');

	// 폼 필드 요소들 참조
	const whCdInput = modalForm.querySelector('input[name="whCd"]');
	const whNmInput = modalForm.querySelector('input[name="whNm"]');
	const remarkInput = modalForm.querySelector('input[name="remark"]');
	const whType1Checkbox = modalForm.querySelector('input[name="whType1"]');
	const whType2Checkbox = modalForm.querySelector('input[name="whType2"]');
	const whType3Checkbox = modalForm.querySelector('input[name="whType3"]');
	const useFlagCheckbox = modalForm.querySelector('input[name="useFlag"]');
	const whLocationInput = modalForm.querySelector('input[name="whLocation"]');
	const whIdxInput = modalForm.querySelector('input[name="whIdx"]'); // 숨겨진 whIdx input

	const whUserNmInput = document.getElementById('modalWhUserNm');
	const hiddenWhUserIdxInput = document.getElementById('hiddenWhUserIdx');
	const tabsContainer = document.querySelector('.modal-tabs');
	const stockTabContent = document.getElementById('stockTab');
	const infoTabContent = document.getElementById('infoTab');

	modalForm.reset(); // 폼 초기화
	currentWhIdxForModal = whIdx; // 현재 모달의 창고 ID 설정 (신규 시 null)

	// 신규 등록 모드일 때 whIdx input 필드 초기화
	if (mode === 'new' && whIdxInput) {
		whIdxInput.value = '';
	}

	// 모든 탭 활성화 상태 초기화
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

	if (mode === 'new') {
		currentWhIdxForModal = null; // 명시적으로 null 설정
		modalTitle.textContent = '신규 창고 등록';
		tabsContainer.style.display = 'none'; // 신규 등록 시 탭 숨기기
		infoTabContent.classList.add('active'); // '정보' 탭 활성화
		const infoTabButton = document.querySelector('.tab-button[data-tab="info"]');
		if (infoTabButton) infoTabButton.classList.add('active');

		saveButton.style.display = 'block'; // '저장' 버튼 표시
		editButton.style.display = 'none';   // '수정' 버튼 숨기기
		if (whCdInput) {
			whCdInput.value = '자동 생성';
			whCdInput.readOnly = true;
		}
		if (useFlagCheckbox) useFlagCheckbox.checked = true; // '사용' 기본 체크
		await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx'); // 담당자 datalist 로드
		displayNoStockMessage(); // 재고 테이블 초기 메시지 표시

	} else if (mode === 'view' && whIdx !== null) { // 조회/수정 모드
		modalTitle.textContent = '창고 상세 정보';
		tabsContainer.style.display = 'flex'; // 탭 표시
		stockTabContent.classList.add('active'); // '재고 현황' 탭 활성화
		const stockTabButton = document.querySelector('.tab-button[data-tab="stock"]');
		if (stockTabButton) stockTabButton.classList.add('active');

		saveButton.style.display = 'none'; // '저장' 버튼 숨기기
		editButton.style.display = 'none';   // '수정' 버튼 숨기기 (모달 닫을 때만 활성화)
		if (whCdInput) whCdInput.readOnly = true; // 창고 코드 읽기 전용

		try {
			// 서버에서 창고 상세 정보 가져오기
			const warehouseResponse = await fetch(`/api/warehouses/${whIdx}`);
			if (!warehouseResponse.ok) {
				const errorText = await warehouseResponse.text();
				console.error(`Error fetching warehouse details: HTTP status ${warehouseResponse.status}`, errorText);
				throw new Error(`HTTP error! status: ${warehouseResponse.status}, Message: ${errorText}`);
			}
			const warehouse = await warehouseResponse.json();

			// 폼 필드에 데이터 채우기
			if (whIdxInput) whIdxInput.value = warehouse.whIdx || '';
			if (whNmInput) whNmInput.value = warehouse.whNm || '';
			if (whCdInput) whCdInput.value = warehouse.whCd || '';
			if (remarkInput) remarkInput.value = warehouse.remark || '';
			if (whType1Checkbox) whType1Checkbox.checked = (warehouse.whType1 === 'Y');
			if (whType2Checkbox) whType2Checkbox.checked = (warehouse.whType2 === 'Y');
			if (whType3Checkbox) whType3Checkbox.checked = (warehouse.whType3 === 'Y');
			if (useFlagCheckbox) useFlagCheckbox.checked = (warehouse.useFlag === 'Y');
			if (whLocationInput) whLocationInput.value = warehouse.whLocation || '';

			// 담당자 datalist 로드 및 선택된 값 설정
			await loadManagersIntoDatalist('modalWhUserNm', 'managersDatalist', 'hiddenWhUserIdx', warehouse.whUserIdx);
			await loadWarehouseStockDetails(whIdx); // 재고 상세 정보 로드
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
	modal.style.display = 'flex'; // 모달 표시
}

// === 검색 폼 제출 처리 함수 ===
/**
 * 검색 폼 제출 시 검색 키워드를 사용하여 창고 목록을 다시 로드합니다.
 * @param {Event} event - 폼 제출 이벤트 객체
 */
function handleSearchSubmit(event) {
	event.preventDefault(); // 폼 기본 제출 동작 방지
	const keyword = document.getElementById('searchInput').value;
	loadWarehousesTable(currentSortBy, currentOrder, keyword); // 검색 키워드로 테이블 갱신
}

// === 창고 재고 데이터 로드 및 렌더링 함수 ===
/**
 * 특정 창고의 재고 상세 정보를 서버에서 가져와 재고 테이블을 갱신합니다.
 * @param {string|number} whIdx - 재고를 조회할 창고의 ID
 */
async function loadWarehouseStockDetails(whIdx) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');
	warehouseStockTableBody.innerHTML = ''; // 기존 재고 데이터 초기화

	try {
		const response = await fetch(`/api/warehouses/${whIdx}/inventory-details`);
		if (!response.ok) {
			if (response.status === 204) { // 데이터 없음 (No Content)
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
				row.dataset.invIdx = stock.invIdx; // 재고 ID 저장
				row.dataset.itemIdx = stock.itemIdx; // 품목 ID 저장
				row.innerHTML = `
                    <td><input type="checkbox" class="stock-checkbox" data-inv-idx="${stock.invIdx}" data-item-idx="${stock.itemIdx}" /></td>
                    <td>${stock.itemNm || 'N/A'}</td> <td>${stock.itemCd || 'N/A'}</td>
                    <td>${stock.itemSpec || 'N/A'}</td> <td>${stock.stockQty !== null ? stock.stockQty : '0'}</td>
                    <td>${stock.itemUnitNm || 'N/A'}</td> <td>${stock.itemCustNm || 'N/A'}</td>
                    <td>${stock.itemRemark || 'N/A'}</td>`;
				warehouseStockTableBody.appendChild(row);
			});
			selectAllStockCheckboxes.disabled = false; // 전체 선택 체크박스 활성화
			moveStockButton.disabled = false;           // 이동 버튼 활성화
			deleteStockButton.disabled = false;         // 삭제 버튼 활성화
		} else {
			displayNoStockMessage(); // 재고 데이터가 없으면 메시지 표시
		}
	} catch (error) {
		console.error('창고 재고 정보를 불러오는 중 오류 발생:', error);
		displayNoStockMessage(true); // 에러 발생 시 메시지 표시
	}
}

// === 재고 없음 메시지 표시 및 버튼 비활성화 함수 ===
/**
 * 재고 데이터가 없거나 로드 실패 시 재고 테이블에 메시지를 표시하고 관련 버튼을 비활성화합니다.
 * @param {boolean} isError - 오류로 인해 호출된 경우 true
 */
function displayNoStockMessage(isError = false) {
	const warehouseStockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStockCheckboxes = document.getElementById('selectAllStockCheckboxes');
	const moveStockButton = document.getElementById('moveStockButton');
	const deleteStockButton = document.getElementById('deleteStockButton');

	const message = isError ? '재고 데이터 로드 실패' : '재고 데이터 없음';
	const color = isError ? 'red' : 'inherit'; // 오류 시 빨간색 글씨

	warehouseStockTableBody.innerHTML = `<tr style="display: contents;">
	<td colspan="8" style="grid-column: 1 / -1; text-align: center; color: ${color}; display: block; padding: 20px 0;">
	${message}</td> </tr>`; // 메시지 표시

	// 관련 UI 요소 비활성화 및 초기화
	selectAllStockCheckboxes.disabled = true;
	selectAllStockCheckboxes.checked = false;
	moveStockButton.disabled = true;
	deleteStockButton.disabled = true;
}

// === 이벤트 리스너 등록 ===
document.addEventListener('DOMContentLoaded', () => {
	loadWarehousesTable(); // 페이지 로드 시 창고 목록 로드

	// 탭 버튼 클릭 이벤트 리스너
	document.querySelectorAll('.tab-button').forEach(button => {
		button.addEventListener('click', (event) => openTab(event.target.dataset.tab));
	});

	// '신규 등록' 버튼 클릭 시 모달 열기
	document.getElementById('newRegistrationButton').addEventListener('click', () => openModal('new'));

	// 담당자 입력 필드 변경 시 hidden userIdx 동기화
	const modalWhUserNmInput = document.getElementById('modalWhUserNm');
	modalWhUserNmInput.addEventListener('input', () => setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx'));
	modalWhUserNmInput.addEventListener('change', () => setHiddenUserIdx('modalWhUserNm', 'hiddenWhUserIdx'));

	// 모달 폼 제출 (창고 등록/수정) 이벤트 리스너
	document.getElementById('modalForm').addEventListener('submit', async (event) => {
		event.preventDefault(); // 폼 기본 제출 방지

		const whUserNmInputValue = document.getElementById('modalWhUserNm').value;
		const hiddenWhUserIdxValue = document.getElementById('hiddenWhUserIdx').value;

		// 담당자 필드 유효성 검사
		if (whUserNmInputValue.trim() !== '' && !hiddenWhUserIdxValue) {
			alert("담당자를 목록에서 선택하거나, 입력값을 비워주세요.");
			document.getElementById('modalWhUserNm').focus();
			return;
		}
		// 이름은 비웠는데 ID는 남아있는 경우 ID도 비움
		if (whUserNmInputValue.trim() === '' && hiddenWhUserIdxValue) {
			document.getElementById('hiddenWhUserIdx').value = '';
		}

		const formData = new FormData(event.target);
		const data = {};
		formData.forEach((value, key) => {
			// 체크박스 값 'Y'/'N' 처리
			if (key === 'whType1' || key === 'whType2' || key === 'whType3' || key === 'useFlag') {
				data[key] = event.target.elements[key].checked ? 'Y' : 'N';
			} else if (key !== 'whIdx') { // whIdx는 currentWhIdxForModal로 관리
				data[key] = value;
			}
		});
		data.whUserIdx = document.getElementById('hiddenWhUserIdx').value || null; // 담당자 ID 설정

		const isEditMode = currentWhIdxForModal !== null; // 수정 모드 여부

		if (isEditMode) {
			data.whIdx = currentWhIdxForModal; // 수정 시에만 whIdx 포함
		}

		// API 엔드포인트 및 HTTP 메서드 결정
		const url = isEditMode ? `/api/warehouses/${currentWhIdxForModal}` : '/api/warehouses';
		const method = isEditMode ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data) // JSON 형태로 데이터 전송
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `HTTP error! Status: ${response.status}, Message: ${errorText}`;
				try { // 서버에서 JSON 형식의 에러 메시지를 보낼 경우 파싱
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage;
				} catch (e) { /* JSON 파싱 실패 시 기존 메시지 사용 */ }
				throw new Error(errorMessage);
			}

			alert(isEditMode ? '창고 정보가 성공적으로 수정되었습니다.' : '신규 창고가 성공적으로 등록되었습니다.');
			closeModal(); // 모달 닫기
			loadWarehousesTable(); // 테이블 갱신
		} catch (error) {
			console.error('Error saving warehouse:', error);
			alert(`창고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
		}
	});

	// '선택 삭제' 버튼 클릭 이벤트 리스너
	document.getElementById('deleteButton').addEventListener('click', async () => {
		const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input[type="checkbox"]:checked');
		const whIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx); // 선택된 창고 ID 목록

		if (whIdxesToDelete.length === 0) {
			alert('삭제할 창고를 선택해주세요.');
			return;
		}
		if (!confirm(`${whIdxesToDelete.length}개의 창고를 정말로 삭제하시겠습니까?`)) {
			return; // 사용자 취소 시 중단
		}

		try {
			const response = await fetch('/api/warehouses', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(whIdxesToDelete) // 삭제할 ID 목록 전송
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
			loadWarehousesTable(); // 테이블 갱신
		} catch (error) {
			console.error('Error deleting warehouses:', error);
			alert(`창고 삭제에 실패했습니다: ${error.message}. (재고를 모두 옮긴 후 다시 시도해주세요.)`);
		}
	});

	// 메인 테이블 '전체 선택' 체크박스 이벤트 리스너
	document.getElementById('selectAllCheckboxes').addEventListener('change', function() {
		document.querySelectorAll('.warehouse-checkbox').forEach(checkbox => checkbox.checked = this.checked);
	});

	// 재고 현황 테이블 '전체 선택' 체크박스 이벤트 리스너
	const stockTableBody = document.getElementById('warehouseStockTableBody');
	const selectAllStock = document.getElementById('selectAllStockCheckboxes');

	selectAllStock.addEventListener('change', function() {
		stockTableBody.querySelectorAll('.stock-checkbox').forEach(checkbox => checkbox.checked = this.checked);
	});

	// 재고 현황 테이블 개별 체크박스 변경 시 '전체 선택' 상태 업데이트
	stockTableBody.addEventListener('change', function(event) {
		if (event.target.classList.contains('stock-checkbox')) {
			const allCB = stockTableBody.querySelectorAll('.stock-checkbox');
			const checkedCB = stockTableBody.querySelectorAll('.stock-checkbox:checked');
			// 모든 체크박스가 체크되었거나, 체크박스 자체가 없으면 전체 선택 체크박스 체크
			selectAllStock.checked = allCB.length > 0 && allCB.length === checkedCB.length;
		}
	});

	// '재고 이동' 버튼 클릭 이벤트 리스너 (기능 구현 예정)
	document.getElementById('moveStockButton').addEventListener('click', function() {
		const selectedStock = Array.from(stockTableBody.querySelectorAll('.stock-checkbox:checked'))
			.map(cb => ({ invIdx: cb.dataset.invIdx, itemIdx: cb.dataset.itemIdx }));
		if (selectedStock.length > 0) {
			alert('선택된 재고 이동 기능은 구현 예정입니다: ' + JSON.stringify(selectedStock));
		} else {
			alert('이동할 재고를 선택해주세요.');
		}
	});

	// '재고 삭제' 버튼 클릭 이벤트 리스너 (기능 구현 예정)
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
	displayNoStockMessage(); // 페이지 로드 시 재고 테이블 초기 메시지 표시 (재고 탭이 기본으로 열릴 경우를 대비)
});