// === 전역 변수 ===
let currentSortBy = 'invTransIdx'; // 현재 정렬 기준 컬럼
let currentOrder = 'desc'; // 현재 정렬 순서 (asc, desc)
let currentPage = 1; // 현재 페이지 번호
let totalPages = 1; // 전체 페이지 수
const pageSize = 10; // 한 페이지에 보여줄 항목 수
let currentInvTransIdxForModal = null; // 모달에서 사용 중인 현재 출고 거래 ID

// 검색 필터 객체
let searchFilters = {
	transDateFrom: '', // 검색 조건: 출고일 시작
	transDateTo: '',   // 검색 조건: 출고일 종료
	itemIdx: '',       // 검색 조건: 품목 ID
	custIdx: '',       // 검색 조건: 거래처 ID
	userIdx: '',       // 검색 조건: 담당자 ID
	whIdx: '',         // 검색 조건: 창고 ID
	transStatus: ''    // 검색 조건: 출고 상태
};

// 데이터리스트용 데이터 배열 (검색 영역)
let searchItemsData = [];      // 품목 목록
let searchCustsData = [];      // 거래처 목록
let searchWarehousesData = []; // 창고 목록
let searchManagersData = [];   // 담당자 목록

// 데이터리스트용 데이터 배열 (모달 영역)
let modalItemsData = [];      // 품목 목록
let modalCustsData = [];      // 거래처 목록
let modalWarehousesData = []; // 창고 목록
let modalManagersData = [];   // 담당자 목록

// === UI 컨트롤 요소 가져오기 ===
const outboundTableBody = document.querySelector('#outboundTable tbody'); // 테이블 ID outboundTable로 변경
const selectAllCheckboxes = document.getElementById('selectAllCheckboxes'); // 전체 선택 체크박스
const searchButton = document.getElementById('searchButton'); // 검색 버튼
const resetSearchButton = document.getElementById('resetSearchButton'); // 검색 초기화 버튼
const newRegistrationButton = document.getElementById('newRegistrationButton'); // 신규 등록 버튼
const deleteButton = document.getElementById('deleteButton'); // 삭제 버튼
const modal = document.getElementById('outboundModal'); // 모달 ID outboundModal로 변경
const modalTitle = document.getElementById('modalTitle'); // 모달 제목
const modalForm = document.getElementById('modalForm'); // 모달 폼
const saveButton = modalForm.querySelector('button[name="save"]'); // 모달 저장 버튼
const editButton = modalForm.querySelector('button[name="edit"]'); // 모달 수정 버튼
const totalRecordsSpan = document.getElementById('totalRecords'); // 총 레코드 수 표시
const currentPageSpan = document.getElementById('currentPage'); // 현재 페이지 번호 표시
const totalPagesSpan = document.getElementById('totalPages'); // 전체 페이지 수 표시
const pageNumberInput = document.getElementById('pageNumberInput'); // 페이지 번호 직접 입력
const btnFirstPage = document.getElementById('btn-first-page'); // 첫 페이지 버튼
const btnPrevPage = document.getElementById('btn-prev-page'); // 이전 페이지 버튼
const btnNextPage = document.getElementById('btn-next-page'); // 다음 페이지 버튼
const btnLastPage = document.getElementById('btn-last-page'); // 마지막 페이지 버튼

// 검색 필드 입력 요소
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

// 모달 입력 요소
const modalTransCode = document.getElementById('modalTransCode');
const modalTransDate = document.getElementById('modalTransDate');
const modalTransQty = document.getElementById('modalTransQty');
const modalUnitPrice = document.getElementById('modalUnitPrice');
const modalRemark = document.getElementById('modalRemark');
const modalTransStatusSelect = document.getElementById('modalTransStatus');
const modalInvTransIdx = document.getElementById('modalInvTransIdx');
const modalTransStatusGroup = document.getElementById('modalTransStatusGroup'); // 모달 내 상태 선택 그룹

const modalCustNmInput = document.getElementById('modalCustNm');
const modalHiddenCustIdxInput = document.getElementById('modalHiddenCustIdx');
const modalItemNmInput = document.getElementById('modalItemNm');
const modalHiddenItemIdxInput = document.getElementById('modalHiddenItemIdx');
const modalWhNmInput = document.getElementById('modalWhNm');
const modalHiddenWhIdxInput = document.getElementById('modalHiddenWhIdx');
const modalUserNmInput = document.getElementById('modalUserNm');
const modalHiddenUserIdxInput = document.getElementById('modalHiddenUserIdx');

// === 테이블 데이터 로드 함수 ===
async function loadOutboundTable(page = currentPage, sortBy = currentSortBy, sortDirection = currentOrder, filters = searchFilters) {
	currentPage = page;
	currentSortBy = sortBy;
	currentOrder = sortDirection;
	searchFilters = filters;
	outboundTableBody.innerHTML = ''; // 테이블 내용 초기화

	// API 요청을 위한 쿼리 파라미터 구성
	const queryParams = new URLSearchParams({
		page: currentPage,
		size: pageSize,
		sortBy,
		sortDirection,
		transType: 'S', // 출고 조회 시 'S' 타입 고정
		...(filters.transDateFrom && { transDateFrom: filters.transDateFrom }),
		...(filters.transDateTo && { transDateTo: filters.transDateTo }),
		...(filters.itemIdx && { itemIdx: filters.itemIdx }),
		...(filters.custIdx && { custIdx: filters.custIdx }),
		...(filters.userIdx && { userIdx: filters.userIdx }),
		...(filters.whIdx && { whIdx: filters.whIdx }),
		...(filters.transStatus && { transStatus: filters.transStatus }),
	});

	try {
		const response = await fetch(`/api/inv-transactions?${queryParams.toString()}`);
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`출고 목록 조회 오류: HTTP 상태 ${response.status}`, errorText);
			throw new Error(`HTTP 오류! 상태: ${response.status}, 메시지: ${errorText}`);
		}
		const responseData = await response.json();
		const invTransactions = responseData.content || []; // 출고 거래 목록
		totalPages = responseData.totalPages || 1; // 전체 페이지 수 업데이트
		const totalElements = responseData.totalElements || 0; // 전체 항목 수 업데이트

		// 페이지네이션 정보 업데이트
		totalRecordsSpan.textContent = totalElements;
		currentPageSpan.textContent = currentPage;
		totalPagesSpan.textContent = totalPages;
		pageNumberInput.value = currentPage;
		btnFirstPage.disabled = currentPage === 1;
		btnPrevPage.disabled = currentPage === 1;
		btnNextPage.disabled = currentPage === totalPages || totalPages === 0;
		btnLastPage.disabled = currentPage === totalPages || totalPages === 0;
		pageNumberInput.max = totalPages > 0 ? totalPages : 1;

		if (invTransactions.length === 0) {
			displayNoDataMessage(outboundTableBody, 11); // 데이터 없음 메시지 표시
			return;
		}

		// 테이블 행 생성 및 데이터 바인딩
		invTransactions.forEach(trans => {
			const row = document.createElement('tr');
			row.dataset.invTransIdx = trans.invTransIdx; // 행에 ID 저장 (상세보기 시 사용)
			const totalAmount = (trans.transQty && trans.unitPrice) ? (parseFloat(trans.transQty) * parseFloat(trans.unitPrice)) : 0; // 총액 계산

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
			// 행 클릭 시 상세 정보 모달 열기 (체크박스 클릭 제외)
			row.addEventListener('click', (event) => {
				if (event.target.type === 'checkbox') return;
				openModal('view', trans.invTransIdx);
			});
			outboundTableBody.appendChild(row);
		});
	} catch (error) {
		console.error('출고 데이터 로드 중 오류:', error);
		displayNoDataMessage(outboundTableBody, 11, true); // 오류 메시지 표시
	}
}

// 테이블에 "데이터 없음" 또는 "오류 발생" 메시지를 표시하는 함수
function displayNoDataMessage(tableBodyElement, colspanCount, isError = false) {
	const message = isError ? '데이터를 불러오는 중 오류가 발생했습니다.' : '등록된 데이터가 없습니다.';
	tableBodyElement.innerHTML = `<tr><td class="nodata" colspan="${colspanCount}" style="color: ${isError ? 'red' : '#666'}; padding: 20px;">${message}</td></tr>`;
}

// 테이블 헤더 클릭 시 정렬 기능
document.querySelectorAll('#outboundTable thead th[data-sort-by]').forEach(th => { // 테이블 ID outboundTable로 변경
	th.addEventListener('click', function() { order(this); });
});

function order(thElement) {
	const newSortBy = thElement.dataset.sortBy;
	if (!newSortBy) return; // 정렬 기준 컬럼이 없으면 중단

	// 모든 정렬 화살표 초기화
	document.querySelectorAll('#outboundTable thead th .sort-arrow').forEach(arrow => { // 테이블 ID outboundTable로 변경
		arrow.textContent = '↓';
		arrow.classList.remove('active');
	});

	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'asc' ? 'desc' : 'asc'; // 정렬 순서 변경
	} else {
		currentSortBy = newSortBy; // 정렬 기준 변경
		currentOrder = 'asc'; // 기본 오름차순
	}

	const currentThArrow = thElement.querySelector('.sort-arrow');
	if (currentThArrow) {
		currentThArrow.textContent = currentOrder === 'asc' ? '↑' : '↓'; // 현재 정렬 화살표 표시
		currentThArrow.classList.add('active');
	}
	loadOutboundTable(1, currentSortBy, currentOrder, searchFilters); // 변경된 정렬 기준으로 테이블 다시 로드
}

// 모달 열기 함수 (신규 등록/상세 보기)
async function openModal(mode, invTransIdx = null) {
	modalForm.reset(); // 폼 초기화
	currentInvTransIdxForModal = invTransIdx; // 현재 모달에서 사용하는 ID 업데이트

	// 모든 입력 필드 초기화 및 유효성 메시지 제거
	[modalCustNmInput, modalHiddenCustIdxInput, modalItemNmInput, modalHiddenItemIdxInput,
		modalWhNmInput, modalHiddenWhIdxInput, modalUserNmInput, modalHiddenUserIdxInput]
		.forEach(input => {
			input.value = '';
			if (input.type !== 'hidden') input.setCustomValidity('');
		});

	saveButton.style.display = 'none'; // 저장 버튼 숨김
	editButton.style.display = 'none'; // 수정 버튼 숨김
	modalTransCode.readOnly = true; // 출고 코드 필드 읽기 전용
	modalTransStatusGroup.style.display = 'none'; // 상태 선택 그룹 숨김

	try {
		// 모달용 데이터리스트 데이터 로드
		await loadModalDatalistData();
	} catch (error) {
		console.error("모달용 Datalist 로드 중 에러:", error);
	}

	if (mode === 'new') { // 신규 등록 모드
		modalTitle.textContent = '신규 출고 등록'; // 타이틀 변경
		saveButton.style.display = 'block'; // 저장 버튼 표시
		modalTransCode.value = '자동 생성'; // 출고 코드 기본값
		modalTransDate.value = new Date().toISOString().substring(0, 10); // 출고일 기본값 (오늘)
		modalInvTransIdx.value = ''; // ID 필드 초기화
	} else if (mode === 'view' && invTransIdx !== null) { // 상세 보기 (수정) 모드
		modalTitle.textContent = '출고 상세 정보'; // 타이틀 변경
		editButton.style.display = 'block'; // 수정 버튼 표시
		modalTransStatusGroup.style.display = 'flex'; // 상태 선택 그룹 표시

		try {
			const response = await fetch(`/api/inv-transactions/${invTransIdx}`);
			if (!response.ok) {
				throw new Error(`HTTP 오류! 상태: ${response.status}, 메시지: ${await response.text()}`);
			}
			const transaction = await response.json(); // 상세 정보 가져오기

			// 거래처가 있는 경우, 해당 거래처의 품목으로 모달 품목 리스트를 다시 로드
			if (transaction.custIdx) {
				await loadModalItemsDatalist(transaction.custIdx);
			} else {
				// 거래처가 없는 경우, 모든 품목을 로드
				await loadModalItemsDatalist();
			}

			// 폼 필드에 데이터 채우기
			modalInvTransIdx.value = transaction.invTransIdx || '';
			modalTransCode.value = transaction.invTransCode || '';
			modalTransDate.value = formatDateToInput(transaction.transDate) || '';
			modalTransQty.value = transaction.transQty || '';
			modalUnitPrice.value = transaction.unitPrice || '';
			modalRemark.value = transaction.remark || transaction.invTransRemark || '';
			modalTransStatusSelect.value = transaction.transStatus || '';

			// 데이터리스트 관련 필드 값 설정
			setModalDatalistValue('modalCustNm', 'modalHiddenCustIdx', modalCustsData, transaction.custIdx);
			setModalDatalistValue('modalItemNm', 'modalHiddenItemIdx', modalItemsData, transaction.itemIdx);
			setModalDatalistValue('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, transaction.whIdx);
			setModalDatalistValue('modalUserNm', 'modalHiddenUserIdx', modalManagersData, transaction.userIdx);

		} catch (error) {
			console.error('출고 상세 정보 로드 오류:', error); // 메시지 변경
			alert('출고 정보를 불러오는데 실패했습니다: ' + error.message); // 메시지 변경
			closeModal(); // 오류 발생 시 모달 닫기
			return;
		}
	} else {
		alert('모달을 여는 중 오류가 발생했습니다.');
		return;
	}
	modal.style.display = 'flex'; // 모달 표시
}

// 모달 닫기 함수
function closeModal() {
	modal.style.display = 'none'; // 모달 숨김
	modalForm.reset(); // 폼 초기화
	currentInvTransIdxForModal = null; // 현재 모달 ID 초기화
	// 유효성 메시지 초기화
	[modalCustNmInput, modalItemNmInput, modalWhNmInput, modalUserNmInput].forEach(input => input.setCustomValidity(''));
	// 모달 닫을 때 품목 리스트 전체로 리셋
	loadModalItemsDatalist().catch(err => console.error("모달 닫을 때 품목 리스트 리셋 오류:", err));
}

// 모달 외부 클릭 시 닫기
function outsideClick(e) {
	if (e.target.id === 'outboundModal') { // 모달 ID outboundModal로 변경
		closeModal();
	}
}

// === 데이터리스트 로드 함수 (검색 필드 - 품목) ===
async function loadSearchItemsDatalist(custIdx = null) {
	let itemApiUrl = '/api/items/active-for-selection';
	// custIdx가 유효한 값일 경우, URL에 추가
	if (custIdx !== null && custIdx !== undefined && String(custIdx).trim() !== '') {
		itemApiUrl += `?custIdx=${encodeURIComponent(String(custIdx))}`;
	}
	try {
		const itemResponse = await fetch(itemApiUrl);
		if (itemResponse.ok) {
			searchItemsData = await itemResponse.json();
		} else {
			console.error('검색용 품목 목록 조회 오류:', await itemResponse.text());
			searchItemsData = [];
		}
	} catch (error) {
		console.error("검색용 품목 데이터리스트 로드 실패:", error);
		searchItemsData = [];
	}
	populateDatalist('searchItemsDatalist', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
}

// === 데이터리스트 로드 함수 (모달용 - 품목) ===
async function loadModalItemsDatalist(custIdx = null) {
	let itemApiUrl = '/api/items/active-for-selection';
	// custIdx가 유효한 값일 경우, URL에 추가
	if (custIdx !== null && custIdx !== undefined && String(custIdx).trim() !== '') {
		itemApiUrl += `?custIdx=${encodeURIComponent(String(custIdx))}`;
	}
	try {
		const itemResponse = await fetch(itemApiUrl);
		if (itemResponse.ok) {
			modalItemsData = await itemResponse.json();
		} else {
			console.error('모달용 품목 목록 조회 오류:', await itemResponse.text());
			modalItemsData = [];
		}
	} catch (error) {
		console.error("모달용 품목 데이터리스트 로드 실패:", error);
		modalItemsData = [];
	}
	populateDatalist('modalItemsDatalist', modalItemsData, 'itemNm', 'itemCd', 'itemIdx');
}

// === 데이터리스트 로드 함수 (검색용 - 품목 외) ===
async function loadSearchDatalistData() {
	try {
		await Promise.all([
			loadSearchItemsDatalist(), // 검색용 전체 품목 초기 로드
			(async () => {
				// === BIZ_FLAG '02' (매출처)로 수정 ===
				const custResponse = await fetch('/api/customers/active-for-selection?bizFlag=02');
				if (custResponse.ok) searchCustsData = await custResponse.json();
				else console.error('검색용 거래처(매출처) 목록 조회 오류:', await custResponse.text());
				populateDatalist('searchCustsDatalist', searchCustsData, 'custNm', 'custCd', 'custIdx');
			})(),
			(async () => {
				const warehouseResponse = await fetch('/api/warehouses/active-for-selection');
				if (warehouseResponse.ok) searchWarehousesData = await warehouseResponse.json();
				else console.error('검색용 창고 목록 조회 오류:', await warehouseResponse.text());
				populateDatalist('searchWarehousesDatalist', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
			})(),
			(async () => {
				const managerResponse = await fetch('/api/users/active-for-selection');
				if (managerResponse.ok) searchManagersData = await managerResponse.json();
				else console.error('검색용 담당자 목록 조회 오류:', await managerResponse.text());
				populateDatalist('searchManagersDatalist', searchManagersData, 'userNm', 'userId', 'userIdx');
			})()
		]);
	} catch (error) {
		console.error("검색용 데이터리스트 초기 로드 중 전체 오류:", error);
	}
}

// === 데이터리스트 로드 함수 (모달용 - 전체) ===
async function loadModalDatalistData() {
	try {
		const loadItemsPromise = loadModalItemsDatalist(); // 모달용 품목 리스트 (초기 전체)

		const [custRes, warehouseRes, managerRes] = await Promise.all([
			// === BIZ_FLAG '02' (매출처)로 수정 ===
			fetch('/api/customers/active-for-selection?bizFlag=02'),
			fetch('/api/warehouses/active-for-selection'),
			fetch('/api/users/active-for-selection')
		]);

		await loadItemsPromise; // 품목 로드 완료 대기

		if (custRes.ok) modalCustsData = await custRes.json();
		else console.error('모달용 거래처(매출처) 목록 조회 오류:', await custRes.text());

		if (warehouseRes.ok) modalWarehousesData = await warehouseRes.json();
		else console.error('모달용 창고 목록 조회 오류:', await warehouseRes.text());

		if (managerRes.ok) modalManagersData = await managerRes.json();
		else console.error('모달용 담당자 목록 조회 오류:', await managerRes.text());

		// 품목은 loadModalItemsDatalist에서 populateDatalist 호출됨
		populateDatalist('modalCustsDatalist', modalCustsData, 'custNm', 'custCd', 'custIdx');
		populateDatalist('modalWarehousesDatalist', modalWarehousesData, 'whNm', 'whCd', 'whIdx');
		populateDatalist('modalManagersDatalist', modalManagersData, 'userNm', 'userId', 'userIdx');

	} catch (error) {
		console.error("모달용 데이터리스트 로드 실패:", error);
	}
}

// 데이터리스트에 <option> 요소를 채우는 함수
function populateDatalist(datalistId, dataArray, displayField, codeField, idxField) {
	const datalist = document.getElementById(datalistId);
	if (!datalist) {
		console.warn(`Datalist ID '${datalistId}'를 찾을 수 없습니다.`);
		return;
	}
	datalist.innerHTML = ''; // 기존 옵션 초기화
	if (!Array.isArray(dataArray)) {
		console.warn(`'${datalistId}'에 대한 데이터가 배열이 아닙니다.`);
		return;
	}
	dataArray.forEach(item => {
		const option = document.createElement('option');
		const displayValue = item[displayField] || 'N/A';
		const codeValue = item[codeField] || 'N/A';
		option.value = `${displayValue} (${codeValue})`;
		option.dataset.idx = item[idxField];
		datalist.appendChild(option);
	});
}

// 데이터리스트 입력 필드에 대한 이벤트 리스너 설정 함수
function setupDatalistInputListener(inputId, hiddenInputId, displayField, codeField, idxField, required = false) {
	const inputElement = document.getElementById(inputId);
	const hiddenInputElement = document.getElementById(hiddenInputId);

	if (!inputElement || !hiddenInputElement) {
		console.warn(`데이터리스트 설정 오류: ${inputId} 또는 ${hiddenInputId} 요소를 찾을 수 없습니다.`);
		return;
	}
	if (required) inputElement.required = true;

	const handler = () => {
		const inputValue = inputElement.value;
		let currentDatalistArray;

		if (inputId.startsWith('search')) {
			if (inputId.includes('Item')) currentDatalistArray = searchItemsData;
			else if (inputId.includes('Cust')) currentDatalistArray = searchCustsData;
			else if (inputId.includes('Wh')) currentDatalistArray = searchWarehousesData;
			else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = searchManagersData;
		} else {
			if (inputId.includes('Item')) currentDatalistArray = modalItemsData;
			else if (inputId.includes('Cust')) currentDatalistArray = modalCustsData;
			else if (inputId.includes('Wh')) currentDatalistArray = modalWarehousesData;
			else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = modalManagersData;
		}
		currentDatalistArray = currentDatalistArray || [];

		if (!Array.isArray(currentDatalistArray) || currentDatalistArray.length === 0 && inputValue.trim() !== '') {
			hiddenInputElement.value = '';
			if (required) inputElement.setCustomValidity('선택할 목록이 없거나 로딩 중입니다.');
			else inputElement.setCustomValidity('');
			return;
		}

		const matchedItem = currentDatalistArray.find(data => `${data[displayField] || ''} (${data[codeField] || ''})` === inputValue);

		if (matchedItem) {
			hiddenInputElement.value = matchedItem[idxField];
			inputElement.setCustomValidity('');
		} else {
			hiddenInputElement.value = '';
			if (inputValue.trim() !== '') {
				inputElement.setCustomValidity('목록에 있는 유효한 항목을 선택하거나, 입력 값을 확인해주세요.');
			} else if (required) {
				inputElement.setCustomValidity('필수 항목입니다. 목록에서 항목을 선택해주세요.');
			} else {
				inputElement.setCustomValidity('');
			}
		}
	};
	inputElement.addEventListener('input', handler);
	inputElement.addEventListener('change', handler);
}

// 모달의 데이터리스트 필드 값을 설정하는 함수 (상세 보기 시 사용)
function setModalDatalistValue(inputElementId, hiddenInputId, datalistData, selectedIdx) {
	const input = document.getElementById(inputElementId);
	const hiddenInput = document.getElementById(hiddenInputId);

	if (!input || !hiddenInput) return;
	input.setCustomValidity('');

	if (selectedIdx === null || selectedIdx === undefined || String(selectedIdx).trim() === '') {
		input.value = '';
		hiddenInput.value = '';
		return;
	}

	if (!Array.isArray(datalistData) || datalistData.length === 0) {
		console.warn(`${inputElementId}에 대한 데이터리스트가 비어있습니다. ID ${selectedIdx}를 설정할 수 없습니다.`);
		input.value = '';
		hiddenInput.value = '';
		if (input.required) input.setCustomValidity('선택할 목록이 없습니다. 데이터 로딩을 확인하세요.');
		return;
	}

	const idxFieldName = (() => {
		if (inputElementId.toLowerCase().includes('item')) return 'itemIdx';
		if (inputElementId.toLowerCase().includes('cust')) return 'custIdx';
		if (inputElementId.toLowerCase().includes('wh')) return 'whIdx';
		if (inputElementId.toLowerCase().includes('user')) return 'userIdx';
		if (datalistData.length > 0) {
			const firstItem = datalistData[0];
			if (firstItem.hasOwnProperty('itemIdx')) return 'itemIdx';
			if (firstItem.hasOwnProperty('custIdx')) return 'custIdx';
			if (firstItem.hasOwnProperty('whIdx')) return 'whIdx';
			if (firstItem.hasOwnProperty('userIdx')) return 'userIdx';
		}
		return 'id';
	})();

	const selectedItem = datalistData.find(item => String(item[idxFieldName]) === String(selectedIdx));

	if (selectedItem) {
		const displayField = selectedItem.hasOwnProperty('itemNm') ? 'itemNm' : selectedItem.hasOwnProperty('custNm') ? 'custNm' : selectedItem.hasOwnProperty('whNm') ? 'whNm' : selectedItem.hasOwnProperty('userNm') ? 'userNm' : 'name';
		const codeField = selectedItem.hasOwnProperty('itemCd') ? 'itemCd' : selectedItem.hasOwnProperty('custCd') ? 'custCd' : selectedItem.hasOwnProperty('whCd') ? 'whCd' : selectedItem.hasOwnProperty('userId') ? 'userId' : 'code';

		input.value = `${selectedItem[displayField] || ''} (${selectedItem[codeField] || ''})`;
		hiddenInput.value = selectedItem[idxFieldName];
		input.setCustomValidity('');
	} else {
		input.value = '';
		hiddenInput.value = '';
		console.warn(`${inputElementId}에서 ID ${selectedIdx}에 해당하는 항목을 찾지 못했습니다. 목록이 필터링되었거나 항목이 비활성화되었을 수 있습니다.`);
		if (input.required) input.setCustomValidity('선택된 값이 현재 목록에 없습니다. 필터 조건을 확인하세요.');
	}
}

// 날짜 문자열을 'YYYY-MM-DD' 형식으로 변환 (input[type="date"]용)
function formatDateToInput(dateString) {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';
		return date.toISOString().substring(0, 10);
	} catch (e) { return ''; }
}

// 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환 (테이블 표시용)
function formatDate(dateString) {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return '';
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}.${month}.${day}`;
	} catch (e) { return ''; }
}

// 출고 상태 코드를 텍스트로 변환
function getTransStatusText(statusCode) {
	const statusMap = {
		'S1': '출고전',
		'S2': '출고완료',
		'R1': '입고전', // 공통 API 사용으로 입고 상태도 포함될 수 있음
		'R2': '가입고',
		'R3': '입고완료'
	};
	return statusMap[statusCode] || statusCode || '';
}

// DOMContentLoaded 이벤트: 페이지 로드가 완료되면 실행
document.addEventListener('DOMContentLoaded', () => {
	// 검색용 데이터리스트 로드 및 관련 입력 필드 리스너 설정
	loadSearchDatalistData().then(() => {
		setupDatalistInputListener('searchItemNm', 'searchHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx');
		setupDatalistInputListener('searchCustNm', 'searchHiddenCustIdx', 'custNm', 'custCd', 'custIdx');
		setupDatalistInputListener('searchWhNm', 'searchHiddenWhIdx', 'whNm', 'whCd', 'whIdx');
		setupDatalistInputListener('searchUserNm', 'searchHiddenUserIdx', 'userNm', 'userId', 'userIdx');

		// 검색 영역: 거래처 선택 변경 시 품목 데이터리스트 업데이트
		searchCustNmInput.addEventListener('change', () => {
			const selectedCustIdx = searchHiddenCustIdxInput.value;
			searchItemNmInput.value = '';
			searchHiddenItemIdxInput.value = '';
			searchItemNmInput.setCustomValidity('');
			loadSearchItemsDatalist(selectedCustIdx);
		});
	});

	// 모달용 데이터리스트 관련 입력 필드 리스너 설정
	setupDatalistInputListener('modalItemNm', 'modalHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx', true);
	setupDatalistInputListener('modalCustNm', 'modalHiddenCustIdx', 'custNm', 'custCd', 'custIdx', true);
	setupDatalistInputListener('modalWhNm', 'modalHiddenWhIdx', 'whNm', 'whCd', 'whIdx', true);
	setupDatalistInputListener('modalUserNm', 'modalHiddenUserIdx', 'userNm', 'userId', 'userIdx', false);

	// 모달 영역: 거래처 선택 변경 시 품목 데이터리스트 업데이트
	modalCustNmInput.addEventListener('change', () => {
		const selectedCustIdx = modalHiddenCustIdxInput.value;
		modalItemNmInput.value = '';
		modalHiddenItemIdxInput.value = '';
		modalItemNmInput.setCustomValidity('');
		loadModalItemsDatalist(selectedCustIdx);
	});

	// 초기 출고 테이블 로드
	loadOutboundTable();

	// 검색 버튼 클릭 이벤트
	searchButton.addEventListener('click', (event) => {
		event.preventDefault();
		searchFilters = {
			transDateFrom: searchTransDateFromInput.value,
			transDateTo: searchTransDateToInput.value,
			itemIdx: searchHiddenItemIdxInput.value,
			custIdx: searchHiddenCustIdxInput.value,
			userIdx: searchHiddenUserIdxInput.value,
			whIdx: searchHiddenWhIdxInput.value,
			transStatus: searchTransStatusSelect.value
		};
		loadOutboundTable(1, currentSortBy, currentOrder, searchFilters);
	});

	// 검색 폼 내 입력 필드에서 Enter 키 입력 또는 Select 변경 시 자동 검색
	document.querySelectorAll('#outboundForm input[type="text"],#outboundForm input[type="date"],#outboundForm select').forEach(input => { // 폼 ID outboundForm으로 변경
		input.addEventListener('keypress', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				searchButton.click();
			}
		});
		if (input.tagName === 'SELECT') {
			input.addEventListener('change', () => searchButton.click());
		}
	});

	// 검색 초기화 버튼 클릭 이벤트
	resetSearchButton.addEventListener('click', () => {
		document.getElementById('outboundForm').reset(); // 폼 ID outboundForm으로 변경
		[searchHiddenItemIdxInput, searchHiddenCustIdxInput, searchHiddenUserIdxInput, searchHiddenWhIdxInput]
			.forEach(input => {
				input.value = '';
				const visibleInputId = input.id.replace('Hidden', '').replace('Idx', 'Nm');
				const visibleInput = document.getElementById(visibleInputId);
				if (visibleInput) visibleInput.setCustomValidity('');
			});
		searchFilters = { transDateFrom: '', transDateTo: '', itemIdx: '', custIdx: '', userIdx: '', whIdx: '', transStatus: '' };
		currentSortBy = 'invTransIdx';
		currentOrder = 'desc';

		document.querySelectorAll('#outboundTable thead th .sort-arrow').forEach(arrow => { // 테이블 ID outboundTable로 변경
			arrow.textContent = '↓';
			arrow.classList.remove('active');
			const th = arrow.closest('th');
			if (th && th.dataset.sortBy === currentSortBy) {
				arrow.classList.add('active');
				arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
			}
		});
		loadSearchItemsDatalist(); // 품목 데이터리스트 전체로 리셋
		loadOutboundTable(1, currentSortBy, currentOrder, searchFilters);
	});

	// 신규 등록 버튼 클릭 이벤트
	newRegistrationButton.addEventListener('click', () => openModal('new'));

	// 테이블 전체 선택/해제 체크박스 이벤트
	selectAllCheckboxes.addEventListener('change', function() {
		document.querySelectorAll('.trans-checkbox').forEach(cb => cb.checked = this.checked);
	});

	// 테이블 개별 체크박스 변경 시 전체 선택 체크박스 상태 업데이트
	outboundTableBody.addEventListener('change', function(event) { // 테이블 ID outboundTableBody로 변경
		if (event.target.classList.contains('trans-checkbox')) {
			const allCB = document.querySelectorAll('.trans-checkbox');
			const checkedCB = document.querySelectorAll('.trans-checkbox:checked');
			selectAllCheckboxes.checked = allCB.length > 0 && allCB.length === checkedCB.length;
		}
	});

	// 모달 폼 제출 (등록/수정) 이벤트
	modalForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (!modalForm.checkValidity()) {
			modalForm.reportValidity();
			return;
		}

		const requiredModalDatalistInputs = [
			{ visible: modalItemNmInput, hidden: modalHiddenItemIdxInput, name: "품목" },
			{ visible: modalCustNmInput, hidden: modalHiddenCustIdxInput, name: "거래처" },
			{ visible: modalWhNmInput, hidden: modalHiddenWhIdxInput, name: "출고 창고" }
		];
		for (const field of requiredModalDatalistInputs) {
			if (field.visible.required && !field.hidden.value) {
				if (field.visible.value.trim() === '') {
					field.visible.setCustomValidity('필수 항목입니다. 목록에서 선택해주세요.');
				} else {
					field.visible.setCustomValidity('목록에 있는 유효한 항목을 선택해주세요.');
				}
				modalForm.reportValidity();
				return;
			}
		}

		const formData = new FormData(event.target);
		const isEditMode = formData.get('invTransIdx') && formData.get('invTransIdx') !== '';
		const data = {
			invTransIdx: formData.get('invTransIdx') || null,
			invTransCode: formData.get('invTransCode') === '자동 생성' ? null : formData.get('invTransCode'),
			transType: 'S', // 출고 유형 'S'로 고정
			whIdx: parseInt(formData.get('whIdx')),
			transDate: formData.get('transDate'),
			transQty: parseInt(formData.get('transQty')),
			unitPrice: parseFloat(formData.get('unitPrice')),
			transStatus: formData.get('transStatus') || 'S1', // 상태 기본값 'S1' (출고전)
			userIdx: formData.get('userIdx') ? parseInt(formData.get('userIdx')) : null,
			itemIdx: parseInt(formData.get('itemIdx')),
			custIdx: parseInt(formData.get('custIdx')),
			remark: formData.get('remark')
		};

		const url = isEditMode ? `/api/inv-transactions/${data.invTransIdx}` : '/api/inv-transactions';
		const method = isEditMode ? 'PUT' : 'POST';

		try {
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			if (!response.ok) {
				const errorText = await response.text();
				let errorMessage = `HTTP 오류! ${response.status}: ${errorText}`;
				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage;
				} catch (e) { /* 파싱 실패 시 기존 오류 메시지 사용 */ }
				throw new Error(errorMessage);
			}
			alert(isEditMode ? '출고 정보가 성공적으로 수정되었습니다.' : '새 출고가 성공적으로 등록되었습니다.'); // 메시지 변경
			closeModal();
			loadOutboundTable(isEditMode ? currentPage : 1, currentSortBy, currentOrder, searchFilters);
		} catch (error) {
			console.error('출고 정보 저장 오류:', error); // 메시지 변경
			alert(`출고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`); // 메시지 변경
		}
	});

	// 삭제 버튼 클릭 이벤트
	deleteButton.addEventListener('click', async () => {
		const checkedCBs = document.querySelectorAll('.trans-checkbox:checked');
		const idsToDelete = Array.from(checkedCBs).map(cb => cb.dataset.invTransIdx);

		if (idsToDelete.length === 0) {
			alert('삭제할 출고 항목을 선택해주세요.'); // 메시지 변경
			return;
		}
		if (!confirm(`${idsToDelete.length}개 출고 항목을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) { // 메시지 변경
			return;
		}

		try {
			const response = await fetch('/api/inv-transactions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(idsToDelete)
			});
			if (!response.ok && response.status !== 204) {
				const errorText = await response.text();
				let errorMessage = `HTTP 오류! ${response.status}: ${errorText}`;
				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.message || errorMessage;
				} catch (e) { /* 파싱 실패 시 기존 오류 메시지 사용 */ }
				throw new Error(errorMessage);
			}
			alert('선택된 출고 항목이 삭제되었습니다.'); // 메시지 변경

			const newTotal = parseInt(totalRecordsSpan.textContent) - idsToDelete.length;
			if (newTotal <= (currentPage - 1) * pageSize && currentPage > 1) {
				currentPage--;
			}
			loadOutboundTable(currentPage, currentSortBy, currentOrder, searchFilters);
			selectAllCheckboxes.checked = false;
		} catch (error) {
			console.error('출고 항목 삭제 오류:', error); // 메시지 변경
			alert(`출고 항목 삭제 실패: ${error.message}`); // 메시지 변경
		}
	});

	// 페이지네이션 버튼 이벤트
	btnFirstPage.addEventListener('click', () => loadOutboundTable(1, currentSortBy, currentOrder, searchFilters));
	btnPrevPage.addEventListener('click', () => {
		if (currentPage > 1) loadOutboundTable(currentPage - 1, currentSortBy, currentOrder, searchFilters);
	});
	btnNextPage.addEventListener('click', () => {
		if (currentPage < totalPages) loadOutboundTable(currentPage + 1, currentSortBy, currentOrder, searchFilters);
	});
	btnLastPage.addEventListener('click', () => loadOutboundTable(totalPages, currentSortBy, currentOrder, searchFilters));

	pageNumberInput.addEventListener('keypress', (event) => {
		if (event.key === 'Enter') {
			let page = parseInt(pageNumberInput.value);
			if (isNaN(page) || page < 1) page = 1;
			if (page > totalPages && totalPages > 0) page = totalPages;
			else if (totalPages === 0) page = 1;
			loadOutboundTable(page, currentSortBy, currentOrder, searchFilters);
		}
	});
	pageNumberInput.addEventListener('blur', () => {
		let page = parseInt(pageNumberInput.value);
		if (isNaN(page) || page < 1) page = 1;
		if (page > totalPages && totalPages > 0) page = totalPages;
		else if (totalPages === 0) page = 1;
		pageNumberInput.value = page;
	});
});