
// =====================================================================================
// 전역 변수 선언
// =====================================================================================
let allProductsForSelection = [];
let allRawMaterialsForSelection = [];
let currentlyEditingComponentState = {
	bomIdx: null, subItemIdx: null, itemCd: '', itemNm: '',
	useQty: 1, unitNm: '', itemPrice: 0, lossRt: 0,
	remark: '', itemFlag: '01', subItemMasterCost: 0
};
let originalParentItemIdForUpdate = null;
let draggedRow = null;

// --- 검색, 정렬, 페이지네이션을 위한 전역 변수 ---
let allBomData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentSearchTerm = '';
let currentSortColumn = 'pitemCd';
let currentSortOrder = 'asc';
// --- ---

// =====================================================================================
// 유틸리티 함수
// =====================================================================================
function getSelectedSubItemIds() {
	const rows = document.querySelectorAll('#bomDetailTbody tr[data-sub-item-idx]');
	return Array.from(rows).map(row => Number(row.dataset.subItemIdx));
}

// =====================================================================================
// 초기화 및 메인 이벤트 리스너
// =====================================================================================
document.addEventListener('DOMContentLoaded', function() {
	console.log("DOM 로드 완료, 초기 데이터 로딩 시작");
	loadAllItemsForSelection();
	loadMainBomSummaryList();

	// --- 검색 이벤트 리스너 ---
	const searchInput = document.getElementById('mainSearchInput');
	const searchButton = document.getElementById('mainSearchButton');

	searchButton.addEventListener('click', performSearch);
	searchInput.addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			performSearch();
		}
	});

	function performSearch() {
		currentSearchTerm = searchInput.value.trim();
		currentPage = 1;
		renderTable();
	}
	// --- ---

	// --- 페이지네이션 이벤트 리스너 ---
	document.getElementById('btn-prev-page').addEventListener('click', () => {
		if (currentPage > 1) {
			currentPage--;
			renderTable();
		}
	});
	document.getElementById('btn-next-page').addEventListener('click', () => {
		const totalPages = Math.ceil(getFilteredAndSortedData().length / itemsPerPage);
		if (currentPage < totalPages) {
			currentPage++;
			renderTable();
		}
	});
	document.getElementById('pageInput').addEventListener('change', (e) => {
		const totalPages = Math.ceil(getFilteredAndSortedData().length / itemsPerPage);
		let newPage = parseInt(e.target.value, 10);
		if (isNaN(newPage) || newPage < 1) {
			newPage = 1;
		} else if (newPage > totalPages) {
			newPage = totalPages;
		}
		currentPage = newPage;
		renderTable();
	});
	// --- ---


	// 모달 내 검색 리스너
	const searchParentInput = document.getElementById('searchParentInput');
	const searchRawInput = document.getElementById('searchRawInput');

	searchParentInput.addEventListener('input', () => {
		const term = searchParentInput.value.trim().toLowerCase();
		const selectedRadio = document.querySelector('input[name="parent-item-select"]:checked');
		const currentSelectedId = selectedRadio ? Number(selectedRadio.value) : null;
		const filtered = allProductsForSelection.filter(item =>
			(currentSelectedId && item.itemIdx === currentSelectedId) ||
			(term === '' || String(item.itemIdx).includes(term) || item.itemCd.toLowerCase().includes(term) || item.itemNm.toLowerCase().includes(term))
		);
		populateProductSelectionTable(filtered, currentSelectedId);
	});

	searchRawInput.addEventListener('input', () => {
		const term = searchRawInput.value.trim().toLowerCase();
		const selectedIds = getSelectedSubItemIds();
		const filtered = allRawMaterialsForSelection.filter(item =>
			selectedIds.includes(item.itemIdx) ||
			(term === '' || String(item.itemIdx).includes(term) || item.itemCd.toLowerCase().includes(term) || item.itemNm.toLowerCase().includes(term))
		);
		populateRawMaterialSelectionTable(filtered);
	});

	// 하위 품목 편집 필드 리스너
	const useQtyInput = document.getElementById('componentUseQty');
	const lossRtInput = document.getElementById('componentLossRt');
	const componentRemarkInput = document.getElementById('componentRemark');
	if (useQtyInput) useQtyInput.addEventListener('input', handleComponentEditInputChange);
	if (lossRtInput) lossRtInput.addEventListener('input', handleComponentEditInputChange);
	if (componentRemarkInput) componentRemarkInput.addEventListener('input', handleComponentEditInputChange);

	// 저장/수정 버튼 리스너
	const editButton = document.querySelector('#modalForm button[name="edit"]');
	if (editButton) editButton.addEventListener('click', handleBomUpdate);
	const saveButton = document.querySelector('#modalForm button[name="save"]');
	if (saveButton) saveButton.addEventListener('click', handleBomSave);

	// 상위 품목 선택(라디오) 리스너
	const productTbody = document.getElementById('productSelectionTbody');
	if (productTbody) {
		productTbody.addEventListener('change', function(event) {
			if (event.target.type === 'radio' && event.target.name === 'parent-item-select') {
				handleParentItemSelection(event.target);
			}
		});
	}
	
	// 전체선택/해제 기능
	const selectAllCheckbox = document.getElementById('selectAllBOMCheckbox');
	selectAllCheckbox.addEventListener('change', function() {
	  const checked = this.checked;
	  // tbody 안의 모든 행 체크박스에 동일하게 적용
	  document.querySelectorAll('#bomTbody tr td input[type="checkbox"]').forEach(cb => {
	    cb.checked = checked;
	  });
	});
	
});

// =====================================================================================
// 데이터 렌더링 함수 (검색, 정렬, 페이지네이션 적용)
// =====================================================================================
function getFilteredAndSortedData() {
	let filteredData = allBomData;

	if (currentSearchTerm) {
		const lowerCaseTerm = currentSearchTerm.toLowerCase();
		filteredData = allBomData.filter(item =>
			Object.values(item).some(val =>
				String(val).toLowerCase().includes(lowerCaseTerm)
			)
		);
	}

	filteredData.sort((a, b) => {
		let valA = a[currentSortColumn];
		let valB = b[currentSortColumn];

		if (currentSortColumn === 'ptotalRawMaterialCost') {
			valA = parseFloat(valA) || 0;
			valB = parseFloat(valB) || 0;
		} else {
			valA = String(valA || '').toLowerCase();
			valB = String(valB || '').toLowerCase();
		}

		if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
		if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
		return 0;
	});

	return filteredData;
}

function renderTable() {
	const tbody = document.getElementById('bomTbody');
	tbody.innerHTML = '';
	const filteredData = getFilteredAndSortedData();
	const totalItems = filteredData.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

	currentPage = Math.max(1, Math.min(currentPage, totalPages));

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const pageData = filteredData.slice(startIndex, endIndex);
	
	if (pageData.length === 0) {
		tbody.innerHTML = `<tr><td colspan="6" class="nodata">${currentSearchTerm ? '검색 결과가 없습니다.' : '등록된 BOM이 없습니다.'}</td></tr>`;
	} else {
		pageData.forEach(item => {
			const tr = document.createElement('tr');
			tr.style.cursor = 'pointer';
			tr.setAttribute('data-id', item.itemIdx);
			tr.innerHTML = `
                    <td onclick="event.stopPropagation()"><input type="checkbox"></td>
                    <td>${item.pitemCd || ''}</td>
                    <td>${item.pitemNm || ''}</td>
                    <td>${item.catNm || ''}</td>
                    <td>${item.punitNm || ''}</td>
                    <td>${(item.ptotalRawMaterialCost != null ? Math.round(item.ptotalRawMaterialCost).toLocaleString() : '0')}원</td>
                `;
			tr.addEventListener('click', function() {
				const bomId = this.getAttribute('data-id');
				fetchBomDetails(bomId);
			});
			tbody.appendChild(tr);
		});
	}
	updatePaginationControls(totalItems, totalPages);
	updateSortIndicators();
}

function updatePaginationControls(totalItems, totalPages) {
	document.getElementById('paginationInfo').textContent = `총 ${totalItems}건 ${currentPage}/${totalPages}페이지`;
	document.getElementById('pageInput').value = currentPage;
	document.getElementById('btn-prev-page').disabled = (currentPage === 1);
	document.getElementById('btn-next-page').disabled = (currentPage === totalPages);
}

function updateSortIndicators() {
	document.querySelectorAll("thead th[data-column]").forEach(th => {
		const a = th.querySelector('a');
		a.classList.remove('active'); // 모든 active 클래스 제거
		if (th.dataset.column === currentSortColumn) {
			a.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
			a.classList.add('active'); // 현재 정렬 컬럼에 active 클래스 추가
			a.style.opacity = 1; // 활성 표시
		} else {
			a.textContent = '↓';
			a.style.opacity = 0.3; // 비활성 표시
		}
	});
}

// =====================================================================================
// 데이터 로딩 함수
// =====================================================================================
function loadMainBomSummaryList() {
	fetch('/api/bom/summary')
		.then(res => {
			if (!res.ok) return res.text().then(text => { throw new Error(`Summary API Error: ${res.status} ${text}`); });
			return res.json();
		})
		.then(data => {
			allBomData = data || [];
			currentPage = 1;
			renderTable();
		})
		.catch(err => {
			console.error("BOM 목록 로딩 실패:", err);
			const tbody = document.getElementById('bomTbody');
			tbody.innerHTML = '<tr><td colspan="6" class="nodata">데이터를 불러오는 데 실패했습니다.</td></tr>';
			allBomData = [];
			renderTable();
		});
}

async function loadAllItemsForSelection() {
	console.log("loadAllItemsForSelection 시작");
	try {
		const productsResponse = await fetch('/api/bom/flag/02');
		if (productsResponse.ok) allProductsForSelection = await productsResponse.json();
		else { console.error("제품 목록 로딩 실패:", productsResponse.statusText); allProductsForSelection = []; }

		const rawMaterialsResponse = await fetch('/api/bom/flag/01');
		if (rawMaterialsResponse.ok) allRawMaterialsForSelection = await rawMaterialsResponse.json();
		else { console.error("원자재 목록 로딩 실패:", rawMaterialsResponse.statusText); allRawMaterialsForSelection = []; }
		console.log("데이터 로딩 완료: 품목", allProductsForSelection.length, "개, 원자재", allRawMaterialsForSelection.length, "개");
	} catch (error) {
		console.error("선택용 품목/원자재 로딩 중 오류:", error);
		allProductsForSelection = [];
		allRawMaterialsForSelection = [];
	}
}

// =====================================================================================
// 정렬 함수
// =====================================================================================
function order(thValue) {
	const newSortColumn = thValue.dataset.column;
	if (!newSortColumn) return;

	if (currentSortColumn === newSortColumn) {
		currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
	} else {
		currentSortColumn = newSortColumn;
		currentSortOrder = 'asc';
	}
	renderTable();
}

// =====================================================================================
// 모달 및 BOM 상세/편집 관련 함수들 (기존 코드 유지 및 일부 수정)
// =====================================================================================

function updateTargetBom5RowField(subItemIdx, fieldName, value) {
	const targetRow = findComponentInBomTab5(subItemIdx);
	if (!targetRow) return;

	let inputSelector = '';
	switch (fieldName.toLowerCase()) {
		case 'useqty': inputSelector = '.bom5-use-qty'; break;
		case 'lossrt': inputSelector = '.bom5-loss-rt'; break;
		case 'remark': inputSelector = '.bom5-remark'; break;
		case 'itemprice': inputSelector = '.bom5-item-price'; break;
		default: return;
	}
	const inputField = targetRow.querySelector(inputSelector);
	if (inputField) inputField.value = value;
}

function handleComponentEditInputChange(event) {
	const fieldName = event.target.id.replace('component', '').toLowerCase();
	let value = event.target.type === 'number' ? parseFloat(event.target.value) : event.target.value;
	if (event.target.type === 'number' && isNaN(value)) value = 0;

	const subItemIdxValue = document.getElementById('editingComponentSubItemIdx').value;

	if (subItemIdxValue) {
		const subItemIdx = Number(subItemIdxValue);

		if (fieldName === 'useqty') currentlyEditingComponentState.useQty = value;
		if (fieldName === 'lossrt') currentlyEditingComponentState.lossRt = value;
		if (fieldName === 'remark') currentlyEditingComponentState.remark = value;

		if (fieldName === 'useqty' || fieldName === 'lossrt') {
			updateTargetBom5RowField(subItemIdx, fieldName, value);
			calculateAndDisplayComponentLineCost();
		} else if (fieldName === 'remark') {
			updateTargetBom5RowField(subItemIdx, 'remark', value);
		}
	}
}

async function openModal() { // 신규 등록용
	console.log("openModal (신규) 호출됨");
	originalParentItemIdForUpdate = null;
	document.getElementById('modalForm').reset();
	document.getElementById('searchParentInput').value = '';
	document.getElementById('searchRawInput').value = '';
	document.getElementById('modalTitle').textContent = '신규 BOM 등록';
	document.getElementById('modalParentItemCd').value = '';
	document.getElementById('modalParentItemNm').value = '';
	document.getElementById('modalParentCycleTime').value = '';
	document.getElementById('modalParentRemark').value = '';
	clearComponentEditFields();
	document.getElementById('bomDetailTbody').innerHTML = `<tr><td class="nodata" colspan="8">새 BOM에 원자재를 추가하세요.</td></tr>`;
	await loadAllItemsForSelection();
	populateProductSelectionTable();
	populateRawMaterialSelectionTable();
	document.querySelector('#modalForm button[name="save"]').style.display = 'inline-flex';
	document.querySelector('#modalForm button[name="edit"]').style.display = 'none';
	document.getElementById('modal').style.display = 'flex';
}

function openDetailModal() { // 상세/수정용
	document.getElementById('modalTitle').textContent = 'BOM 상세 정보';
	document.querySelector('#modalForm button[name="save"]').style.display = 'none';
	document.querySelector('#modalForm button[name="edit"]').style.display = 'inline-flex';
	document.getElementById('modal').style.display = 'flex';
}

function closeModal(modalId = 'modal') {
	document.getElementById(modalId).style.display = 'none';
}

function outsideClick(e, modalId = 'modal') {
	if (e.target.id === modalId) {
		closeModal(modalId);
	}
}

async function fetchBomDetails(bomId) {
	console.log("fetchBomDetails 시작, BOM ID:", bomId);
	originalParentItemIdForUpdate = bomId;
	if (!bomId) return;
	document.getElementById('searchParentInput').value = '';
	document.getElementById('searchRawInput').value = '';
	if (allProductsForSelection.length === 0 || allRawMaterialsForSelection.length === 0) {
		await loadAllItemsForSelection();
	}
	fetch(`/api/bom/${bomId}`)
		.then(response => {
			if (response.ok) return response.json();
			if (response.status === 404) { alert('BOM 상세 정보를 찾을 수 없습니다.'); return null; }
			throw new Error(`Server error: ${response.statusText} - ${response.url}`);
		})
		.then(data => {
			if (data) {
				populateBomDetailsModal(data);
				populateProductSelectionTable(allProductsForSelection, data.itemIdx);
				populateRawMaterialSelectionTable();
				openDetailModal();
			} else {
				document.getElementById('modalParentItemCd').value = '';
				document.getElementById('modalParentItemNm').value = '';
				document.getElementById('modalParentCycleTime').value = '';
				document.getElementById('modalParentRemark').value = '';
				clearComponentEditFields();
				document.getElementById('bomDetailTbody').innerHTML = `<tr><td class="nodata" colspan="8">BOM 정보를 찾을 수 없습니다.</td></tr>`;
				populateProductSelectionTable();
				populateRawMaterialSelectionTable();
				openDetailModal();
			}
		})
		.catch(error => {
			console.error('BOM 상세 정보 조회 실패:', error);
			alert('BOM 상세 정보를 불러오는 중 오류가 발생했습니다.');
		});
}

function populateBomDetailsModal(data) {
	if (!data) { console.error("populateBomDetailsModal: 유효하지 않은 데이터"); return; }
	document.getElementById('modalParentItemCd').value = data.itemCd || '';
	document.getElementById('modalParentItemNm').value = data.itemNm || '';
	document.getElementById('modalParentCycleTime').value = data.cycleTime != null ? data.cycleTime : '';
	document.getElementById('modalParentRemark').value = data.remark || '';
	const detailTbody = document.getElementById('bomDetailTbody');
	detailTbody.innerHTML = '';
	clearComponentEditFields();
	if (!data.components || data.components.length === 0) {
		detailTbody.innerHTML = `<tr><td class="nodata" colspan="8">등록된 하위 품목이 없습니다.</td></tr>`;
	} else {
		data.components.forEach(component => {
			addComponentToBomTab5(component, data.itemNm);
		});
	}
	updateBomTab5RowNumbers();
}

function populateProductSelectionTable(list = allProductsForSelection, selectedParentItemId = null) {
	const productTbody = document.getElementById('productSelectionTbody');
	productTbody.innerHTML = '';
	const currentRadio = document.querySelector('input[name="parent-item-select"]:checked');
	const currentSelectedId = selectedParentItemId !== null ? selectedParentItemId : (currentRadio ? Number(currentRadio.value) : null);
	if (!list || list.length === 0) {
		productTbody.innerHTML = '<tr><td colspan="6" class="nodata">검색 결과가 없습니다.</td></tr>';
		return;
	}
	list.forEach((item) => {
		const isChecked = currentSelectedId !== null && Number(item.itemIdx) === currentSelectedId;
		const tr = document.createElement('tr');
		tr.innerHTML = `
          <td>${item.itemIdx}</td> <td>${item.itemCd || ''}</td> <td>${item.itemNm || ''}</td>
          <td>${item.itemSpec || ''}</td> <td>${item.unitNm || ''}</td>
          <td><input type="radio" name="parent-item-select" value="${item.itemIdx}" ${isChecked ? 'checked' : ''}></td>
        `;
		productTbody.appendChild(tr);
	});
}

function populateRawMaterialSelectionTable(list = allRawMaterialsForSelection) {
	const rawMaterialTbody = document.getElementById('rawMaterialSelectionTbody');
	rawMaterialTbody.innerHTML = '';
	const selectedIds = getSelectedSubItemIds();
	if (!list || list.length === 0) {
		rawMaterialTbody.innerHTML = '<tr><td colspan="6" class="nodata">검색 결과가 없습니다.</td></tr>';
		return;
	}
	list.forEach((item) => {
		const isChecked = selectedIds.includes(Number(item.itemIdx));
		const itemMasterCost = item.itemCost != null ? item.itemCost : 0;
		const tr = document.createElement('tr');
		tr.innerHTML = `
          <td>${item.itemIdx}</td> <td>${item.itemCd || ''}</td> <td>${item.itemNm || ''}</td>
          <td>${item.itemSpec || ''}</td> <td>${item.unitNm || ''}</td>
          <td><input type="checkbox" class="raw-material-checkbox" value="${item.itemIdx}"
                   data-item-cd="${item.itemCd || ''}" data-item-nm="${item.itemNm || ''}"
                   data-unit-nm="${item.unitNm || ''}" data-item-spec="${item.itemSpec || ''}"
                   data-item-cost="${itemMasterCost}" ${isChecked ? 'checked' : ''}></td>
        `;
		rawMaterialTbody.appendChild(tr);
	});
	addRawMaterialCheckboxListeners();
}

function addRawMaterialCheckboxListeners() {
	document.querySelectorAll('#rawMaterialSelectionTbody .raw-material-checkbox').forEach(checkbox => {
		checkbox.removeEventListener('change', handleRawMaterialCheckboxChange);
		checkbox.addEventListener('change', handleRawMaterialCheckboxChange);
	});
}

function handleRawMaterialCheckboxChange(event) {
	const checkbox = event.target;
	const subItemIdx = Number(checkbox.value);
	const itemCd = checkbox.dataset.itemCd;
	const itemNm = checkbox.dataset.itemNm;
	const unitNm = checkbox.dataset.unitNm;
	const itemMasterCost = parseFloat(checkbox.dataset.itemCost) || 0;
	clearComponentEditFields();
	if (checkbox.checked) {
		currentlyEditingComponentState = {
			bomIdx: null, subItemIdx: subItemIdx, itemCd: itemCd, itemNm: itemNm, useQty: 1,
			unitNm: unitNm, subItemMasterCost: itemMasterCost, lossRt: 0, remark: '', itemFlag: '01', itemPrice: 0
		};
		populateComponentEditFields(currentlyEditingComponentState, null);
		if (!findComponentInBomTab5(subItemIdx)) {
			const parentItemNm = document.getElementById('modalParentItemNm').value;
			const newRowData = {
				subItemIdx: subItemIdx, subItemCd: itemCd, subItemNm: itemNm, itemFlag: '01',
				useQty: currentlyEditingComponentState.useQty, unitNm: unitNm,
				lossRt: currentlyEditingComponentState.lossRt, itemPrice: currentlyEditingComponentState.itemPrice,
				remark: currentlyEditingComponentState.remark, subItemMasterCost: itemMasterCost
			};
			addComponentToBomTab5(newRowData, parentItemNm);
		}
	} else {
		removeComponentFromBomTab5(subItemIdx);
		if (Number(document.getElementById('editingComponentSubItemIdx').value) === subItemIdx) {
			clearComponentEditFields();
		}
	}
	updateBomTab5RowNumbers();
}

function findComponentInBomTab5(subItemIdxToFind) {
	return document.getElementById('bomDetailTbody')?.querySelector(`tr[data-sub-item-idx="${subItemIdxToFind}"]`);
}

function addComponentToBomTab5(componentData, parentItemName) {
	const detailTbody = document.getElementById('bomDetailTbody');
	if (!detailTbody) return;
	const noDataRow = detailTbody.querySelector('td.nodata');
	if (noDataRow) detailTbody.innerHTML = '';
	const tr = document.createElement('tr');
	tr.setAttribute('data-sub-item-idx', String(componentData.subItemIdx));
	if (componentData.bomIdx != null) tr.setAttribute('data-bom-idx', componentData.bomIdx);
	const itemType = componentData.itemFlag === '01' ? '원자재' : '제품/반제품';
	const useQuantity = componentData.useQty != null ? parseFloat(componentData.useQty) : 1;
	const lossRate = componentData.lossRt != null ? parseFloat(componentData.lossRt) : 0;
	const masterCost = componentData.subItemMasterCost != null ? parseFloat(componentData.subItemMasterCost) : 0;
	const remarkText = componentData.remark || '';
	const unitName = componentData.unitNm || '';
	const subItemNameText = componentData.subItemNm || '';
	let lineItemPrice = 0;
	if (componentData.itemPrice != null) { lineItemPrice = parseFloat(componentData.itemPrice); }
	else if (masterCost > 0) {
		const effectiveLossRate = lossRate / 100;
		if (effectiveLossRate < 1 && (1 - effectiveLossRate) !== 0) { lineItemPrice = (useQuantity / (1 - effectiveLossRate)) * masterCost; }
	}
	const roundedLinePrice = Math.round(lineItemPrice);
	tr.innerHTML = `
            <td class="drag-handle"><span class="material-symbols-outlined">drag_indicator</span></td> <td></td>
            <td>${parentItemName || document.getElementById('modalParentItemNm').value || ''}</td>
            <td>${subItemNameText} (${itemType})</td>
            <td><input type="number" class="bom5-input bom5-use-qty" value="${useQuantity}" step="any" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'useQty')"></td>
            <td><input type="number" class="bom5-input bom5-loss-rt" value="${lossRate}" step="any" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'lossRt')">%</td>
            <td><input type="number" class="bom5-input bom5-item-price" value="${roundedLinePrice}" step="any" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'itemPrice', true)">원</td>
            <td><input type="text" class="bom5-input bom5-remark" value="${remarkText}" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'remark')"></td>
        `;
	const dragHandle = tr.querySelector('.drag-handle');
	if (dragHandle) {
		dragHandle.setAttribute('draggable', 'true');
		dragHandle.addEventListener('dragstart', handleDragStart);
	}
	tr.addEventListener('dragover', handleDragOver);
	tr.addEventListener('drop', handleDrop);
	tr.addEventListener('dragenter', handleDragEnter);
	tr.addEventListener('dragleave', handleDragLeave);
	tr.addEventListener('dragend', handleDragEnd);
	tr.addEventListener('click', (event) => {
		if (event.target.closest('.drag-handle') || event.target.tagName.toLowerCase() === 'input' || draggedRow) {
			event.stopPropagation(); return;
		}
		const currentSubItemIdx = Number(tr.dataset.subItemIdx);
		let originalItemMasterData = allRawMaterialsForSelection.find(i => i.itemIdx === currentSubItemIdx) || allProductsForSelection.find(i => i.itemIdx === currentSubItemIdx);
		const masterCostForEdit = componentData.subItemMasterCost != null ? componentData.subItemMasterCost : (originalItemMasterData ? originalItemMasterData.itemCost : 0);
		const currentRowData = {
			bomIdx: tr.dataset.bomIdx ? Number(tr.dataset.bomIdx) : null, subItemIdx: currentSubItemIdx,
			subItemCd: originalItemMasterData ? originalItemMasterData.itemCd : (componentData.subItemCd || ''),
			subItemNm: originalItemMasterData ? originalItemMasterData.itemNm : (componentData.subItemNm || subItemNameText),
			useQty: parseFloat(tr.querySelector('.bom5-use-qty').value), unitNm: originalItemMasterData ? originalItemMasterData.unitNm : (componentData.unitNm || unitName),
			itemFlag: componentData.itemFlag || (originalItemMasterData ? originalItemMasterData.itemFlag : '01'),
			lossRt: parseFloat(tr.querySelector('.bom5-loss-rt').value), itemPrice: parseFloat(tr.querySelector('.bom5-item-price').value),
			remark: tr.querySelector('.bom5-remark').value, subItemMasterCost: masterCostForEdit
		};
		populateComponentEditFields(currentRowData, tr);
	});
	detailTbody.appendChild(tr);
	updateBomTab5RowNumbers();
}

function removeComponentFromBomTab5(subItemIdxToRemove) {
	const rowToRemove = findComponentInBomTab5(subItemIdxToRemove);
	if (rowToRemove) rowToRemove.remove();
	const detailTbody = document.getElementById('bomDetailTbody');
	if (detailTbody && detailTbody.children.length === 0 && !detailTbody.querySelector('td.nodata')) {
		detailTbody.innerHTML = `<tr><td class="nodata" colspan="8">등록된 하위 품목이 없습니다.</td></tr>`;
	}
	updateBomTab5RowNumbers();
}

function clearComponentEditFields() {
	document.getElementById('componentItemCd').value = ''; document.getElementById('componentItemNm').value = '';
	document.getElementById('componentUnitNm').value = ''; document.getElementById('componentUseQty').value = '1';
	document.getElementById('componentItemPrice').value = '0'; document.getElementById('componentLossRt').value = '0';
	document.getElementById('componentRemark').value = ''; document.getElementById('editingComponentBomIdx').value = '';
	document.getElementById('editingComponentSubItemIdx').value = '';
	currentlyEditingComponentState = { bomIdx: null, subItemIdx: null, itemCd: '', itemNm: '', useQty: 1, unitNm: '', itemPrice: 0, lossRt: 0, remark: '', itemFlag: '01', subItemMasterCost: 0 };
	document.querySelectorAll('#bomDetailTbody tr.selected-row-for-edit').forEach(row => row.classList.remove('selected-row-for-edit'));
}

function updateBomTab5RowNumbers() {
	const detailTbody = document.getElementById('bomDetailTbody');
	if (!detailTbody) return;
	const rows = detailTbody.querySelectorAll('tr:not(:has(td.nodata))');
	rows.forEach((row, index) => {
		const secondCell = row.querySelector('td:nth-child(2)');
		if (secondCell) secondCell.textContent = index + 1;
	});
}

function populateComponentEditFields(componentData, clickedRow) {
	document.querySelectorAll('#bomDetailTbody tr.selected-row-for-edit').forEach(row => row.classList.remove('selected-row-for-edit'));
	if (clickedRow) clickedRow.classList.add('selected-row-for-edit');
	currentlyEditingComponentState = { ...componentData };
	currentlyEditingComponentState.subItemIdx = Number(componentData.subItemIdx || (componentData.itemIdx || null));
	currentlyEditingComponentState.useQty = componentData.useQty != null ? parseFloat(componentData.useQty) : 1;
	currentlyEditingComponentState.lossRt = componentData.lossRt != null ? parseFloat(componentData.lossRt) : 0;
	currentlyEditingComponentState.itemPrice = componentData.itemPrice != null ? Math.round(parseFloat(componentData.itemPrice)) : 0;
	document.getElementById('componentItemCd').value = currentlyEditingComponentState.subItemCd || (componentData.itemCd || '');
	document.getElementById('componentItemNm').value = currentlyEditingComponentState.subItemNm || (componentData.itemNm || '');
	document.getElementById('componentUnitNm').value = currentlyEditingComponentState.unitNm || '';
	document.getElementById('componentUseQty').value = currentlyEditingComponentState.useQty;
	document.getElementById('componentLossRt').value = currentlyEditingComponentState.lossRt;
	document.getElementById('componentRemark').value = currentlyEditingComponentState.remark || '';
	document.getElementById('editingComponentBomIdx').value = currentlyEditingComponentState.bomIdx || '';
	document.getElementById('editingComponentSubItemIdx').value = currentlyEditingComponentState.subItemIdx || '';
	calculateAndDisplayComponentLineCost();
}

function calculateAndDisplayComponentLineCost() {
	const useQtyInput = document.getElementById('componentUseQty');
	const lossRtInput = document.getElementById('componentLossRt');
	const lineAmountDisplayField = document.getElementById('componentItemPrice');
	let useQty = parseFloat(useQtyInput.value) || 0;
	let lossRt = parseFloat(lossRtInput.value) || 0;
	const masterCost = currentlyEditingComponentState.subItemMasterCost || 0;
	if (useQty < 0) { useQtyInput.value = 0; useQty = 0; }
	if (lossRt < 0) { lossRtInput.value = 0; lossRt = 0; }
	if (lossRt >= 100) { lossRtInput.value = 99.99; lossRt = 99.99; }
	let calculatedAmount = 0;
	if (masterCost > 0) {
		const effectiveLossRate = lossRt / 100;
		if (effectiveLossRate < 1 && (1 - effectiveLossRate) !== 0) {
			calculatedAmount = (useQty / (1 - effectiveLossRate)) * masterCost;
		}
	}
	const roundedAmount = Math.round(calculatedAmount);
	if (lineAmountDisplayField) lineAmountDisplayField.value = roundedAmount;
	currentlyEditingComponentState.itemPrice = roundedAmount;
	if (currentlyEditingComponentState.subItemIdx) {
		const rowInBomTab5 = findComponentInBomTab5(currentlyEditingComponentState.subItemIdx);
		if (rowInBomTab5) {
			const itemPriceCellInput = rowInBomTab5.querySelector('.bom5-item-price');
			if (itemPriceCellInput) itemPriceCellInput.value = roundedAmount;
		}
	}
}

function updateLineDataFromBom5Input(inputElement, subItemIdx, fieldName, isPriceField = false) {
	let value = inputElement.type === 'number' ? parseFloat(inputElement.value) : inputElement.value;
	if (inputElement.type === 'number' && isNaN(value)) value = 0;
	const targetRow = findComponentInBomTab5(subItemIdx);
	if (!targetRow) return;
	if (Number(document.getElementById('editingComponentSubItemIdx').value) === subItemIdx) {
		if (fieldName === 'useQty') { document.getElementById('componentUseQty').value = value; currentlyEditingComponentState.useQty = value; }
		if (fieldName === 'lossRt') { document.getElementById('componentLossRt').value = value; currentlyEditingComponentState.lossRt = value; }
		if (fieldName === 'remark') { document.getElementById('componentRemark').value = value; currentlyEditingComponentState.remark = value; }
		if (fieldName === 'itemPrice' && isPriceField) { document.getElementById('componentItemPrice').value = value; currentlyEditingComponentState.itemPrice = Math.round(value); }
		if (fieldName === 'useQty' || fieldName === 'lossRt') { calculateAndDisplayComponentLineCost(); }
	} else {
		if (fieldName === 'useQty' || fieldName === 'lossRt') {
			const currentUseQty = (fieldName === 'useQty') ? value : parseFloat(targetRow.querySelector('.bom5-use-qty').value) || 0;
			const currentLossRt = (fieldName === 'lossRt') ? value : parseFloat(targetRow.querySelector('.bom5-loss-rt').value) || 0;
			let masterCostForThisRow = (allRawMaterialsForSelection.find(i => i.itemIdx === subItemIdx) || {}).itemCost || 0;
			let newPrice = 0;
			if (masterCostForThisRow > 0 && (1 - currentLossRt / 100) > 0) { newPrice = (currentUseQty / (1 - currentLossRt / 100)) * masterCostForThisRow; }
			const priceInputInRow = targetRow.querySelector('.bom5-item-price');
			if (priceInputInRow) priceInputInRow.value = Math.round(newPrice);
		}
	}
}

async function handleBomSave() {
	const selectedParentRadio = document.querySelector('input[name="parent-item-select"]:checked');
	if (!selectedParentRadio) { alert("상위 품목을 선택하세요."); return; }
	const parentItemId = Number(selectedParentRadio.value);
	if (!parentItemId || isNaN(parentItemId)) { alert("선택된 상위 품목의 ID가 유효하지 않습니다."); return; }
	const bomSaveRequest = {
		parentItemIdx: parentItemId,
		parentCycleTime: parseFloat(document.getElementById('modalParentCycleTime').value) || null,
		parentRemark: document.getElementById('modalParentRemark').value,
		components: []
	};
	const rows = document.querySelectorAll('#bomDetailTbody tr:not(:has(td.nodata))');
	let isValidForSave = true;
	rows.forEach((row, index) => {
		const subItemIdx = Number(row.dataset.subItemIdx);
		if (!subItemIdx || isNaN(subItemIdx)) { isValidForSave = false; return; }
		const useQtyInput = row.querySelector('.bom5-use-qty');
		const lossRateInput = row.querySelector('.bom5-loss-rt');
		const itemPriceInput = row.querySelector('.bom5-item-price');
		const remarkInput = row.querySelector('.bom5-remark');
		if (useQtyInput && lossRateInput && itemPriceInput && remarkInput) {
			bomSaveRequest.components.push({
				subItemIdx: subItemIdx, useQty: parseFloat(useQtyInput.value) || 0,
				lossRate: parseFloat(lossRateInput.value) || 0, itemPrice: parseFloat(itemPriceInput.value) || 0,
				remark: remarkInput.value || '', seqNo: index + 1
			});
		} else { isValidForSave = false; }
	});
	if (!isValidForSave || bomSaveRequest.components.length === 0) { alert("BOM 데이터에 오류가 있거나 하위 품목이 없습니다."); return; }
	try {
		const response = await fetch(`/api/bom/save`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bomSaveRequest)
		});
		if (response.ok) {
			alert('BOM이 성공적으로 등록되었습니다.'); closeModal('modal'); loadMainBomSummaryList();
		} else {
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			alert(`BOM 등록 실패: ${errorData.message || '서버 오류'}`);
		}
	} catch (error) { console.error('BOM 등록 오류:', error); alert('BOM 등록 중 오류가 발생했습니다.'); }
}

async function handleBomUpdate() {
	if (!originalParentItemIdForUpdate) { alert("수정할 대상 BOM이 선택되지 않았습니다."); return; }
	const bomUpdateRequest = {
		parentCycleTime: parseFloat(document.getElementById('modalParentCycleTime').value) || null,
		parentRemark: document.getElementById('modalParentRemark').value,
		components: []
	};
	const rows = document.querySelectorAll('#bomDetailTbody tr:not(:has(td.nodata))');
	let isValidForUpdate = true;
	rows.forEach((row, index) => {
		const subItemIdx = Number(row.dataset.subItemIdx);
		const useQtyInput = row.querySelector('.bom5-use-qty');
		const lossRateInput = row.querySelector('.bom5-loss-rt');
		const itemPriceInput = row.querySelector('.bom5-item-price');
		const remarkInput = row.querySelector('.bom5-remark');
		if (!subItemIdx || isNaN(subItemIdx) || !useQtyInput || !lossRateInput || !itemPriceInput || !remarkInput) {
			isValidForUpdate = false; return;
		}
		bomUpdateRequest.components.push({
			subItemIdx, useQty: parseFloat(useQtyInput.value) || 0,
			lossRate: parseFloat(lossRateInput.value) || 0, itemPrice: parseFloat(itemPriceInput.value) || 0,
			remark: remarkInput.value || '', seqNo: index + 1
		});
	});
	if (!isValidForUpdate) { alert("BOM 데이터에 오류가 있어 수정을 진행할 수 없습니다."); return; }
	if (bomUpdateRequest.components.length === 0) { alert("하위 자재가 없으므로 BOM을 삭제합니다."); }
	try {
		const response = await fetch(`/api/bom/${originalParentItemIdForUpdate}`, {
			method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bomUpdateRequest)
		});
		if (response.ok) {
			alert('BOM이 성공적으로 수정(또는 삭제)되었습니다.'); closeModal('modal'); loadMainBomSummaryList();
		} else {
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			alert(`BOM 수정 실패: ${errorData.message}`);
		}
	} catch (error) { console.error('BOM 수정 오류:', error); alert('BOM 수정 중 오류가 발생했습니다.'); }
}

function handleDragStart(e) {
	draggedRow = this.closest('tr');
	if (!draggedRow) { e.preventDefault(); return; }
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', draggedRow.dataset.subItemIdx);
	setTimeout(() => { draggedRow.classList.add('dragging'); }, 0);
}
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleDragEnter(e) { e.preventDefault(); if (this !== draggedRow && !this.querySelector('td.nodata')) { this.classList.add('over'); } }
function handleDragLeave(e) { this.classList.remove('over'); }
function handleDrop(e) {
	e.stopPropagation(); e.preventDefault();
	if (draggedRow === this || this.querySelector('td.nodata') || !draggedRow) { this.classList.remove('over'); return false; }
	const rect = this.getBoundingClientRect(); const dropY = e.clientY - rect.top;
	if (dropY < this.offsetHeight / 2) { this.parentNode.insertBefore(draggedRow, this); }
	else { this.parentNode.insertBefore(draggedRow, this.nextSibling); }
	this.classList.remove('over'); return false;
}
function handleDragEnd(e) {
	document.querySelectorAll('#bomDetailTbody tr').forEach(row => { row.classList.remove('over', 'dragging'); });
	updateBomTab5RowNumbers(); draggedRow = null;
}

function handleParentItemSelection(selectedRadio) {
	const selectedItemIdx = Number(selectedRadio.value);
	const selectedProduct = allProductsForSelection.find(item => item.itemIdx === selectedItemIdx);
	if (selectedProduct) {
		document.getElementById('modalParentItemCd').value = selectedProduct.itemCd || '';
		document.getElementById('modalParentItemNm').value = selectedProduct.itemNm || '';
	} else {
		document.getElementById('modalParentItemCd').value = '';
		document.getElementById('modalParentItemNm').value = '';
	}
}

// 분류/단위 관리 모달 열기 함수 (기존 코드에 있어야 함, 없으면 추가)
function openCategoryModal() {
	document.getElementById('modal-category').style.display = 'flex';
	// loadCategories(); // bomCategory.js 에 있어야 함
}
function openSpecModal() {
	document.getElementById('modal-spec').style.display = 'flex';
	// loadUnits(); // bomUnit.js 에 있어야 함
}


