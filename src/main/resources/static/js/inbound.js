// === 전역 변수 ===
let currentSortBy = 'invTransIdx'; // 기본 정렬 필드를 실제 존재하는 필드로 변경 (예: invTransIdx 또는 transDate)
let currentOrder = 'desc';
let currentPage = 1;
let totalPages = 1;
const pageSize = 10;
let currentInvTransIdxForModal = null; // 현재 모달에서 열린 입고 트랜잭션 ID

// 검색 필터 값 저장
let searchFilters = {
	transDateFrom: '',
	transDateTo: '',
	itemIdx: '',
	custIdx: '',
	userIdx: '',
	whIdx: '',
	transStatus: ''
};

// Datalist 데이터를 저장할 배열
// 검색용 datalist와 모달용 datalist는 분리해서 관리
let searchItemsData = [];
let searchCustsData = [];
let searchWarehousesData = [];
let searchManagersData = [];

let modalItemsData = [];
let modalCustsData = [];
let modalWarehousesData = [];
let modalManagersData = [];


// === UI 컨트롤 요소 가져오기 ===
const receivingTableBody = document.querySelector('#receivingTable tbody');
const selectAllCheckboxes = document.getElementById('selectAllCheckboxes');

const searchButton = document.getElementById('searchButton');
const resetSearchButton = document.getElementById('resetSearchButton');
const newRegistrationButton = document.getElementById('newRegistrationButton');
const deleteButton = document.getElementById('deleteButton');

const modal = document.getElementById('receivingModal');
const modalTitle = document.getElementById('modalTitle');
const modalForm = document.getElementById('modalForm');
const saveButton = modalForm.querySelector('button[name="save"]');
const editButton = modalForm.querySelector('button[name="edit"]');

const totalRecordsSpan = document.getElementById('totalRecords');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const pageNumberInput = document.getElementById('pageNumberInput');
const btnFirstPage = document.getElementById('btn-first-page');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');
const btnLastPage = document.getElementById('btn-last-page');

// === 검색 필드 요소 가져오기 ===
const searchTransDateFromInput = document.getElementById('searchTransDateFrom');
const searchTransDateToInput = document.getElementById('searchTransDateTo');
const searchItemNmInput = document.getElementById('searchItemNm');
const searchHiddenItemIdxInput = document.getElementById('searchHiddenItemIdx');
const searchCustNmInput = document.getElementById('searchCustNm');
const searchHiddenCustIdxInput = document.getElementById('searchHiddenCustIdx');
const searchUserNmInput = document.getElementById('searchUserNm');
const searchHiddenUserIdxInput = document.getElementById('searchHiddenUserIdx');
const searchWhNmInput = document.getElementById('searchWhNm');
const searchHiddenWhIdxInput = document.getElementById('searchHiddenWhIdx');
const searchTransStatusSelect = document.getElementById('searchTransStatus');


// === 모달 폼 필드 요소 가져오기 ===
const modalTransCode = document.getElementById('modalTransCode');
const modalTransDate = document.getElementById('modalTransDate');
const modalTransQty = document.getElementById('modalTransQty');
const modalUnitPrice = document.getElementById('modalUnitPrice');
const modalRemark = document.getElementById('modalRemark');
const modalTransStatusSelect = document.getElementById('modalTransStatus');
const modalInvTransIdx = document.getElementById('modalInvTransIdx');
const modalTransStatusGroup = document.getElementById('modalTransStatusGroup');

// === Datalist input 및 hidden 필드 가져오기 (모달 내 폼) ===
const modalCustNmInput = document.getElementById('modalCustNm');
const modalHiddenCustIdxInput = document.getElementById('modalHiddenCustIdx');
const modalItemNmInput = document.getElementById('modalItemNm');
const modalHiddenItemIdxInput = document.getElementById('modalHiddenItemIdx');
const modalWhNmInput = document.getElementById('modalWhNm');
const modalHiddenWhIdxInput = document.getElementById('modalHiddenWhIdx');
const modalUserNmInput = document.getElementById('modalUserNm');
const modalHiddenUserIdxInput = document.getElementById('modalHiddenUserIdx');


// === 테이블 데이터 로드 함수 ===
async function loadReceivingTable(page = currentPage, sortBy = currentSortBy, sortDirection = currentOrder, filters = searchFilters) {
	currentPage = page;
	currentSortBy = sortBy;
	currentOrder = sortDirection;
	searchFilters = filters; // 현재 검색 필터 상태 저장

	receivingTableBody.innerHTML = ''; // 먼저 기존 내용 비우기
	// displayNoDataMessage(receivingTableBody, 11); // API 호출 전에 메시지 표시 (선택적)

	// 필터 파라미터 구성
	const queryParams = new URLSearchParams();
	queryParams.append('page', currentPage);
	queryParams.append('size', pageSize);
	queryParams.append('sortBy', sortBy);
	queryParams.append('sortDirection', sortDirection);
	// transType은 API 컨트롤러에서 기본값 'R'로 처리되므로, 입고 페이지에서는 명시적으로 보내지 않아도 됨.

	// 검색 필터 값 추가
	if (filters.transDateFrom) queryParams.append('transDateFrom', filters.transDateFrom);
	if (filters.transDateTo) queryParams.append('transDateTo', filters.transDateTo);
	if (filters.itemIdx) queryParams.append('itemIdx', filters.itemIdx);
	if (filters.custIdx) queryParams.append('custIdx', filters.custIdx);
	if (filters.userIdx) queryParams.append('userIdx', filters.userIdx);
	if (filters.whIdx) queryParams.append('whIdx', filters.whIdx);
	if (filters.transStatus) queryParams.append('transStatus', filters.transStatus);

	try {
		// 백엔드 API 엔드포인트 확인 완료 (queryParams에 필터 파라미터 포함됨)
		const response = await fetch(`/api/inv-transactions?${queryParams.toString()}`);
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error fetching receiving list: HTTP status ${response.status}`, errorText);
			throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
		}
		const responseData = await response.json(); // API는 PageDto<VInvTransactionDetailsDto> 형태의 응답을 반환해야 함
		const invTransactions = responseData.content || [];
		totalPages = responseData.totalPages || 1;
		const totalElements = responseData.totalElements || 0;

		totalRecordsSpan.textContent = totalElements;
		currentPageSpan.textContent = currentPage; // API 응답의 currentPage가 1-based라고 가정
		totalPagesSpan.textContent = totalPages;
		pageNumberInput.value = currentPage;

		// 페이지네이션 버튼 상태 업데이트
		btnFirstPage.disabled = currentPage === 1;
		btnPrevPage.disabled = currentPage === 1;
		btnNextPage.disabled = currentPage === totalPages || totalPages === 0;
		btnLastPage.disabled = currentPage === totalPages || totalPages === 0;
		pageNumberInput.max = totalPages > 0 ? totalPages : 1;


		if (invTransactions.length === 0) {
			displayNoDataMessage(receivingTableBody, 11);
			return;
		}

		receivingTableBody.innerHTML = ''; // 데이터가 있을 경우 다시 초기화 (중복 호출 방지)

		invTransactions.forEach(trans => {
			const row = document.createElement('tr');
			row.dataset.invTransIdx = trans.invTransIdx; // 상세보기를 위해 ID 저장

			// 총액 계산 (trans.totalAmount가 API 응답에 포함되어 있다면 그것을 사용해도 됨)
			const totalAmount = (trans.transQty && trans.unitPrice) ?
				(parseFloat(trans.transQty) * parseFloat(trans.unitPrice)) : 0;

			row.innerHTML = `
                <td><input type="checkbox" class="trans-checkbox" data-inv-trans-idx="${trans.invTransIdx}" /></td>
                <td>${trans.invTransCode || ''}</td>
                <td>${formatDate(trans.transDate) || ''}</td>
                <td>${trans.itemNm || ''} ${trans.itemCd ? '(' + trans.itemCd + ')' : ''}</td>
                <td>${trans.custNm || ''}</td>
                <td>${trans.transQty !== null ? Number(trans.transQty).toLocaleString() : '0'}</td>
                <td>${trans.unitPrice !== null ? Number(trans.unitPrice).toLocaleString() : '0'}</td>
                <td>${totalAmount.toLocaleString()}</td>
                <td>${trans.whNm || ''}</td>
                <td>${trans.userNm || '미지정'}</td>
                <td>${getTransStatusText(trans.transStatus) || ''}</td>
            `;
			// 행 전체 클릭 시 모달 열기 (체크박스 클릭 제외)
			row.addEventListener('click', (event) => {
				if (event.target.type === 'checkbox') {
					return;
				}
				openModal('view', trans.invTransIdx);
			});
			receivingTableBody.appendChild(row);
		});

	} catch (error) {
		console.error('Error loading receiving data:', error);
		displayNoDataMessage(receivingTableBody, 11, true); // 에러 발생 시 메시지 표시
	}
}

// === 데이터 없음 메시지 표시 함수 ===
function displayNoDataMessage(tableBodyElement, colspanCount, isError = false) {
	const message = isError ? '데이터를 불러오는 중 오류가 발생했습니다.' : '등록된 데이터가 없습니다.';
	const color = isError ? 'red' : '#666'; // 에러 시 글자색 빨강
	tableBodyElement.innerHTML = `
        <tr>
            <td class="nodata" colspan="${colspanCount}" style="color: ${color}; padding: 20px;">${message}</td>
        </tr>
    `;
}

// === 테이블 정렬 함수 ===
document.querySelectorAll('#receivingTable thead th[data-sort-by]').forEach(th => { // data-sort-by가 있는 th만
	th.addEventListener('click', function() {
		order(this);
	});
});

function order(thElement) {
	const newSortBy = thElement.dataset.sortBy;

	if (!newSortBy) { // 체크박스 th 등 data-sort-by가 없는 경우 정렬하지 않음
		return;
	}

	document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => {
		arrow.textContent = '↓'; // 기본 화살표
		arrow.classList.remove('active');
	});

	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
	} else {
		currentSortBy = newSortBy; // 새로운 정렬 기준
		currentOrder = 'asc';    // 새로운 기준일때는 오름차순부터
	}

	const currentThArrow = thElement.querySelector('.sort-arrow');
	if (currentThArrow) {
		currentThArrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
		currentThArrow.classList.add('active');
	}

	loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 정렬 시 항상 1페이지부터
}

// === 모달 열기 함수 ===
async function openModal(mode, invTransIdx = null) {
	modalForm.reset(); // 폼 초기화
	currentInvTransIdxForModal = invTransIdx; // 전역 변수에 현재 ID 저장

	// Datalist 관련 필드 초기화 (텍스트 입력 필드와 hidden ID 필드 모두)
	[modalCustNmInput, modalHiddenCustIdxInput,
		modalItemNmInput, modalHiddenItemIdxInput,
		modalWhNmInput, modalHiddenWhIdxInput,
		modalUserNmInput, modalHiddenUserIdxInput].forEach(input => input.value = '');


	// 기본 UI 상태 설정
	saveButton.style.display = 'none';
	editButton.style.display = 'none';
	modalTransCode.readOnly = true; // 입고 코드는 항상 읽기 전용 또는 자동생성
	modalTransStatusGroup.style.display = 'none'; // 상태 필드는 기본적으로 숨김

	// Datalist 데이터 미리 로드 (모달용 데이터), 실패해도 모달은 열리도록
	try {
		await loadModalDatalistData();
	} catch (error) {
		console.error("모달용 Datalist 로드 중 에러:", error);
		// 사용자에게 알릴 필요는 없을 수 있음, 또는 간단한 콘솔 로그
	}


	if (mode === 'new') {
		modalTitle.textContent = '신규 입고 등록';
		saveButton.style.display = 'block'; // 등록 버튼 표시
		modalTransCode.value = '자동 생성';
		modalTransDate.value = new Date().toISOString().substring(0, 10); // 오늘 날짜 기본 설정
		modalInvTransIdx.value = ''; // 신규 등록 시 hidden ID 필드 초기화
		// 신규 등록 시 '상태' 필드는 숨겨져 있고, 서버 전송 시 'R1'(입고전)으로 기본값 설정됨
	} else if (mode === 'view' && invTransIdx !== null) {
		modalTitle.textContent = '입고 상세 정보';
		editButton.style.display = 'block'; // 수정 버튼 표시
		modalTransStatusGroup.style.display = 'flex'; // 수정 시에는 상태 필드 표시

		try {
			const response = await fetch(`/api/inv-transactions/${invTransIdx}`); // API 호출
			if (!response.ok) {
				const errorText = await response.text();
				console.error(`Error fetching inv transaction details: HTTP status ${response.status}`, errorText);
				throw new Error(`HTTP error! status: ${response.status}, Message: ${errorText}`);
			}
			const transaction = await response.json(); // VInvTransactionDetailsDto 와 필드 일치해야 함

			modalInvTransIdx.value = transaction.invTransIdx || '';
			modalTransCode.value = transaction.invTransCode || '';
			modalTransDate.value = formatDateToInput(transaction.transDate) || '';
			modalTransQty.value = transaction.transQty || '';
			modalUnitPrice.value = transaction.unitPrice || '';
			modalRemark.value = transaction.remark || transaction.invTransRemark || ''; // API 응답 필드명에 따라 조정
			modalTransStatusSelect.value = transaction.transStatus || '';

			// Datalist 값 설정 (API 응답의 ID 값을 사용)
			setModalDatalistValue('modalCustNm', 'modalHiddenCustIdx', modalCustsData, transaction.custIdx);
			setModalDatalistValue('modalItemNm', 'modalHiddenItemIdx', modalItemsData, transaction.itemIdx);
			setModalDatalistValue('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, transaction.whIdx);
			setModalDatalistValue('modalUserNm', 'modalHiddenUserIdx', modalManagersData, transaction.userIdx);

		} catch (error) {
			console.error('입고 상세 정보를 불러오는 중 오류 발생:', error);
			alert('입고 정보를 불러오는데 실패했습니다. ' + error.message);
			closeModal(); // 에러 시 모달 닫기
			return;
		}
	} else {
		console.error("openModal 함수 호출 오류: 유효하지 않은 모드 또는 invTransIdx가 누락되었습니다.", mode, invTransIdx);
		alert('모달을 여는 중 내부 오류가 발생했습니다.');
		return;
	}
	modal.style.display = 'flex'; // 모든 설정 후 모달 표시
}

// === 모달 닫기 함수 ===
function closeModal() {
	modal.style.display = 'none';
	modalForm.reset(); // 폼 내용 초기화
	currentInvTransIdxForModal = null; // 전역 ID 초기화
	// Datalist 관련 필드도 확실히 초기화
	[modalCustNmInput, modalHiddenCustIdxInput,
		modalItemNmInput, modalHiddenItemIdxInput,
		modalWhNmInput, modalHiddenWhIdxInput,
		modalUserNmInput, modalHiddenUserIdxInput].forEach(input => input.value = '');
}

// === 모달 외부 클릭 시 닫기 ===
function outsideClick(e) {
	if (e.target.id === 'receivingModal') closeModal();
}

// === Datalist 데이터 로드 함수 (검색용) ===
async function loadSearchDatalistData() {
	try {
		// 각 API 호출은 Promise.all로 병렬 처리하여 시간 단축 가능
		const [itemRes, custRes, warehouseRes, managerRes] = await Promise.all([
			fetch('/api/items/active-for-selection'),
			fetch('/api/customers/active-for-selection'),
			fetch('/api/warehouses/active-for-selection'),
			fetch('/api/users/active-for-selection') // 담당자 API (일반적으로 사원/사용자 정보)
		]);

		if (itemRes.ok) searchItemsData = await itemRes.json();
		else console.error('Error fetching search items:', await itemRes.text());

		if (custRes.ok) searchCustsData = await custRes.json();
		else console.error('Error fetching search customers:', await custRes.text());

		if (warehouseRes.ok) searchWarehousesData = await warehouseRes.json();
		else console.error('Error fetching search warehouses:', await warehouseRes.text());

		if (managerRes.ok) searchManagersData = await managerRes.json();
		else console.error('Error fetching search managers:', await managerRes.text());

		populateDatalist('searchItemsDatalist', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
		populateDatalist('searchCustsDatalist', searchCustsData, 'custNm', 'custCd', 'custIdx');
		populateDatalist('searchWarehousesDatalist', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
		populateDatalist('searchManagersDatalist', searchManagersData, 'userNm', 'userId', 'userIdx'); // userId or userCd

	} catch (error) {
		console.error("검색용 Datalist 데이터 로드 실패:", error);
	}
}

// === Datalist 데이터 로드 함수 (모달용) ===
// 검색용과 모달용 데이터가 같다면 하나의 함수로 통합하거나, 캐싱 전략 사용 가능
async function loadModalDatalistData() {
	try {
		const [itemRes, custRes, warehouseRes, managerRes] = await Promise.all([
			fetch('/api/items/active-for-selection'),
			fetch('/api/customers/active-for-selection'), // 거래처 API (매입처 필터링 필요 시 서버에서 처리)
			fetch('/api/warehouses/active-for-selection'),
			fetch('/api/users/active-for-selection')
		]);

		if (itemRes.ok) modalItemsData = await itemRes.json();
		else console.error('Error fetching modal items:', await itemRes.text());

		if (custRes.ok) modalCustsData = await custRes.json(); // 입고이므로 매입처 목록이 와야 함
		else console.error('Error fetching modal customers:', await custRes.text());

		if (warehouseRes.ok) modalWarehousesData = await warehouseRes.json();
		else console.error('Error fetching modal warehouses:', await warehouseRes.text());

		if (managerRes.ok) modalManagersData = await managerRes.json();
		else console.error('Error fetching modal managers:', await managerRes.text());

		populateDatalist('modalItemsDatalist', modalItemsData, 'itemNm', 'itemCd', 'itemIdx');
		populateDatalist('modalCustsDatalist', modalCustsData, 'custNm', 'custCd', 'custIdx');
		populateDatalist('modalWarehousesDatalist', modalWarehousesData, 'whNm', 'whCd', 'whIdx');
		populateDatalist('modalManagersDatalist', modalManagersData, 'userNm', 'userId', 'userIdx');

	} catch (error) {
		console.error("모달용 Datalist 데이터 로드 실패:", error);
		// 여기서 에러 발생 시 사용자에게 알림을 줄 수도 있음
		// throw error; // 에러를 다시 던져서 openModal에서 잡도록 할 수도 있음
	}
}

// === Datalist 옵션 채우는 범용 함수 ===
function populateDatalist(datalistId, dataArray, displayField, codeField, idxField) {
	const datalist = document.getElementById(datalistId);
	if (!datalist) {
		console.warn(`Datalist with ID '${datalistId}' not found.`);
		return;
	}
	datalist.innerHTML = ''; // 기존 옵션 초기화
	if (!Array.isArray(dataArray)) {
		console.warn(`Data for datalist '${datalistId}' is not an array.`);
		return;
	}
	dataArray.forEach(item => {
		const option = document.createElement('option');
		// item[displayField] 등이 undefined일 경우를 대비
		const displayValue = item[displayField] || 'N/A';
		const codeValue = item[codeField] || 'N/A';
		option.value = `${displayValue} (${codeValue})`;
		option.dataset.idx = item[idxField]; // data-* 속성으로 idx 저장
		datalist.appendChild(option);
	});
}

// === Datalist input 값 변경 시 hidden 필드 설정 함수 (공용) ===
function setupDatalistInputListener(inputId, hiddenInputId, datalistArray, displayField, codeField, idxField, required = false) {
	const inputElement = document.getElementById(inputId);
	const hiddenInputElement = document.getElementById(hiddenInputId);

	if (!inputElement || !hiddenInputElement) return;

	const handler = () => {
		const inputValue = inputElement.value;
		const matchedItem = datalistArray.find(data => `${data[displayField] || ''} (${data[codeField] || ''})` === inputValue);

		if (matchedItem) {
			hiddenInputElement.value = matchedItem[idxField];
			inputElement.setCustomValidity(''); // 유효한 값 선택
		} else {
			hiddenInputElement.value = ''; // 일치하는 항목 없으면 hidden 값 비움
			if (required && inputValue.trim() !== '') { // 필수인데 입력값이 있고, 목록에 없는 경우
				// inputElement.setCustomValidity('목록에서 유효한 항목을 선택해주세요.');
			} else {
				inputElement.setCustomValidity(''); // 선택 사항이거나, 입력값이 비었으면 유효성 메시지 없음
			}
		}
	};
	inputElement.addEventListener('input', handler);
	inputElement.addEventListener('change', handler); // change 이벤트도 확실히 처리
}


// === Datalist input에 기존 값 설정 함수 (모달용) ===
function setModalDatalistValue(inputElementId, hiddenInputId, datalistData, selectedIdx) {
	const input = document.getElementById(inputElementId);
	const hiddenInput = document.getElementById(hiddenInputId);

	if (!input || !hiddenInput) return;
	if (selectedIdx === null || selectedIdx === undefined || selectedIdx === '') {
		input.value = '';
		hiddenInput.value = '';
		return;
	}

	// idxField 이름을 동적으로 찾기보다, 각 datalist 타입별로 idx 필드명을 알아야 함
	// 여기서는 일반적인 경우를 가정: itemIdx, custIdx, whIdx, userIdx
	const idxFieldName = (() => {
		if (datalistData && datalistData.length > 0) {
			const firstItem = datalistData[0];
			if (firstItem.hasOwnProperty('itemIdx')) return 'itemIdx';
			if (firstItem.hasOwnProperty('custIdx')) return 'custIdx';
			if (firstItem.hasOwnProperty('whIdx')) return 'whIdx';
			if (firstItem.hasOwnProperty('userIdx')) return 'userIdx';
		}
		// 기본값 또는 inputElementId 기반 추론 (이 부분은 견고하지 않을 수 있음)
		if (inputElementId.toLowerCase().includes('item')) return 'itemIdx';
		if (inputElementId.toLowerCase().includes('cust')) return 'custIdx';
		if (inputElementId.toLowerCase().includes('wh') || inputElementId.toLowerCase().includes('warehouse')) return 'whIdx';
		if (inputElementId.toLowerCase().includes('user') || inputElementId.toLowerCase().includes('manager')) return 'userIdx';
		return 'id'; // Fallback
	})();


	const selectedItem = datalistData.find(item => String(item[idxFieldName]) === String(selectedIdx));

	if (selectedItem) {
		// displayField, codeField도 idxFieldName처럼 동적으로 결정하거나, 각 타입별로 알아야 함
		const displayField = selectedItem.hasOwnProperty('itemNm') ? 'itemNm' : selectedItem.hasOwnProperty('custNm') ? 'custNm' : selectedItem.hasOwnProperty('whNm') ? 'whNm' : selectedItem.hasOwnProperty('userNm') ? 'userNm' : 'name';
		const codeField = selectedItem.hasOwnProperty('itemCd') ? 'itemCd' : selectedItem.hasOwnProperty('custCd') ? 'custCd' : selectedItem.hasOwnProperty('whCd') ? 'whCd' : selectedItem.hasOwnProperty('userId') ? 'userId' : 'code';

		input.value = `${selectedItem[displayField] || ''} (${selectedItem[codeField] || ''})`;
		hiddenInput.value = selectedItem[idxFieldName];
	} else {
		input.value = ''; // 해당 ID의 아이템이 datalistData에 없으면 초기화
		hiddenInput.value = '';
		console.warn(`No item found in ${inputElementId}'s datalist for ID: ${selectedIdx}`);
	}
}

// === 날짜 포맷 함수 (YYYY-MM-DD 입력용) ===
function formatDateToInput(dateString) {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return ''; // 유효하지 않은 날짜면 빈 문자열 반환
		return date.toISOString().substring(0, 10);
	} catch (e) {
		return '';
	}
}

// === 날짜 포맷 함수 (YYYY.MM.DD 테이블 표시용) ===
function formatDate(dateString) {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}.${month}.${day}`;
	} catch (e) {
		return '';
	}
}

// === 거래 상태 코드 변환 함수 ===
function getTransStatusText(statusCode) {
	const statusMap = {
		'R1': '입고전',
		'R2': '가입고',
		'R3': '입고완료',
		'S1': '출고전',
		'S2': '출고완료'
	};
	return statusMap[statusCode] || statusCode || ''; // 코드가 없거나 맵에 없으면 원래 코드 또는 빈 문자열
}

// === 이벤트 리스너 등록 ===
document.addEventListener('DOMContentLoaded', () => {
	loadSearchDatalistData(); // 페이지 로드 시 검색 필드용 Datalist 데이터 로드
	loadReceivingTable();     // 페이지 로드 시 입고 목록 로드 (기본 정렬 및 1페이지)

	// 검색 버튼 클릭 이벤트
	searchButton.addEventListener('click', (event) => {
		event.preventDefault(); // form의 기본 제출 방지

		searchFilters = {
			transDateFrom: searchTransDateFromInput.value,
			transDateTo: searchTransDateToInput.value,
			itemIdx: searchHiddenItemIdxInput.value,
			custIdx: searchHiddenCustIdxInput.value,
			userIdx: searchHiddenUserIdxInput.value,
			whIdx: searchHiddenWhIdxInput.value,
			transStatus: searchTransStatusSelect.value
		};
		loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 검색 시 항상 1페이지, 현재 정렬 유지
	});

	// 검색 폼 내 입력 필드에서 Enter 키 입력 시 검색 실행
	document.querySelectorAll('#receivingForm input[type="text"], #receivingForm input[type="date"], #receivingForm select').forEach(input => {
		input.addEventListener('keypress', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				searchButton.click(); // 검색 버튼 클릭 효과
			}
		});
		// select 요소는 change 이벤트로 바로 검색
		if (input.tagName === 'SELECT') {
			input.addEventListener('change', () => searchButton.click());
		}
	});


	// 초기화 버튼 클릭 이벤트
	resetSearchButton.addEventListener('click', () => {
		document.getElementById('receivingForm').reset(); // form 태그 자체를 reset
		// hidden input 값들도 초기화
		searchHiddenItemIdxInput.value = '';
		searchHiddenCustIdxInput.value = '';
		searchHiddenUserIdxInput.value = '';
		searchHiddenWhIdxInput.value = '';

		searchFilters = { // 전역 필터 객체도 초기화
			transDateFrom: '', transDateTo: '', itemIdx: '', custIdx: '',
			userIdx: '', whIdx: '', transStatus: ''
		};
		// 기본 정렬값으로 1페이지 로드
		currentSortBy = 'invTransIdx'; // 또는 transDate 등 초기 정렬 기준
		currentOrder = 'desc';
		// 정렬 화살표 초기화 (선택적)
		document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => {
			arrow.textContent = '↓';
			arrow.classList.remove('active');
			// 기본 정렬 필드에 active 표시 (선택적)
			if (arrow.closest('th').dataset.sortBy === currentSortBy) {
				arrow.classList.add('active');
				arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
			}
		});

		loadReceivingTable(1, currentSortBy, currentOrder, searchFilters);
	});

	// 신규등록 버튼 클릭 이벤트
	newRegistrationButton.addEventListener('click', () => {
		openModal('new');
	});

	// 헤더 체크박스 전체 선택/해제
	selectAllCheckboxes.addEventListener('change', function() {
		const isChecked = this.checked;
		document.querySelectorAll('.trans-checkbox').forEach(checkbox => {
			checkbox.checked = isChecked;
		});
	});

	// 개별 체크박스 상태 변경 시 전체 선택 체크박스 업데이트
	receivingTableBody.addEventListener('change', function(event) {
		if (event.target.classList.contains('trans-checkbox')) {
			const allCheckboxes = document.querySelectorAll('.trans-checkbox');
			const checkedCheckboxes = document.querySelectorAll('.trans-checkbox:checked');
			selectAllCheckboxes.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
		}
	});

	// Datalist input 변경 이벤트 리스너 설정 (검색 필드용)
	setupDatalistInputListener('searchItemNm', 'searchHiddenItemIdx', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
	setupDatalistInputListener('searchCustNm', 'searchHiddenCustIdx', searchCustsData, 'custNm', 'custCd', 'custIdx');
	setupDatalistInputListener('searchWhNm', 'searchHiddenWhIdx', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
	setupDatalistInputListener('searchUserNm', 'searchHiddenUserIdx', searchManagersData, 'userNm', 'userId', 'userIdx');

	// Datalist input 변경 이벤트 리스너 설정 (모달 필드용)
	setupDatalistInputListener('modalItemNm', 'modalHiddenItemIdx', modalItemsData, 'itemNm', 'itemCd', 'itemIdx', true); // 품목은 필수 가정
	setupDatalistInputListener('modalCustNm', 'modalHiddenCustIdx', modalCustsData, 'custNm', 'custCd', 'custIdx', true); // 거래처는 필수 가정
	setupDatalistInputListener('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, 'whNm', 'whCd', 'whIdx', true);    // 창고는 필수 가정
	setupDatalistInputListener('modalUserNm', 'modalHiddenUserIdx', modalManagersData, 'userNm', 'userId', 'userIdx');  // 담당자는 선택


	// 폼 제출 처리 (등록/수정)
	modalForm.addEventListener('submit', async (event) => {
		event.preventDefault(); // 기본 폼 제출 방지

		// Datalist의 hidden 필드 값 유효성 검사 (필수 항목)
		if (!modalHiddenItemIdxInput.value) { // 품목 ID 값 확인
			alert("유효한 품목을 선택해주세요.");
			modalItemNmInput.focus();
			return;
		}
		if (!modalHiddenCustIdxInput.value) { // 거래처 ID 값 확인
			alert("유효한 거래처를 선택해주세요.");
			modalCustNmInput.focus();
			return;
		}
		if (!modalHiddenWhIdxInput.value) { // 창고 ID 값 확인
			alert("유효한 입고 창고를 선택해주세요.");
			modalWhNmInput.focus();
			return;
		}
		// 담당자(modalHiddenUserIdxInput)는 선택 사항이므로 필수 체크에서 제외

		const formData = new FormData(event.target); // 현재 폼 요소의 모든 입력 값을 가져옴
		const isEditMode = formData.get('invTransIdx') && formData.get('invTransIdx') !== '';

		const data = {
			// invTransIdx는 수정 시에만 값이 있고, 신규 시에는 null 또는 서버에서 생성
			invTransIdx: formData.get('invTransIdx') || null,
			// invTransCode는 신규 시 "자동 생성" 문자열이거나 비어있으면 서버에서 생성
			invTransCode: formData.get('invTransCode') === '자동 생성' ? null : formData.get('invTransCode'),
			transType: 'R', // 입고 페이지이므로 'R'로 고정
			// orderIdx: formData.get('orderIdx') ? parseInt(formData.get('orderIdx')) : null, // 주문 연동 시 필요
			whIdx: parseInt(formData.get('whIdx')), // name="whIdx" (hidden input)
			transDate: formData.get('transDate'),   // name="transDate"
			transQty: parseInt(formData.get('transQty')), // name="transQty"
			unitPrice: parseFloat(formData.get('unitPrice')), // name="unitPrice"
			transStatus: formData.get('transStatus') || 'R1', // name="transStatus", 신규 시 기본 'R1' (입고전)
			userIdx: formData.get('userIdx') ? parseInt(formData.get('userIdx')) : null, // name="userIdx" (hidden input)
			itemIdx: parseInt(formData.get('itemIdx')),       // name="itemIdx" (hidden input)
			custIdx: parseInt(formData.get('custIdx')),       // name="custIdx" (hidden input) - 추가된 부분
			remark: formData.get('remark') // name="remark"
		};

		const url = isEditMode ? `/api/inv-transactions/${data.invTransIdx}` : '/api/inv-transactions';
		const method = isEditMode ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method: method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `HTTP error! Status: ${response.status}, Message: ${errorText}`;
				try { // 서버에서 JSON 형태의 에러 메시지를 보냈을 경우 파싱 시도
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage; // 서버 제공 메시지 우선
				} catch (e) { /* JSON 파싱 실패 시 기존 errorMessage 사용 */ }
				throw new Error(errorMessage);
			}

			// (선택) 성공 시 서버 응답 처리 (예: 생성된 ID나 코드 받기)
			// const responseData = await response.json(); // API가 InvTransactionResponseDto 등을 반환하는 경우

			alert(isEditMode ? '입고 정보가 성공적으로 수정되었습니다.' : '새 입고가 성공적으로 등록되었습니다.');
			closeModal();
			// 수정 시에는 현재 페이지, 신규 등록 시에는 1페이지로 이동하여 목록 새로고침
			loadReceivingTable(isEditMode ? currentPage : 1, currentSortBy, currentOrder, searchFilters);
		} catch (error) {
			console.error('Error saving receiving data:', error);
			alert(`입고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
		}
	});

	// 삭제 버튼 클릭 이벤트
	deleteButton.addEventListener('click', async () => {
		const checkedCheckboxes = document.querySelectorAll('.trans-checkbox:checked');
		const invTransIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.invTransIdx);

		if (invTransIdxesToDelete.length === 0) {
			alert('삭제할 입고 항목을 선택해주세요.');
			return;
		}

		if (!confirm(`${invTransIdxesToDelete.length}개의 입고 항목을 정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
			return;
		}

		try {
			const response = await fetch('/api/inv-transactions', { // API는 ID 목록을 받아 처리
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(invTransIdxesToDelete) // ID 목록을 JSON 배열로 전송
			});

			if (!response.ok) { // 204 No Content도 !response.ok는 false (즉, ok)
				// DELETE 성공 시 보통 204 No Content를 반환하므로 response.text()나 .json() 호출 시 에러 발생 가능
				// 에러 응답이 있는 경우 (예: 4xx, 5xx)에만 본문 처리 시도
				if (response.status !== 204) {
					const errorText = await response.text();
					let errorMessage = `HTTP error! Status: ${response.status}, Message: ${errorText}`;
					try {
						const errorJson = JSON.parse(errorText);
						errorMessage = errorJson.message || errorMessage;
					} catch (e) { /* JSON 파싱 실패 */ }
					throw new Error(errorMessage);
				} else if (response.status === 204) {
					// 성공적으로 삭제됨 (204 No Content)
				} else {
					// 기타 성공적이지 않은 상태 (204가 아닌 2xx) - 흔치 않음
					throw new Error(`Unexpected status code: ${response.status}`);
				}
			}

			alert('선택된 입고 항목이 성공적으로 삭제되었습니다.');
			// 현재 페이지의 데이터가 모두 삭제되었을 경우 이전 페이지로 이동하는 로직 추가 가능
			const newTotalElements = parseInt(totalRecordsSpan.textContent) - invTransIdxesToDelete.length;
			if (newTotalElements <= (currentPage - 1) * pageSize && currentPage > 1) {
				currentPage--;
			}
			loadReceivingTable(currentPage, currentSortBy, currentOrder, searchFilters);
			selectAllCheckboxes.checked = false; // 전체 선택 해제
		} catch (error) {
			console.error('Error deleting receiving data:', error);
			alert(`입고 항목 삭제에 실패했습니다: ${error.message}`);
		}
	});

	// 페이지네이션 버튼 이벤트 리스너
	btnFirstPage.addEventListener('click', () => loadReceivingTable(1, currentSortBy, currentOrder, searchFilters));
	btnPrevPage.addEventListener('click', () => {
		if (currentPage > 1) loadReceivingTable(currentPage - 1, currentSortBy, currentOrder, searchFilters);
	});
	btnNextPage.addEventListener('click', () => {
		if (currentPage < totalPages) loadReceivingTable(currentPage + 1, currentSortBy, currentOrder, searchFilters);
	});
	btnLastPage.addEventListener('click', () => loadReceivingTable(totalPages, currentSortBy, currentOrder, searchFilters));

	pageNumberInput.addEventListener('keypress', (event) => {
		if (event.key === 'Enter') {
			let page = parseInt(pageNumberInput.value);
			if (isNaN(page) || page < 1) page = 1;
			if (page > totalPages && totalPages > 0) page = totalPages;
			else if (totalPages === 0) page = 1; // 데이터가 없을 경우
			loadReceivingTable(page, currentSortBy, currentOrder, searchFilters);
		}
	});
	pageNumberInput.addEventListener('blur', () => { // 포커스 아웃 시에도 유효성 검사 및 페이지 이동
		let page = parseInt(pageNumberInput.value);
		if (isNaN(page) || page < 1) page = 1;
		if (page > totalPages && totalPages > 0) page = totalPages;
		else if (totalPages === 0) page = 1;
		pageNumberInput.value = page; // 유효한 값으로 input 업데이트
		// 현재 페이지와 다를 경우에만 로드 (선택적 최적화)
		// if (page !== currentPage) {
		//     loadReceivingTable(page, currentSortBy, currentOrder, searchFilters);
		// }
	});
});