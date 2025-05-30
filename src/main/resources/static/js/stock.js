	// --- 전역 변수 ---
	const pageSize = 10;
	let currentPage = 1;
	let totalPages = 1;
	let currentSortTh = null;
	let currentSortOrder = 'desc';
	let allItemBasicInfos = []; 
	
	// --- DOM 요소 참조 변수 ---
	let itemTableBody, noDataRow,
	    prevPageButton, nextPageButton, currentPageInput,
	    totalCountSpan, currentPageSpan,
	    itemFlagSelect, searchItemText, searchButton,
	    deleteBtn, checkallItemCheckbox;
	    // excelDownBtn; // 엑셀 버튼은 현재 코드에서 제외
	
	// --- Helper Functions ---
	function setInputValue(form, name, value) {
	    const element = form.querySelector(`[name="${name}"]`);
	    if (element) {
	        if (element.type === 'date' && value) {
	            try {
	                let dateStr = value.toString();
	                if (dateStr.includes('T')) dateStr = dateStr.substring(0, 10);
	                else if (dateStr.length > 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr.substring(0,10))) dateStr = dateStr.substring(0, 10);
	                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) element.value = dateStr;
	                else {
	                   const d = new Date(value);
	                   element.value = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
	                }
	            } catch (e) { element.value = ''; console.error("Error formatting date for name " + name + ":", value, e); }
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
	
	// --- 데이터 로딩 및 테이블 렌더링 ---
	async function fetchItems(page, itemFlag = null, keyword = null, sortProperty = null, sortDirection = null) {
	    currentPage = page;
	    const currentItemFlag = itemFlagSelect ? itemFlagSelect.value : ""; // HTML의 itemFlagSelect 사용
	    const currentKeyword = searchItemText ? searchItemText.value.trim() : "";
	
	    // URL 생성 시, searchKeyword는 함수 파라미터 keyword를 사용합니다.
	    let url = `/api/stocks?page=${page - 1}&size=${pageSize}`; // API 경로 확인!
	
	    if (itemFlag) { // itemFlagSelect에서 직접 받은 값 사용
	        url += `&itemFlagFilter=${encodeURIComponent(itemFlag)}`;
	    }
	    if (keyword && keyword.trim() !== "") { // 함수 파라미터 keyword 사용
	        url += `&searchKeyword=${encodeURIComponent(keyword.trim())}`;
	    }
	
	    if (sortProperty && sortDirection) {
	        url += `&sort=${encodeURIComponent(sortProperty)},${encodeURIComponent(sortDirection)}`;
	    } else if (currentSortTh && currentSortTh.dataset.sortProperty && currentSortOrder) {
	         url += `&sort=${encodeURIComponent(currentSortTh.dataset.sortProperty)},${encodeURIComponent(currentSortOrder)}`;
	    }
	
	    try {
	        const response = await fetch(url);
	        if (!response.ok) { // API 호출 자체가 실패한 경우 (404, 500 등)
	            // JAVASCRIPT 수정: 구체적인 오류 메시지 표시
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
	            items.forEach(item => {
	                const row = itemTableBody.insertRow();
	                row.style.cursor = 'pointer';
	                row.dataset.item = JSON.stringify(item);
	                row.addEventListener('click', (event) => {
	                    if (event.target.type !== 'checkbox' && event.target.closest('td') !== row.cells[0]) {
	                        openModal(item);
	                    }
	                });
	                const checkboxCell = row.insertCell();
	                const checkbox = document.createElement('input');
	                checkbox.type = 'checkbox';
	                checkbox.classList.add('item-checkbox');
	                checkbox.dataset.invIdx = item.invIdx;
					
					checkbox.addEventListener('click', (e) => {
					    e.stopPropagation();
					    updateCheckAllItemState(); // 개별 체크박스 클릭 시 전체 체크박스 상태 업데이트
					});
	                checkboxCell.appendChild(checkbox);
					
	                row.insertCell().textContent = item.itemCd || "";
	                row.insertCell().textContent = item.itemNm || "";
	                row.insertCell().textContent = item.qty === null || item.qty === undefined ? "0" : item.qty;
	                row.insertCell().textContent = item.inv === null || item.inv === undefined ? "" : item.inv;
	                row.insertCell().textContent = item.whNm || "";
	                row.insertCell().textContent = item.unitNm || "";
	            });
	            if (checkallItemCheckbox) updateCheckAllItemState();
	        } else { // items.length === 0
	            if (noDataRow) noDataRow.style.display = 'none'; // 기존 noDataRow는 숨김
	            let message = "조회된 데이터가 없습니다.";
	            // JAVASCRIPT 수정: 검색어가 있었는데 결과가 없으면 다른 메시지
	            if (currentKeyword.trim() !== "") { // 함수 호출 시 전달된 keyword 사용
	                message = `"${currentKeyword}"에 해당하는 자재/품목명이 존재하지 않습니다.`;
	            }
	            // JAVASCRIPT 수정: colspan 대신 grid-column 스타일 사용 및 메시지 적용
	            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">${message}</td></tr>`;
	            totalPages = 1;
	            if (currentPageSpan) currentPageSpan.textContent = `1/1페이지`;
	            if (currentPageInput) currentPageInput.value = 1;
	            if (prevPageButton) prevPageButton.disabled = true;
	            if (nextPageButton) nextPageButton.disabled = true;
	        }
	    } catch (error) {
	        console.error("데이터 조회 중 오류:", error);
	        if (itemTableBody) {
	            // JAVASCRIPT 수정: colspan 대신 grid-column 스타일 사용
	            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>`;
	        }
	        if (totalCountSpan) totalCountSpan.textContent = '총 0건';
	        if (currentPageSpan) currentPageSpan.textContent = '1/1페이지';
	        if (prevPageButton) prevPageButton.disabled = true;
	        if (nextPageButton) nextPageButton.disabled = true;
	        if (currentPageInput) currentPageInput.value = 1;
	    }
	}
	
	// --- 페이지 로드 시 실행 ---
	document.addEventListener('DOMContentLoaded', () => {
	    itemTableBody = document.getElementById('itembody');
	    noDataRow = document.getElementById('Noitem');
	
	    prevPageButton = document.getElementById('btn-prev-page');
	    nextPageButton = document.getElementById('btn-next-page');
		currentPageInput = document.getElementById('currentPageInput'); // HTML ID 확인
	   totalCountSpan = document.getElementById('totalCountSpan');     // HTML ID 확인
	   currentPageSpan = document.getElementById('currentPageSpan');   // HTML ID 확인
	    
	    itemFlagSelect = document.getElementById('itemFlagSelect');
	    searchItemText = document.getElementById('searchItemText');
	    searchButton = document.getElementById('searchButton');
	    deleteBtn = document.getElementById('deleteBtn');
	    checkallItemCheckbox = document.getElementById('checkallItem');
	    // excelDownBtn = document.getElementById('excelBtn'); // 필요시 ID 할당
	
		if (checkallItemCheckbox) {
		        checkallItemCheckbox.addEventListener('change', function() {
		            const itemCheckboxes = itemTableBody.querySelectorAll('input.item-checkbox');
		            itemCheckboxes.forEach(checkbox => {
		                checkbox.checked = this.checked;
		            });
		        });
		    }
			
	    fetchItems(1);
		
		const itemNmSelectInput = document.getElementById('item_NM_select');
		if (itemNmSelectInput) {
		    itemNmSelectInput.addEventListener('input', function(event) {
		        const selectedValueFromInput = event.target.value; // 사용자가 입력/선택한 "품목명 (품목코드)"
		        const form = document.getElementById('modalForm');
				const selectedItemIdxHiddenInput = form.querySelector('input[name="selected_item_idx"]');
				const itemCdDisplayInput = form.querySelector('input[name="item_CD_display"]'); // 품목코드 표시용 input
				const itemFlagModalSelect = form.querySelector('select[name="item_FLAG"]');     // 모달 내 품목/자재 구분 select

		        // Datalist의 <option>의 value와 직접 비교
		        const matchedOption = Array.from(document.getElementById('itemListDatalist').options).find(
		            opt => opt.value === selectedValueFromInput // "품목명 (품목코드)" 형식과 비교
		        );

				if (matchedOption && matchedOption.dataset.itemIdx) { // 데이터리스트에서 정확히 선택한 경우
	                const selectedItemIdx = parseInt(matchedOption.dataset.itemIdx);
	                if (selectedItemIdxHiddenInput) selectedItemIdxHiddenInput.value = selectedItemIdx;

	                // allItemBasicInfos 배열에서 해당 itemIdx의 전체 정보 찾기
	                const selectedItemInfo = allItemBasicInfos.find(info => info.itemIdx === selectedItemIdx);

	                if (selectedItemInfo) {
	                    console.log("Datalist에서 선택된 품목 정보:", selectedItemInfo);
	                    if (itemCdDisplayInput) itemCdDisplayInput.value = selectedItemInfo.itemCd || ''; // 품목코드 자동 표시
						//if (itemCdHiddenInput) itemCdHiddenInput.value = selectedItemInfo.itemCd || ''; // hidden item_CD 에도 설정
		                //if (itemNmHiddenInput) itemNmHiddenInput.value = selectedItemInfo.itemNm || '';

	                    // JAVASCRIPT 수정: 선택된 품목 정보로 모달의 다른 필드 자동 채우기
	                    setInputValue(form, 'item_COST', formatCurrencyKR(selectedItemInfo.itemCost));
	                    setInputValue(form, 'optimal_INV', selectedItemInfo.optimalInv);
	                    setInputValue(form, 'item_SPEC', selectedItemInfo.itemSpec); // HTML에 name="item_SPEC" 필요
	                    
	                    // 단위 <select> 자동 선택 (selectedItemInfo.unitIdx 사용)
	                    const unitSelect = form.querySelector('select[name="item_UNIT"]');
	                    if (unitSelect && selectedItemInfo.unitIdx !== undefined) {
	                        unitSelect.value = selectedItemInfo.unitIdx;
	                    } else if (unitSelect) {
	                        unitSelect.value = ""; // 해당하는 단위 정보가 없으면 초기화
	                    }

	                    // 매입처 <select> 자동 선택 (selectedItemInfo.custIdx 사용)
	                    const custSelect = form.querySelector('select[name="cust_NM"]');
	                    if (custSelect && selectedItemInfo.custIdx !== undefined) {
	                        custSelect.value = selectedItemInfo.custIdx;
	                    } else if (custSelect) {
	                        custSelect.value = ""; // 해당하는 매입처 정보가 없으면 초기화
	                    }
	                    
	                    // 품목/자재 구분 <select> 자동 선택 (selectedItemInfo.itemFlag 사용)
	                    if (itemFlagModalSelect && selectedItemInfo.itemFlag) {
	                        itemFlagModalSelect.value = selectedItemInfo.itemFlag;
	                        // itemFlagModalSelect.disabled = true; // 선택된 품목에 귀속된 정보이므로 수정 불가 처리 가능
	                    }
	                    // 수량(qty) 필드는 사용자가 직접 입력해야 하므로 여기서는 비워두거나 기본값(예: 0) 설정
	                    // setInputValue(form, 'qty', '0'); 
	                    // 창고(wh_idx) 필드도 사용자가 선택하도록 둡니다.
	                }
				} else { // Datalist에 없는 값을 사용자가 직접 입력한 경우 (완전히 새로운 품목으로 간주할지 여부 결정)
					if (selectedItemIdxHiddenInput) selectedItemIdxHiddenInput.value = ''; // 선택된 품목 ID 없음
	                if (itemCdDisplayInput) itemCdDisplayInput.value = ''; // 품목코드 표시칸 비움 (또는 자동생성 로직 연동)
					if (itemNmHiddenInput) itemNmHiddenInput.value = '';
	                // 다른 필드들(단가, 적정재고 등)도 사용자가 직접 입력하도록 비워두거나 기본값으로 설정
	                setInputValue(form, 'item_COST', formatCurrencyKR(''));
	                setInputValue(form, 'optimal_INV', '');
	                setInputValue(form, 'item_SPEC', '');
	                if (itemFlagModalSelect) itemFlagModalSelect.value = ''; // 분류도 초기화 또는 기본값
	                // 단위, 매입처 등도 초기화
	                const unitSelect = form.querySelector('select[name="item_UNIT"]');
	                if (unitSelect) unitSelect.value = '';
	                const custSelect = form.querySelector('select[name="cust_NM"]');
	                if (custSelect) custSelect.value = '';
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
		        searchButton.addEventListener('click', function() {
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
                    console.error('삭제 중 오류 발생:', error);
                    alert('삭제 처리 중 오류가 발생했습니다: ' + error.message);
	                }
	            }
	        });
	    }
	    
	    if (itemTableBody) { /* ... (이전과 동일) ... */ }
	    // 엑셀 버튼 리스너 (필요시 구현)
	});
	
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
	async function openModal(item = null) { // item은 StockDto
	    const modal = document.getElementById('modal');
	    const title = document.getElementById('modalTitle');
	    const form = document.getElementById('modalForm');
	    if (!modal || !title || !form) return;
	    form.reset();
		
		
		const itemCdDisplayInput = form.querySelector('input[name="item_CD_display"]');
		const itemCdHiddenInput = form.querySelector('input[name="item_CD"]'); // << 이 선언이 중요!
		const itemNmSelectInput = form.querySelector('input[name="item_NM_select"]');
		const selectedItemIdxHiddenInput = form.querySelector('input[name="selected_item_idx"]');
		const itemNmHiddenInput = form.querySelector('input[name="item_NM"]'); // 순수 품목명 hidden input
		const itemFlagModalSelect = form.querySelector('select[name="item_FLAG"]'); // 품목 분류 select
		
		const saveButton = form.querySelector('button[name="save"]');
		const editButton = form.querySelector('button[name="edit"]');
		console.log("모달 오픈 시 전달된 item 객체:", JSON.stringify(item, null, 2)); // item 전체 내용 확인
		if (item) { // 이 if 블록은 itemCdHiddenInput 선언과 무관해야 합니다.
		    console.log("전달된 품목 ID (item.itemIdx):", item.itemIdx);
		    console.log("전달된 창고 ID (item.whIdx):", item.whIdx);
		    console.log("전달된 단위 ID (item.unitIdx):", item.unitIdx);
		    console.log("전달된 매입처 ID (item.custIdxForItem):", item.custIdxForItem);
		}
		
		try {
		    const unitIdToLoad = item ? item.unitIdx : null;
		    const custIdToLoad = item ? item.custIdxForItem : null; // 또는 item.custIdx
		    const whIdToLoad = item ? item.whIdx : null;

		    await Promise.all([
		        loadAndSetUnits(unitIdToLoad),
		        loadAndSetCustomers(custIdToLoad),
		        loadAndSetWarehouses(whIdToLoad)
		    ]);
		} catch (e) {
		    console.error("모달 내 드롭다운 로딩 중 오류:", e);
		    // 여기서 오류 발생 시 이후 로직이 영향을 받을 수 있으므로, 사용자에게 알림 필요
		}
	    if (item) { // 수정 모드
			title.textContent = '재고 정보 수정'; // 화면명에 맞게 수정
	        if (saveButton) saveButton.style.display = 'none';
	        if (editButton) editButton.style.display = 'block';

			if (itemCdHiddenInput) itemCdHiddenInput.value = item.itemCd || "";
	        // item 객체는 StockDto의 필드를 가지고 있어야 함
	        if (itemCdDisplayInput) {
	            itemCdDisplayInput.value = item.itemCd || "";
	            itemCdDisplayInput.readOnly = true;
	        }
	        if (itemNmSelectInput) { // 수정 시에는 품목명 직접 수정이 아니라, 선택된 품목의 정보를 보여줌
	            itemNmSelectInput.value = `${item.itemNm || ''} (${item.itemCd || ''})`;
	            itemNmSelectInput.readOnly = true; // 수정 모드에서는 품목명(선택)을 바꾸지 못하게 할 수 있음
	        }
	        if (selectedItemIdxHiddenInput) selectedItemIdxHiddenInput.value = item.itemIdx || '';
	        
			setInputValue(form, 'item_NM', item.itemNm);
			setInputValue(form, 'item_FLAG', item.itemFlag);
			setInputValue(form, 'item_IDX', item.itemIdx);
			// setInputValue(form, 'item_CD_display', item.itemCd); // 위에서 직접 처리
			setInputValue(form, 'inv_IDX', item.invIdx);
			// setInputValue(form, 'item_NM', item.itemNm); // item_NM_select 또는 item_NM_display 사용
			setInputValue(form, 'item_COST', formatCurrencyKR(item.itemCost));
			setInputValue(form, 'optimal_INV', item.inv);
			setInputValue(form, 'item_SPEC', item.itemSpec);
			setInputValue(form, 'remark', item.reMark || item.remark);
			setInputValue(form, 'qty', item.qty);
			setInputValue(form, 'user_NM', item.userNm);
			setInputValue(form, 'user_TEL', item.userTel);
			setInputValue(form, 'user_MAIL', item.userMail);

			if (editButton) {
			    const newEditButton = editButton.cloneNode(true);
			    editButton.parentNode.replaceChild(newEditButton, editButton);
			    newEditButton.addEventListener('click', (e) => {
			        e.preventDefault();
			        console.log("수정 버튼 클릭 시 전달되는 item.itemIdx:", item.itemIdx);
			        if (item.itemIdx === null || item.itemIdx === undefined) {
			            alert("오류: 수정할 품목의 ID가 없습니다. (item.itemIdx is null or undefined)");
			            return;
			        }
			        updateItem(item.itemIdx); // 또는 item.invIdx 등 실제 수정 대상의 ID
			    });
			}
	    } else { // 신규 등록 모드
	        title.textContent = '신규 재고 등록';
	        if (saveButton) saveButton.style.display = 'block';
	        if (editButton) editButton.style.display = 'none';
			
			if (itemNmSelectInput) itemNmSelectInput.readOnly = false;
			    if (selectedItemIdxHiddenInput) selectedItemIdxHiddenInput.value = '';
			    if (itemCdDisplayInput) {
			        itemCdDisplayInput.value = '';
			        itemCdDisplayInput.readOnly = true;
			    }
				
			if (itemCdHiddenInput) { // null 체크 후 접근
			    itemCdHiddenInput.value = ''; // 신규 등록 시 hidden 품목코드도 초기화
			} else {
			    console.warn("Hidden input 'item_CD'를 찾을 수 없습니다.");
			}
			setInputValue(form, 'item_COST', formatCurrencyKR('')); // 빈 값 또는 0원
			setInputValue(form, 'optimal_INV', '');
			setInputValue(form, 'item_SPEC', '');
			setInputValue(form, 'remark', '');
			
			
		    if (itemFlagModalSelect) itemFlagModalSelect.value = '';
			
			try {
			        await loadAndSetItemDatalist();
			    } catch (e) {
			        console.error("신규 등록 모드 - 드롭다운/데이터리스트 로드 중 오류(openModal 내부):", e);
			    }
	        if (saveButton) {
	            const newSaveButton = saveButton.cloneNode(true);
	            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
	            newSaveButton.addEventListener('click', submitModal);
	        }
	    }
	    modal.style.display = 'flex';
	}
	
	function closeModal() { 
	    const modal = document.getElementById('modal'); 
	    if (modal) modal.style.display = 'none';
	}
	function outsideClick(e) { if (e.target.id === 'modal') closeModal(); }
	
	async function submitModal(event) { // 신규 등록
	    event.preventDefault();
	    const form = document.getElementById('modalForm');
	    const formData = new FormData(form);
	    const formProps = Object.fromEntries(formData.entries());
	
	    const payload = {
			itemIdxToRegi: formProps.selected_item_idx ? parseInt(formProps.selected_item_idx) : null,
		    whIdx: formProps.wh_idx ? parseInt(formProps.wh_idx) : null,
		    qty: formProps.qty ? parseFloat(formProps.qty) : 0, // 수량은 parseFloat 권장
			
/*	        itemCd: formProps.item_CD,
	        itemNm: formProps.item_NM,
	        itemSpec: formProps.item_SPEC,
	        remark: formProps.remark,
	        custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
	        unitIdx: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null, // DTO에 itemUnitId가 있다면
	        optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
	        itemCost: rawItemCost,
	        itemFlag: currentItemFlagValue, // 선택된 itemFlag 값 사용
*/
	        
	    };
	    console.log("신규 재고 데이터:", payload);
	
		if (payload.itemIdxToRegi === null) { alert("품목을 선택해주세요."); return; }
		if (payload.whIdx === null) { alert("창고를 선택해주세요."); return; }
		if (payload.qty <= 0) { alert("수량은 0보다 커야 합니다."); return; }
	    // ... 추가 유효성 검사 ...
	
	    try {
	        const response = await fetch(`/api/stocks`, { // JAVASCRIPT 수정: API 경로를 /api/stock/items 등으로 변경 필요
	            method: 'POST',
	            headers: { 'Content-Type': 'application/json' },
	            body: JSON.stringify(payload)
	        });
	        if (response.ok) {
	            alert('새 품목이 등록되었습니다.');
	            closeModal();
	            fetchItems(1); 
	        } else {
	            const errorData = await response.json().catch(() => ({ message: '등록 중 오류 발생' }));
	            alert(`품목 등록 실패: ${errorData.message || response.statusText}`);
	        }
	    } catch (error) {
	        console.error('품목 등록 API 호출 오류:', error);
	        alert('품목 등록 중 오류가 발생했습니다.');
	    }
	}
	
	async function updateItem(itemIdx) { // 수정
	    const form = document.getElementById('modalForm');
	    const formData = new FormData(form);
	    const formProps = Object.fromEntries(formData.entries());
	    const rawItemCost = unformatCurrencyKR(formProps.item_COST);
	
	    const payload = {
	        itemNm: formProps.item_NM,
	        itemSpec: formProps.item_SPEC,
	        remark: formProps.remark,
	        custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
	        unitIdx: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null,
	        optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
	        itemCost: rawItemCost,
	        itemFlag: formProps.item_FLAG, // 모달 폼에 name="item_FLAG" (hidden 또는 select) 필요
	        qty: formProps.qty ? parseInt(formProps.qty) : undefined,
	        whIdx: formProps.wh_idx ? parseInt(formProps.wh_idx) : null
	    };
	    console.log(`수정 품목 데이터 (ID: ${itemIdx}):`, payload);
	
	    try {
	        const response = await fetch(`/api/stocks/${itemIdx}`, { // JAVASCRIPT 수정: API 경로를 /api/stock/items/{itemIdx} 등으로 변경 필요
	            method: 'PUT',
	            headers: { 'Content-Type': 'application/json' },
	            body: JSON.stringify(payload)
	        });
	        if (response.ok) {
	            alert('품목 정보가 수정되었습니다.');
	            closeModal();
	            fetchItems(currentPage);
	        } else {
	            const errorData = await response.json().catch(() => ({ message: '수정 중 오류 발생' }));
	            alert(`품목 수정 실패: ${errorData.message || response.statusText}`);
	        }
	    } catch (error) {
	        console.error('품목 수정 API 호출 오류:', error);
	        alert('품목 수정 중 오류가 발생했습니다.');
	    }
	}
	
	// --- 드롭다운 로드 함수들 (실제 API 호출 로직으로 채워야 함) ---
	async function createItemCD(itemCodeInputElement) {
	    if (!itemCodeInputElement) return;
	    // 예시: const response = await fetch(`/api/items/generate-item-cd`); const data = await response.text();
	    const tempCd = "ITEM" + Math.floor(Math.random() * 9000 + 1000); 
	    itemCodeInputElement.value = tempCd;
	    itemCodeInputElement.readOnly = true; // 자동 생성 후 수정 불가 처리
	    console.log(`임시 품목 코드 생성: ${tempCd}. 실제 API 연동 필요.`);
	}
	async function loadAndSetItemDatalist() {
	    const datalistElement = document.getElementById('itemListDatalist');
	    const itemNmSelectElement = document.getElementById('item_NM_select'); // 품목명 입력/선택 필드
		if (!datalistElement || !itemNmSelectElement) {
		       console.error("Datalist 또는 품목명 선택 input 요소를 찾을 수 없습니다.");
		       return;
		   }
	    datalistElement.innerHTML = ''; // 초기화
	    itemNmSelectElement.value = ''; // 입력 필드 초기화
	
	    try {
	        const response = await fetch('/api/stocks/item-basics'); // 백엔드 API 호출
	        if (!response.ok) throw new Error('품목 기본 정보 로드 실패');
	        allItemBasicInfos = await response.json(); // [{itemIdx, itemCd, itemNm, itemCost, ...}, ...]
	
	        allItemBasicInfos.forEach(item => {
				const option = document.createElement('option');
                option.value = `${item.itemNm} (${item.itemCd})`; // Datalist에 표시될 값 (예: "토마토 스파게티 (P001)")
                option.dataset.itemIdx = item.itemIdx; // 실제 선택 시 사용할 품목 ID를 dataset에 저장
                datalistElement.appendChild(option);
	        });
	    } catch (error) {
	        console.error("품목 기본 정보 로드 중 오류:", error);
	    }
	}
	
	
	
	
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
	        console.error("단위 목록 로드 중 오류:", error);
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
	        console.error("매입처 목록 로드 중 오류:", error);
	        // 사용자에게 오류 알림 (필요시)
	    }
	}
	
	async function loadAndSetWarehouses(selectedWhId = null) {
	    const whSelectElement = document.querySelector('#modalForm select[name="wh_idx"]');
	    if (!whSelectElement) {
	        console.error("Warehouse select element with name 'wh_idx' not found!");
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
	        console.error("창고 목록 로드 중 오류:", error);
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
	            default: console.warn(`정렬 속성 알 수 없음: ${headerText}`); return;
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