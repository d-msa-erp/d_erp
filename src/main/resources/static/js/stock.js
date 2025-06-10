// --- 전역 변수 ---
const pageSize = 10;
let currentPage = 1;
let totalPages = 1;
let currentSortTh = null;
let currentSortOrder = 'desc';
let allItemBasicInfos = [];
let previouslyReceivedItems = [];

// --- DOM 요소 참조 변수 ---
let itemTableBody, noDataRow,
    prevPageButton, nextPageButton, currentPageInput,
    totalCountSpan, currentPageSpan,
    itemFlagSelect, searchItemText, searchButton,
    deleteBtn, checkallItemCheckbox;

// --- Helper Functions ---
function setInputValue(form, name, value) {
    const element = form.querySelector(`[name="${name}"]`);
    if (element) {
        if (element.type === 'date' && value) {
            try {
                let dateStr = value.toString();
                if (dateStr.includes('T')) dateStr = dateStr.substring(0, 10);
                else if (dateStr.length > 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr.substring(0,10))) dateStr = dateStr.substring(0, 10);
                
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                     element.value = dateStr;
                } else {
                   const d = new Date(value);
                   if (!isNaN(d.getTime())) {
                        element.value = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
                   } else {
                        element.value = '';
                   }
                }
            } catch (e) { element.value = ''; }
        } else {
            element.value = (value === null || value === undefined) ? '' : value;
        }
    }
}

function formatCurrencyKR(value) {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return "";
    return parseFloat(value).toLocaleString('ko-KR') + "원";
}

function unformatCurrencyKR(formattedValue) {
    if (typeof formattedValue !== 'string') {
        const num = parseFloat(formattedValue);
        return isNaN(num) ? null : num;
    }
    const numericString = formattedValue.replace(/[원,]/g, "");
    const numValue = parseFloat(numericString);
    return isNaN(numValue) ? null : numValue;
}

function downloadStockAsExcel() {
    

    const itemTableBody = document.getElementById('itembody');
    if (!itemTableBody) {
        alert("재고 목록 테이블을 찾을 수 없습니다.");
        
        return;
    }
    

    const selectedStockRowsData = [];
    const allStockRows = itemTableBody.querySelectorAll('tr');
    let hasActualDataRow = false;
    let programmaticallyCheckedCount = 0; // 스크립트가 'checked'로 인식한 체크박스 수

    

    allStockRows.forEach((row, rowIndex) => {
        // '데이터 없음' 메시지 행인지 확인 (<tr><td class="nodata">...</td></tr> 구조)
        const firstCell = row.cells[0];
        if (firstCell && firstCell.classList.contains('nodata') && row.cells.length === 1) {
            
            return;
        }
        hasActualDataRow = true;

        // 각 행의 체크박스 (class="item-checkbox" 사용)
        const checkbox = row.querySelector('input.item-checkbox');

        if (!checkbox) {
            // 'nodata' 행이 아닌데 체크박스가 없는 경우는 HTML 구조 문제일 수 있습니다.
            // fetchItems 함수에서 각 데이터 행의 첫 번째 셀에 .item-checkbox를 추가하는지 확인하세요.
            
        } else {
            
            if (checkbox.checked === true) { // 명시적으로 true와 비교
                programmaticallyCheckedCount++;
                const rowData = [];
                const cells = row.cells;
                // 첫 번째 셀(체크박스 셀)을 제외하고 데이터를 추출 (i=1부터 시작)
                for (let i = 1; i < cells.length; i++) {
                    rowData.push(cells[i].textContent);
                }
                selectedStockRowsData.push(rowData);
                
            }
        }
    });

    

    // 유효성 검사 1: 실제 데이터 행이 없는 경우
    if (!hasActualDataRow) {
        alert("재고 목록이 비어있습니다. 엑셀로 내보낼 데이터가 없습니다.");
        
        return;
    }

    // 유효성 검사 2: 데이터 행은 있으나, 선택된 항목이 없는 경우
    if (selectedStockRowsData.length === 0) {
        alert("재고 목록에서 내보낼 항목을 하나 이상 선택(체크)해주세요.");
        
        return;
    }
    
    

    try {
        // --- 1. 재고 목록 데이터 준비 ---
        const stockDataForExcel = [];
        stockDataForExcel.push(["■ 재고 현황"]); 

        const stockTableHeaders = [];
        const thead = itemTableBody.previousElementSibling;
        if (thead && thead.tagName === 'THEAD' && thead.rows.length > 0) {
            const headerCells = thead.rows[0].cells;
            for (let i = 1; i < headerCells.length; i++) { 
                stockTableHeaders.push(headerCells[i].textContent.replace(/[↓↑]/g, '').trim());
            }
            stockDataForExcel.push(stockTableHeaders);
        } else {
            stockDataForExcel.push(["자재/품목코드", "자재/품목명", "수량", "적정재고", "창고명", "단위"]);
            
        }

        selectedStockRowsData.forEach(rowData => {
            stockDataForExcel.push(rowData);
        });

        // --- 2. 워크시트 생성 및 스타일 적용 ---
        const ws = XLSX.utils.aoa_to_sheet(stockDataForExcel);

        const headerCellStyle = {
            fill: { fgColor: { rgb: "E0E0E0" } },
            font: { bold: true, sz: 11, name: "맑은 고딕" },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
            }
        };
        const sectionTitleStyle = {
            font: { bold: true, sz: 13, name: "맑은 고딕" },
            alignment: { vertical: "center" }
        };

        function applyStyleToCell(rowIndex, colIndex, style, cellValue) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            if (!ws[cellAddress]) ws[cellAddress] = { v: cellValue };
            else ws[cellAddress].v = cellValue;
            ws[cellAddress].s = style;
        }

        function applyStyleToRow(rowIndex, style) {
            if (stockDataForExcel[rowIndex]) {
                stockDataForExcel[rowIndex].forEach((cellValue, colIndex) => {
                    applyStyleToCell(rowIndex, colIndex, style, cellValue);
                });
            }
        }

        const titleRowIndex = 0;
        applyStyleToCell(titleRowIndex, 0, sectionTitleStyle, stockDataForExcel[titleRowIndex][0]);
        const headerColumnCount = (stockDataForExcel[titleRowIndex + 1] || []).length;
        if (!ws['!merges']) ws['!merges'] = [];
        if (headerColumnCount > 0) {
            ws['!merges'].push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: headerColumnCount - 1 } });
        }

        const stockHeaderRowIndex = 1;
        applyStyleToRow(stockHeaderRowIndex, headerCellStyle);

        const colsWidth = [];
        stockDataForExcel.forEach(dataRow => {
            dataRow.forEach((cell, colIndex) => {
                let cellLength = 10;
                if (cell) {
                    const koreanRegex = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
                    const koreanChars = (String(cell).match(koreanRegex) || []).length;
                    const otherChars = String(cell).length - koreanChars;
                    cellLength = koreanChars * 2 + otherChars + 3;
                }
                if (!colsWidth[colIndex] || colsWidth[colIndex].wch < cellLength) {
                    colsWidth[colIndex] = { wch: cellLength };
                }
            });
        });
        ws['!cols'] = colsWidth;

        // --- 3. 워크북 생성 및 다운로드 ---
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "재고 현황");
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const fileName = `재고현황_${dateString}.xlsx`;
        XLSX.writeFile(wb, fileName);
        

    } catch (error) {
        
        alert("엑셀 파일을 생성하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
}
	
// --- 데이터 로딩 및 테이블 렌더링 ---
async function fetchItems(page, itemFlag = null, keyword = null, sortProperty = null, sortDirection = null) {
    currentPage = page;
    // const currentItemFlag = itemFlagSelect ? itemFlagSelect.value : ""; // itemFlagSelect는 메인 화면에 없음
    const currentKeyword = searchItemText ? searchItemText.value.trim() : "";

    let url = `/api/stocks?page=${page - 1}&size=${pageSize}`;

	const currentItemFlagFromSelect = itemFlagSelect ? itemFlagSelect.value : "";
	    const flagToUse = itemFlag !== null ? itemFlag : currentItemFlagFromSelect;

		
		if (flagToUse && flagToUse !== "") {
		    // 👇 파라미터 이름을 'itemFlagFilter'으로 변경
		    url += `&itemFlagFilter=${encodeURIComponent(flagToUse)}`;
		}
		
		const keywordToUse = keyword !== null ? keyword.trim() : currentKeyword;
		if (keywordToUse && keywordToUse !== "") {
		    url += `&searchKeyword=${encodeURIComponent(keywordToUse)}`;
		}

    if (sortProperty && sortDirection) {
        url += `&sort=${encodeURIComponent(sortProperty)},${encodeURIComponent(sortDirection)}`;
    } else if (currentSortTh && currentSortTh.dataset.sortProperty && currentSortOrder) {
         url += `&sort=${encodeURIComponent(currentSortTh.dataset.sortProperty)},${encodeURIComponent(currentSortOrder)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. URL: ${url}`);
        }
        const pageData = await response.json();

        if (!itemTableBody) return;
        itemTableBody.innerHTML = '';

        const items = pageData.content || [];
        const totalElements = pageData.totalElements || 0;
        totalPages = pageData.totalPages || Math.ceil(totalElements / pageSize) || 1;
        currentPage = pageData.number !== undefined ? pageData.number + 1 : page;

        if (totalCountSpan) totalCountSpan.textContent = `총 ${totalElements}건`;
        if (currentPageSpan) currentPageSpan.textContent = `${currentPage}/${totalPages}페이지`;
        if (prevPageButton) prevPageButton.disabled = currentPage === 1;
        if (nextPageButton) nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
        if (currentPageInput) currentPageInput.value = currentPage;

        if (items.length > 0) {
            if (noDataRow) noDataRow.style.display = 'none';
            items.forEach(item => { // item은 StockDto (재고 현황 DTO)
                const row = itemTableBody.insertRow();
                row.style.cursor = 'pointer';
                row.dataset.item = JSON.stringify(item);
                row.addEventListener('click', (event) => {
                    if (event.target.type !== 'checkbox' && event.target.closest('td') !== row.cells[0]) {
                        openModal(item); // 재고 항목 수정 시 StockDto 전달
                    }
                });
                const checkboxCell = row.insertCell();
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('item-checkbox');
                checkbox.dataset.invIdx = item.invIdx; // TB_INVENTORY의 PK 또는 재고 식별 ID

                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateCheckAllItemState();
                });
                checkboxCell.appendChild(checkbox);

                row.insertCell().textContent = item.itemCd || "";
                row.insertCell().textContent = item.itemNm || "";
                row.insertCell().textContent = item.qty === null || item.qty === undefined ? "0" : item.qty;
                row.insertCell().textContent = item.inv === null || item.inv === undefined ? "" : item.inv; // 품목 마스터의 적정재고
                row.insertCell().textContent = item.whNm || "";
                row.insertCell().textContent = item.unitNm || "";
            });
            if (checkallItemCheckbox) updateCheckAllItemState();
        } else {
            if (noDataRow) noDataRow.style.display = 'none';
            let message = "조회된 데이터가 없습니다.";
            if (currentKeyword.trim() !== "") {
                message = `"${currentKeyword}"에 해당하는 검색 결과가 없습니다.`;
            }

            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">${message}</td></tr>`;

            totalPages = 1;
            if (currentPageSpan) currentPageSpan.textContent = `1/1페이지`;
            if (currentPageInput) currentPageInput.value = 1;
            if (prevPageButton) prevPageButton.disabled = true;
            if (nextPageButton) nextPageButton.disabled = true;
        }
    } catch (error) {
        
        if (itemTableBody) {
            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>`;
        }
        // ... (오류 시 UI 초기화)
    }
	

}
	
async function loadAllItemMasterData() {
    if (allItemBasicInfos.length > 0 && allItemBasicInfos[0].itemIdx) return;

    try {
        const response = await fetch('/api/stocks/item-basics');
        if (!response.ok) throw new Error('품목 마스터 정보 로드 실패: ' + response.statusText);
        allItemBasicInfos = await response.json();
        
        if (allItemBasicInfos.length === 0) {
            
        } else if (!allItemBasicInfos[0].itemIdx) {
             
        }
    } catch (error) {
        
        allItemBasicInfos = [];
    }
}
	
async function loadPreviouslyReceivedItemsForDatalist() {
    const datalistElement = document.getElementById('itemListDatalist');
    const itemNmSelectElement = document.getElementById('item_NM_select');
    if (!datalistElement || !itemNmSelectElement) return;

    datalistElement.innerHTML = '';
    itemNmSelectElement.placeholder = "품목 정보 로딩 중...";

    try {
        const response = await fetch('/api/inv-transactions?transType=R&size=500&sort=transDate,desc');
        if (!response.ok) throw new Error('과거 입고 거래 정보 로드 실패: ' + response.statusText);
        const pageData = await response.json();
        const transactions = pageData.content || [];

        const uniqueItemsMap = new Map();
        transactions.forEach(trx => {
            if (trx.itemIdx && trx.itemNm && trx.itemCd) {
                if (!uniqueItemsMap.has(trx.itemIdx)) {
                    uniqueItemsMap.set(trx.itemIdx, {
                        itemIdx: trx.itemIdx,
                        itemNm: trx.itemNm,
                        itemCd: trx.itemCd,
						transQty: trx.transQty 
                    });
                }
            }
        });
        previouslyReceivedItems = Array.from(uniqueItemsMap.values());

        if (previouslyReceivedItems.length > 0) {
            previouslyReceivedItems.forEach(item => {
                const option = document.createElement('option');
                option.value = `${item.itemNm} (${item.itemCd})`;
                option.dataset.itemIdx = item.itemIdx;
				if (item.transQty !== null && item.transQty !== undefined) {
                    option.dataset.transQty = item.transQty; 
                }
                datalistElement.appendChild(option);
            });
            itemNmSelectElement.placeholder = "품목명을 입력하거나 선택하세요";
        } else {
            itemNmSelectElement.placeholder = "참조할 입고 품목이 없습니다.";
        }
    } catch (error) {
        
        itemNmSelectElement.placeholder = "품목 정보 로드 실패";
        previouslyReceivedItems = [];
    }
}
	
// --- 페이지 로드 시 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    itemTableBody = document.getElementById('itembody');
    noDataRow = document.getElementById('Noitem');
	const excelDownBtn = document.getElementById('excelBtn');
    prevPageButton = document.getElementById('btn-prev-page');
    nextPageButton = document.getElementById('btn-next-page');
    currentPageInput = document.getElementById('currentPageInput');
    totalCountSpan = document.getElementById('totalCountSpan');
    currentPageSpan = document.getElementById('currentPageSpan');

    // itemFlagSelect는 메인 검색 영역에 현재 없으므로 null 체크 후 사용 또는 제거
    itemFlagSelect = document.getElementById('itemFlagSelect');
    searchItemText = document.getElementById('searchItemText');
    searchButton = document.getElementById('searchButton');
    deleteBtn = document.getElementById('deleteBtn');
    checkallItemCheckbox = document.getElementById('checkallItem');
	
	if (checkallItemCheckbox) {
	    checkallItemCheckbox.addEventListener('change', function() {
	        
	        const itemCheckboxes = itemTableBody.querySelectorAll('input.item-checkbox');
	        
	        itemCheckboxes.forEach(checkbox => {
	            checkbox.checked = this.checked;
	        });
	    });
	} else {
	    
	}

    fetchItems(1);
    loadAllItemMasterData();

    const itemNmSelectInput = document.getElementById('item_NM_select');
    const modalForm = document.getElementById('modalForm');

    if (itemNmSelectInput && modalForm) {
        itemNmSelectInput.addEventListener('input', function(event) {
            const selectedValueFromDatalist = event.target.value;
            const matchedOption = Array.from(document.getElementById('itemListDatalist').options).find(
                opt => opt.value === selectedValueFromDatalist
            );

            if (matchedOption && matchedOption.dataset.itemIdx) {
                const selectedItemIdx = parseInt(matchedOption.dataset.itemIdx);
                const itemMasterInfo = allItemBasicInfos.find(info => info.itemIdx === selectedItemIdx);

                if (itemMasterInfo) {
                    setInputValue(modalForm, 'selected_item_idx', itemMasterInfo.itemIdx);
                    setInputValue(modalForm, 'item_NM', itemMasterInfo.itemNm);
                    const itemCdDisplayInput = modalForm.querySelector('input[name="item_CD_display"]');
                    if (itemCdDisplayInput) itemCdDisplayInput.value = itemMasterInfo.itemCd || '';
                    setInputValue(modalForm, 'item_COST', formatCurrencyKR(itemMasterInfo.itemCost));
                    setInputValue(modalForm, 'optimal_INV', itemMasterInfo.optimalInv);
                    const unitSelect = modalForm.querySelector('select[name="item_UNIT"]');
                    if (unitSelect && itemMasterInfo.unitIdx !== undefined) unitSelect.value = itemMasterInfo.unitIdx;
                    else if (unitSelect) unitSelect.value = "";
                    const custSelect = modalForm.querySelector('select[name="cust_NM"]');
                    const defaultCustId = itemMasterInfo.custIdx; // 품목마스터의 custIdx가 기본 매입처로 가정
                    if (custSelect && defaultCustId !== undefined) custSelect.value = defaultCustId;
                    else if (custSelect) custSelect.value = "";
					const originalTransQty = matchedOption.dataset.transQty;
                    if (originalTransQty !== undefined) {
                        
                        setInputValue(modalForm, 'qty', originalTransQty);
                    } else {
                        setInputValue(modalForm, 'qty', ''); // 과거 거래 수량 정보 없으면 빈 값
                    }
                } else {
                    resetItemSpecificFields(modalForm);
                }
            } else {
                setInputValue(modalForm, 'selected_item_idx', ''); // 일치 항목 없으면 선택된 품목 ID 없음
            }
        });
    }
			
		if (prevPageButton) {
		        prevPageButton.addEventListener('click', () => {
		            if (currentPage > 1) {
		                // 현재 필터와 검색어 값을 가져옵니다.
		                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
		                const keyword = searchItemText ? searchItemText.value.trim() : "";
		                fetchItems(currentPage - 1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
		            }
		        });
		    }
		    if (nextPageButton) {
		        nextPageButton.addEventListener('click', () => {
		            if (currentPage < totalPages) {
		                // 현재 필터와 검색어 값을 가져옵니다.
		                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
		                const keyword = searchItemText ? searchItemText.value.trim() : "";
		                fetchItems(currentPage + 1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
		            }
		        });
		    }
		    if (currentPageInput) {
		        currentPageInput.addEventListener('change', function() {
		            const pageNumber = parseInt(this.value);
		            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
		                // 현재 필터와 검색어 값을 가져옵니다.
		                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
		                const keyword = searchItemText ? searchItemText.value.trim() : "";
		                fetchItems(pageNumber, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
		            } else {
		                alert('유효한 페이지 번호를 입력하세요.');
		                this.value = currentPage; // 잘못된 입력 시 현재 페이지로 복원
		            }
		        });
		    }
	    
		if (searchButton) {
		        searchButton.addEventListener('click', function(event) {
					event.preventDefault();
		            // JAVASCRIPT 수정: 검색 버튼 클릭 시 itemFlagSelect와 searchItemText의 현재 값을 사용
		            const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
		            const keyword = searchItemText ? searchItemText.value.trim() : "";
		            //fetchItems(1, flagFilter, keyword); // 첫 페이지로, 필터와 키워드 전달
					fetchItems(1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder); 
		        });
		    }
	    if (searchItemText) {
	        searchItemText.addEventListener('keypress', function(event) {
	            if (event.key === 'Enter') {
	                event.preventDefault();
	                if (searchButton) searchButton.click();
	            }
	        });
	    }
	
	    if (deleteBtn) {
	        deleteBtn.addEventListener('click',async function() {
	            const checkedItemsIdx = [];
	            if (!itemTableBody) return;
				
	            itemTableBody.querySelectorAll('input.item-checkbox:checked').forEach(checkbox => {
	                if(checkbox.dataset.invIdx) {
						checkedItemsIdx.push(parseInt(checkbox.dataset.invIdx));
					}
	            });
	
	            if (checkedItemsIdx.length === 0) {
	                alert('삭제할 항목을 선택해주세요.'); return;
	            }
	            if (confirm(`선택된 ${checkedItemsIdx.length}개 항목을 정말 삭제하시겠습니까?`)) {
					try{
						const response = await fetch(`/api/stocks/delete`, { // 실제 API 경로로 수정
	                        method: 'DELETE', // 또는 POST (백엔드 구현에 따라)
	                        headers: { 'Content-Type': 'application/json' },
	                        body: JSON.stringify(checkedItemsIdx) // 삭제할 invIdx 목록 전달
	                    });
						
						if (response.ok) {
	                        // 성공적으로 텍스트 응답을 기대하는 경우 (예: "삭제되었습니다.")
	                        const message = await response.text();
	                        alert(message || `${checkedItemsIdx.length}개 재고가 삭제되었습니다.`);
	                    } else {
	                        // 오류 응답이 JSON 형태일 경우
	                        const errorData = await response.json().catch(() => ({ message: `삭제 실패 (상태: ${response.status})` }));
	                        throw new Error(errorData.message || `재고 삭제에 실패했습니다. 상태 코드: ${response.status}`);
	                    }
						
						const visibleRows = Array.from(itemTableBody.querySelectorAll('tr:not([style*="display: none"])')).length;
		                let pageToFetch = currentPage;
		                if (visibleRows === checkedItemsIdx.length && currentPage > 1) { // invIdxsToDelete로 변경
		                    pageToFetch = currentPage - 1;
		                }
		                // 목록 새로고침 시 필터 및 정렬 조건 유지
		                fetchItems(pageToFetch, itemFlagSelect.value, searchItemText.value.trim(), currentSortTh?.dataset.sortProperty, currentSortOrder);
		                if (checkallItemCheckbox) {
		                    checkallItemCheckbox.checked = false;
		                }
				}catch (error) {
                    
                    alert('삭제 처리 중 오류가 발생했습니다: ' + error.message);
	                }
	            }
	        });
	    }
		
		if (excelDownBtn) { // excelDownBtn 요소가 존재하는지 확인
		        excelDownBtn.addEventListener('click', function() {
		            // 전역 또는 DOMContentLoaded 스코프에서 올바르게 할당된 변수 사용
		            const exCsearchCat = itemFlagSelect ? itemFlagSelect.value : ""; // itemFlagSelect 사용 (존재 여부 확인)
		            const exCsearchItem = searchItemText ? searchItemText.value.trim() : ""; // searchItemText 사용 (존재 여부 확인)

		            

		            let downUrl = `/api/stocks/excel`;
		            const params = new URLSearchParams();

		            if (exCsearchCat && exCsearchCat.trim() !== '') {
		                params.append('CsearchCat', exCsearchCat);
		            }
		            if (exCsearchItem && exCsearchItem.trim() !== '') {
		                params.append('CsearchItem', exCsearchItem);
		            }

		            if (params.toString()) {
		                downUrl += '?' + params.toString();
		            }

		            
		            window.open(downUrl, '_blank'); // 새 창 또는 탭에서 다운로드 시도
		        });
		    } else {
		        
		    }
	    
		if (itemTableBody) {
	        // JAVASCRIPT 수정: colspan 대신 grid-column 스타일 사용
	        itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>`;
	    }
	    // 엑셀 버튼 리스너 (필요시 구현)
	});
	
	function resetItemSpecificFields(form) {
	    if (!form) return;
	    setInputValue(form, 'selected_item_idx', '');
	    setInputValue(form, 'item_NM', '');
	    const itemCdDisplayInput = form.querySelector('input[name="item_CD_display"]');
	    if (itemCdDisplayInput) itemCdDisplayInput.value = '';
	    setInputValue(form, 'item_COST', formatCurrencyKR(''));
	    setInputValue(form, 'optimal_INV', '');
	    const unitSelect = form.querySelector('select[name="item_UNIT"]');
	    if (unitSelect) unitSelect.value = '';
	    const custSelect = form.querySelector('select[name="cust_NM"]');
	    if (custSelect) custSelect.value = '';
	    setInputValue(form, 'qty', '');
	}
	
	function updateCheckAllItemState() {
	    if (!itemTableBody || !checkallItemCheckbox) return; // 요소 없으면 실행 중단

	    const itemCheckboxes = itemTableBody.querySelectorAll('input.item-checkbox');
	    const totalCheckboxes = itemCheckboxes.length;
	    const checkedCount = Array.from(itemCheckboxes).filter(checkbox => checkbox.checked).length;

	    if (totalCheckboxes > 0) { // 데이터 행이 있을 때만 로직 실행
	        if (checkedCount === totalCheckboxes) {
	            checkallItemCheckbox.checked = true;

	        } else if (checkedCount > 0) {
	            checkallItemCheckbox.checked = false;

	        } else {
	            checkallItemCheckbox.checked = false;

	        }
	    } else { // 데이터 행이 없으면 전체 선택 체크박스 해제
	        checkallItemCheckbox.checked = false;
	    }
	}
	
	// --- 모달 관련 함수들 ---
	async function openModal(item = null) {
	    const modal = document.getElementById('modal');
	    const title = document.getElementById('modalTitle');
	    const form = document.getElementById('modalForm');
	    if (!modal || !title || !form) return;
	    form.reset();

	    const saveButton = form.querySelector('button[name="save"]');
	    const editButton = form.querySelector('button[name="edit"]');

	    const itemNmSelectInput = form.querySelector('input[name="item_NM_select"]');
	    const itemCdDisplayInput = form.querySelector('input[name="item_CD_display"]');
		const qtyInput = form.querySelector('input[name="qty"]');
	    const itemCostInput = form.querySelector('input[name="item_COST"]');
	    const optimalInvInput = form.querySelector('input[name="optimal_INV"]');
	    const whSelect = form.querySelector('select[name="wh_idx"]');
	    const unitSelect = form.querySelector('select[name="item_UNIT"]');
	    const custSelect = form.querySelector('select[name="cust_NM"]');
	    const userNmInput = form.querySelector('input[name="user_NM"]');
	    const remarkInput = form.querySelector('input[name="remark"]');
	     

	    if (item && item.invIdx !== undefined) { // 수정 모드 (메인 테이블 재고 항목 클릭 시, invIdx로 식별)
	        title.textContent = '재고 정보 수정';
            
            if (itemCdDisplayInput) itemCdDisplayInput.readOnly = true;
	        if (itemNmSelectInput) itemNmSelectInput.readOnly = true;
            if (itemCostInput) itemCostInput.readOnly = true;            
            if (optimalInvInput) optimalInvInput.readOnly = true;
            if (whSelect) whSelect.disabled = true;
            if (qtyInput) qtyInput.readOnly = true;   
            if (unitSelect) unitSelect.disabled = true;          
            if (custSelect) custSelect.disabled = true;
            if (userNmInput) userNmInput.readOnly = true;
            if (remarkInput) remarkInput.readOnly = true;
            


                
	        
	        setInputValue(form, 'selected_item_idx', item.itemIdx);
	        setInputValue(form, 'item_NM', item.itemNm);
	        if (itemCdDisplayInput) itemCdDisplayInput.value = item.itemCd || '';
	        if (itemNmSelectInput) itemNmSelectInput.value = item.itemNm ? `${item.itemNm} (${item.itemCd || ''})` : '';

	        const masterInfo = allItemBasicInfos.find(m => m.itemIdx === item.itemIdx);
	        setInputValue(form, 'item_COST', formatCurrencyKR(masterInfo ? masterInfo.itemCost : (item.unitPrice || ''))); // StockDto에 unitPrice가 있을 수 있음
	        setInputValue(form, 'qty', item.qty);
	        setInputValue(form, 'optimal_INV', masterInfo ? masterInfo.optimalInv : (item.inv || ''));
	        setInputValue(form, 'remark', item.remark || '');
			setInputValue(form, 'user_NM', item.userNm || '');       // 담당자 이름 (StockDto의 userNm)
	        setInputValue(form, 'user_TEL', item.userTel || '');     // 담당자 전화번호 (StockDto의 userTel)
	        setInputValue(form, 'user_MAIL', item.userMail || '');   // 담당자 이메일 (StockDto의 userMail)
	        await Promise.all([
	            loadAndSetUnits(item.unitIdx || (masterInfo ? masterInfo.unitIdx : null)),
	            loadAndSetCustomers(item.custIdx || (masterInfo ? masterInfo.custIdx : null)),
	            loadAndSetWarehouses(item.whIdx)
	        ]);


	    }
	    modal.style.display = 'flex';
	}
	window.openModal = openModal;

	function closeModal() { modal.style.display = 'none'; }
	function outsideClick(e) { if (e.target.id === 'modal') closeModal(); }

	async function submitModal(event) { // 신규 재고를 TB_INVENTORY에 등록
	    event.preventDefault();
	    const form = document.getElementById('modalForm');
	    const formData = new FormData(form);
	    const formProps = Object.fromEntries(formData.entries());

	    const payload = {
	        itemIdx: formProps.selected_item_idx ? parseInt(formProps.selected_item_idx) : null,
	        whIdx: formProps.wh_idx ? parseInt(formProps.wh_idx) : null,
	        qty: formProps.qty ? parseFloat(formProps.qty) : 0,
	        unitPrice: unformatCurrencyKR(formProps.item_COST),
	        remark: formProps.remark,
	    };
	    

	    if (payload.itemIdx === null) { alert("품목을 선택해주세요."); return; }
	    if (payload.whIdx === null) { alert("창고를 선택해주세요."); return; }
	    if (payload.qty <= 0) { alert("입고 수량은 0보다 커야 합니다."); return; }

	    try {
	        // API 경로 수정: TB_INVENTORY 직접 등록용 API (예: /api/stocks/inventory)
	        const response = await fetch(`/api/stocks`, {
	            method: 'POST',
	            headers: { 'Content-Type': 'application/json' },
	            body: JSON.stringify(payload)
	        });
	        if (response.ok) {
	            const resultText = await response.text();
	            try {
	                 const resultJson = JSON.parse(resultText);
	                 alert(resultJson.message || '재고가 성공적으로 등록되었습니다.');
	            } catch (e) {
	                 alert(resultText || '재고가 성공적으로 등록되었습니다.');
	            }
	            closeModal();
	            fetchItems(1);
	        } else {
	            const errorData = await response.json().catch(() => ({ message: '등록 중 알 수 없는 오류 발생' }));
	            alert(`재고 등록 실패: ${errorData.message || response.statusText}`);
	        }
	    } catch (error) {
	        
	        alert('재고 등록 처리 중 오류가 발생했습니다.');
	    }
	}
	
	async function openModalWithTransactionDetails(invTransIdx) {
	    const modal = document.getElementById('modal');
	    const title = document.getElementById('modalTitle');
	    const form = document.getElementById('modalForm');
	    if (!modal || !title || !form) return;
	    form.reset(); // 폼 초기화

	    const saveButton = form.querySelector('button[name="save"]');
	    const editButton = form.querySelector('button[name="edit"]');

	    try {
	        // 1. invTransIdx로 거래 상세 정보 조회 (VInvTransactionDetailsDto 예상)
	        const response = await fetch(`/api/inv-transactions/${invTransIdx}`);
	        if (!response.ok) {
	            const errorData = await response.json().catch(() => ({ message: `거래 정보를 불러오는데 실패했습니다. (ID: ${invTransIdx}, 상태: ${response.status})` }));
	            alert(errorData.message);
	            return;
	        }
	        const trxDetails = await response.json(); // VInvTransactionDetailsDto

	        // 2. 모달 제목 및 버튼 상태 설정 (수정 모드)
	        title.textContent = '입/출고 거래 정보 수정';
	        if (saveButton) saveButton.style.display = 'none';
	        if (editButton) editButton.style.display = 'block';

	        // 3. 드롭다운 데이터 로드 및 해당 거래 값으로 선택
	        //    VInvTransactionDetailsDto 필드를 사용하여 각 드롭다운의 초기 선택값 설정
	        await Promise.all([
	            loadAndSetUnits(null, trxDetails.itemUnitNm), // 단위 (이름으로 선택 시도) 또는 trxDetails.unitIdx 등 DTO 필드 활용
	            loadAndSetCustomers(trxDetails.custIdx, trxDetails.transType === 'R' ? '01' : '02'), // 거래처
	            loadAndSetWarehouses(trxDetails.whIdx), // 창고
	            loadAndSetUsers(trxDetails.userIdx) // 담당자 (모달에 user_idx select 필요)
	        ]);
	         // 거래일자 필드 설정 (모달에 <input type="date" name="transDate"> 필요)
	        const transDateInput = form.querySelector('input[name="transDate"]');
	        if (transDateInput && trxDetails.transDate) {
	             setInputValue(form, 'transDate', trxDetails.transDate); // YYYY-MM-DD 형식으로 변환 필요시 수행
	        }


	        // 4. 나머지 폼 필드 채우기 (VInvTransactionDetailsDto 기반)
	        const transTypeSelect = form.querySelector('select[name="transType"]');
	        if (transTypeSelect) {
	            transTypeSelect.value = trxDetails.transType === 'R' ? '01' : (trxDetails.transType === 'S' ? '02' : '');
	            // transTypeSelect.disabled = true; // 필요시 거래 유형 수정 불가
	        }

	        setInputValue(form, 'item_CD_display', trxDetails.itemCd);
	        form.querySelector('input[name="item_CD_display"]').readOnly = true;
	        const itemNmSelectInput = form.querySelector('input[name="item_NM_select"]');
	        if (itemNmSelectInput) {
	            itemNmSelectInput.value = `${trxDetails.itemNm} (${trxDetails.itemCd})`;
	            itemNmSelectInput.readOnly = true; // 수정 시 품목 자체 변경 불가
	        }
	        setInputValue(form, 'selected_item_idx', trxDetails.itemIdx); // hidden
	        setInputValue(form, 'item_NM', trxDetails.itemNm); // hidden

	        setInputValue(form, 'item_COST', formatCurrencyKR(trxDetails.unitPrice));
	        setInputValue(form, 'qty', trxDetails.transQty);
	        setInputValue(form, 'remark', trxDetails.invTransRemark);
	        // HTML 모달에 name="transStatus" 필드가 있다면 해당 값 설정
	        // setInputValue(form, 'transStatus', trxDetails.transStatus);

	        // 담당자 이름은 userIdx로 select가 채워지면 자동으로 표시되거나, 별도 필드라면 직접 설정
	        setInputValue(form, 'user_NM', trxDetails.userNm); // (만약 user_idx select와 별개로 표시한다면)

	        // 수정 버튼에 이벤트 리스너 연결 (중복 방지)
	        if (editButton) {
	            const newEditButton = editButton.cloneNode(true);
	            editButton.parentNode.replaceChild(newEditButton, editButton);
	            newEditButton.addEventListener('click', async (e) => {
	                e.preventDefault();
	                await executeUpdateTransaction(trxDetails.invTransIdx); // 수정 API 호출
	            });
	        }
	        modal.style.display = 'flex';
	    } catch (error) {
	        
	        alert("거래 정보를 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
	        closeModal();
	    }
	}

	async function handleOpenModalForExistingTransactionSelection() {
	    const modal = document.getElementById('modal');
	    const title = document.getElementById('modalTitle');
	    const form = document.getElementById('modalForm');
	    if (!modal || !title || !form) return;
	    form.reset(); // 모든 필드 초기화

	    title.textContent = '기존 입고 거래 선택'; // 모달 제목 변경

	    // 등록/수정 버튼 일단 숨김
	    const saveButton = form.querySelector('button[name="save"]');
	    const editButton = form.querySelector('button[name="edit"]');
	    if (saveButton) saveButton.style.display = 'none';
	    if (editButton) editButton.style.display = 'none';

	    // 다른 입력 필드 비활성화 또는 숨김 처리 (선택적)
	    // 예: form.querySelector('input[name="qty"]').readOnly = true;

	    // 입고 거래 데이터리스트 로드
	    await loadAndSetTransactionDatalist();

	    const itemNmSelectInput = form.querySelector('input[name="item_NM_select"]');
	    if (itemNmSelectInput) {
	        itemNmSelectInput.readOnly = false; // 입력 가능하게
	        itemNmSelectInput.value = ''; // 이전 선택값 제거
	        itemNmSelectInput.placeholder = "입고된 품목명을 입력/선택하세요";
	        setTimeout(() => itemNmSelectInput.focus(), 0); // 자동 포커스
	    }
	    modal.style.display = 'flex';
	}


	
	// --- 드롭다운 로드 함수들 (실제 API 호출 로직으로 채워야 함) ---

	
	async function loadAndSetUnits(selectedUnitId = null) {
	    const unitSelectElement = document.querySelector('#modalForm select[name="item_UNIT"]');
	    if (!unitSelectElement) return;
	
	    unitSelectElement.innerHTML = '<option value="">단위를 선택해주세요</option>'; // 초기화
	
	    try {
	        // 실제 단위 목록 API 엔드포인트로 수정해주세요. (예: /api/units)
	        const response = await fetch('/api/stocks/unit'); // 가정된 API 경로
	        if (!response.ok) {
	            throw new Error(`단위 정보 로드 실패: ${response.statusText}`);
	        }
	        const units = await response.json(); // 예: [{ unitIdx: 1, unitNm: "EA" }, ...]
	
	        units.forEach(unit => {
	            const option = document.createElement('option');
	            option.value = unit.unitIdx; // <option value="단위ID">
	            option.textContent = unit.unitNm; // <option>단위명</option>
	            if (selectedUnitId && unit.unitIdx === selectedUnitId) {
	                option.selected = true;
	            }
	            unitSelectElement.appendChild(option);
	        });
	    } catch (error) {
	        
	        // 사용자에게 오류 알림 (필요시)
	    }
	}
	
	async function loadAndSetCustomers(selectedCustId = null) {
	    const custSelectElement = document.querySelector('#modalForm select[name="cust_NM"]');
	    if (!custSelectElement) return;
	
	    custSelectElement.innerHTML = '<option value="">매입처를 선택해주세요</option>'; // 초기화
	
	    try {
	        // 실제 매입처 목록 API 엔드포인트로 수정해주세요. (예: /api/customers?bizFlag=01)
	        const bizFlagForPurchase = '01';
	        const response = await fetch(`/api/stocks/cust?bizFlag=${bizFlagForPurchase}`); // 가정된 API 경로
	        if (!response.ok) {
	            throw new Error(`매입처 정보 로드 실패: ${response.statusText}`);
	        }
	        const customers = await response.json(); // 예: [{ custIdx: 1, custNm: "매입처A" }, ...]
	
	        customers.forEach(customer => {
	            const option = document.createElement('option');
	            option.value = customer.custIdx; // <option value="거래처ID">
	            option.textContent = customer.custNm; // <option>거래처명</option>
	            if (selectedCustId && customer.custIdx === selectedCustId) {
	                option.selected = true;
	            }
	            custSelectElement.appendChild(option);
	        });
	    } catch (error) {
	        
	        // 사용자에게 오류 알림 (필요시)
	    }
	}
	
	async function loadAndSetWarehouses(selectedWhId = null) {
	    const whSelectElement = document.querySelector('#modalForm select[name="wh_idx"]');
	    if (!whSelectElement) {
	        
	        return;
	    }
	
	    whSelectElement.innerHTML = '<option value="">-- 창고를 선택해주세요 --</option>'; // 초기화
	
	    try {
	        // 백엔드에 창고 목록을 가져오는 API 엔드포인트가 필요합니다. (예: /api/warehouses)
	        // 이 API는 GET 요청 시 [{ whIdx: 1, whNm: "창고A" }, ...] 형태의 JSON을 반환해야 합니다.
	        const response = await fetch('/api/stocks/wh'); // (예시 API 경로, 실제 구현된 경로로 수정)
	        if (!response.ok) {
	            const errorText = await response.text();
	            throw new Error(`창고 정보 로드 실패: ${response.status} ${response.statusText} - ${errorText}`);
	        }
	        const warehouses = await response.json();
	
	        warehouses.forEach(wh => {
	            const option = document.createElement('option');
	            option.value = wh.whIdx; // value에는 창고 ID
	            option.textContent = wh.whNm; // 보이는 텍스트는 창고명
	            if (selectedWhId !== null && Number(wh.whIdx) === Number(selectedWhId)) {
	                option.selected = true;
	            }
	            whSelectElement.appendChild(option);
	        });
	    } catch (error) {
	        
	        // 사용자에게 오류 알림 (필요시)
	        whSelectElement.innerHTML += '<option value="" disabled>창고 로딩 실패</option>';
	    }
	}
	
	// 정렬 함수
	let currentTh = null; 
	let currentOrder = 'desc'; 
	function order(thValue) {
	    const tbody = document.getElementById('itembody');
		if (!tbody || !thValue) return;
	    const headerText = thValue.textContent.replace(/[↓↑]/g, '').trim();
	    let sortProperty = thValue.dataset.sortProperty; 
	
	    if (!sortProperty) { // dataset이 없다면 헤더 텍스트 기반으로 추론
	        switch (headerText) {
	            case '자재/품목코드': sortProperty = 'itemCd'; break;
	            case '자재/품목명': sortProperty = 'itemNm'; break;
	            case '수량': sortProperty = 'Qty'; break;
	            case '적정재고': sortProperty = 'Inv'; break; // DTO 필드명 inv
	            case '창고명': sortProperty = 'whNm'; break;
	            case '단위': sortProperty = 'unitNm'; break;
	            default: 
                
                return;
	        }
	        thValue.dataset.sortProperty = sortProperty;
	    }
	
	    if (currentSortTh === thValue) {
	        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
	    } else {
	        if(currentSortTh && currentSortTh.querySelector('a')) currentSortTh.querySelector('a').textContent = '↓';
	        currentSortOrder = 'asc';
	        currentSortTh = thValue;
	    }
	    
	    const arrow = currentSortTh.querySelector('a');
	    if(arrow) arrow.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
	    else { // a 태그가 없다면 동적으로 생성 (최초 클릭 시)
	        const newArrow = document.createElement('a');
	        newArrow.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
	        currentSortTh.appendChild(newArrow);
	    }
	    
	    fetchItems(1, itemFlagSelect?.value, searchItemText?.value.trim(), sortProperty, currentSortOrder);
	}

