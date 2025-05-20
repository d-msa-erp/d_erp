// 전역 변수
let currentTh = null;
let currentSortBy = 'userStatus'; // 초기 정렬 기준 컬럼을 '재직상태'로 설정
let currentOrder = 'desc'; // 초기 정렬 순서
let currentSearchKeyword = ''; // 현재 검색어를 저장할 변수

// 정렬 함수
function order(thElement) {
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => {
		a.textContent = '↓';
		a.style.visibility = 'hidden'; // 모든 화살표를 일단 숨깁니다.
	});

	const newSortBy = thElement.dataset.sortBy;

	if (currentSortBy === newSortBy) {
		currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
		currentOrder = 'asc';
		currentSortBy = newSortBy;
	}

	const arrow = thElement.querySelector('a');
	if (arrow) {
		arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
		arrow.style.visibility = 'visible';
	}

	loadUsersTable(currentSortBy, currentOrder);
}


// 하나의 공유 Modal 열기 함수 (모드와 userIdx를 인자로 받음)
async function openSharedModal(mode, userIdx = null) {
	const modal = document.getElementById('modal');
	const modalTitle = document.getElementById('modalTitle');
	const modalForm = document.getElementById('modalForm');
	const saveButton = modalForm ? modalForm.querySelector('button[name="save"]') : null;
	const editButton = modalForm ? modalForm.querySelector('button[name="edit"]') : null;
	// userIdx를 담을 hidden input 필드
	const userIdxInput = modalForm ? modalForm.querySelector('input[name="userIdx"]') : null;
	const userIdInput = modalForm ? modalForm.querySelector('input[name="userId"]') : null; // ID 입력 필드
	const userPswdInput = modalForm ? modalForm.querySelector('input[name="userPswd"]') : null;


	if (!modal || !modalForm || !modalTitle) {
		console.error('모달 관련 요소를 찾을 수 없습니다.');
		return;
	}

	modalForm.reset();
	if (userIdxInput) userIdxInput.value = ''; // hidden userIdx 필드 초기화
	if (userIdInput) userIdInput.readOnly = false; // ID 필드 수정 가능하게
	if (saveButton) saveButton.style.display = 'none'; // 버튼 숨김
	if (editButton) editButton.style.display = 'none';
	if (userPswdInput) userPswdInput.required = true; // 신규 등록을 위해 기본적으로 required로 설정


	if (mode === 'new') {
		modalTitle.textContent = '신규 사원 등록';
		if (saveButton) saveButton.style.display = 'block'; // 등록 버튼 표시
		if (userIdInput) userIdInput.focus();

	} else if (mode === 'edit' && userIdx !== null) {
		modalTitle.textContent = '사원 수정';
		if (editButton) editButton.style.display = 'block'; // 수정 버튼 표시
		if (userIdInput) userIdInput.readOnly = true; // ID 필드 읽기 전용
		if (userPswdInput) userPswdInput.required = false; // 수정 시 비밀번호는 필수가 아님

		const detailApiUrl = `/api/users/${userIdx}`; // userIdx로 상세 정보 요청
		try {
			const response = await fetch(detailApiUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const userData = await response.json();

			// 모달 폼 필드 채우기
			if (userIdxInput) userIdxInput.value = userData.userIdx || ''; // hidden userIdx 필드에 값 할당
			if (userIdInput) userIdInput.value = userData.userId || '';
			if (userPswdInput) userPswdInput.value = ''; // 비밀번호 필드는 비워둠 (원래 비밀번호 노출 방지)

			const userNmInput = modalForm.querySelector('input[name="userNm"]');
			if (userNmInput) userNmInput.value = userData.userNm || '';
			const userEmailInput = modalForm.querySelector('input[name="userEmail"]');
			if (userEmailInput) userEmailInput.value = userData.userEmail || '';
			const userTelInput = modalForm.querySelector('input[name="userTel"]');
			if (userTelInput) userTelInput.value = userData.userTel || '';
			const userHpInput = modalForm.querySelector('input[name="userHp"]');
			if (userHpInput) userHpInput.value = userData.userHp || '';
			const hireDtInput = modalForm.querySelector('input[name="hireDt"]');
			if (hireDtInput) hireDtInput.value = userData.hireDt || '';
			const retireDtInput = modalForm.querySelector('input[name="retireDt"]');
			if (retireDtInput) retireDtInput.value = userData.retireDt || '';

			const userRoleSelect = modalForm.querySelector('select[name="userRole"]');
			if (userRoleSelect && userData.userRole) userRoleSelect.value = userData.userRole;
			const userDeptSelect = modalForm.querySelector('select[name="userDept"]');
			if (userDeptSelect && userData.userDept) userDeptSelect.value = userData.userDept;
			const userPositionSelect = modalForm.querySelector('select[name="userPosition"]');
			if (userPositionSelect && userData.userPosition) userPositionSelect.value = userData.userPosition;

			if (userData.userStatus) {
				const statusRadios = modalForm.querySelectorAll('input[name="userStatus"][type="radio"]');
				statusRadios.forEach(radio => {
					if (radio.value === userData.userStatus) {
						radio.checked = true;
					} else {
						radio.checked = false;
					}
				});
			}

		} catch (error) {
			console.error('사용자 상세 정보를 불러오는 중 오류 발생:', error);
			alert('사용자 정보를 불러오는데 실패했습니다.');
			closeModal();
			return;
		}
	} else {
		console.error('openSharedModal 함수 호출 오류: 유효하지 않은 모드 또는 userIdx가 누락되었습니다.', mode, userIdx);
		alert('모달을 여는 중 오류가 발생했습니다.');
		return;
	}

	modal.style.display = 'flex';
}


// Modal 닫기 함수
function closeModal() {
	const modal = document.getElementById('modal');
	if (modal) {
		modal.style.display = 'none';
	}
	const modalForm = document.getElementById('modalForm');
	if (modalForm) {
		modalForm.reset();
		const userIdxInput = modalForm.querySelector('input[name="userIdx"]');
		if (userIdxInput) userIdxInput.value = '';
		const userPswdInput = modalForm.querySelector('input[name="userPswd"]');
		if (userPswdInput) userPswdInput.required = true; // 모달 닫을 때 비밀번호 필드의 required 속성 초기화
	}
}

// Modal 외부 클릭 시 닫기 함수
function outsideClick(e) {
	const modal = document.getElementById('modal');
	if (e.target === modal) {
		closeModal();
	}
}

// 유틸리티 함수들
function extractNumbers(inputString) {
	if (typeof inputString !== 'string') {
		return '';
	}
	return inputString.replace(/[^0-9]/g, '');
}

function isValidPhoneNumber(phoneNumber) {
	return phoneNumber.length >= 10;
}

function isValidEmail(email) {
	if (typeof email !== 'string' || email.trim() === '') {
		return false;
	}
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(email);
}


// --- 페이지 로드 후 실행될 코드 ---
document.addEventListener('DOMContentLoaded', () => {
	const userTableBody = document.getElementById('userTableBody');
	const modalForm = document.getElementById('modalForm');

	const userTelInput = document.getElementById('userTelInput');
	const userHpInput = document.getElementById('userHpInput');
	const userEmailInput = document.getElementById('userEmailInput');

	const deleteButton = document.querySelector('.table-wrapper > div:nth-child(1) > div > button:nth-child(3)');

	// 검색 관련 요소들
	const searchInput = document.getElementById('searchInput');
	const searchButton = document.getElementById('searchButton');

	if (userTelInput) {
		userTelInput.addEventListener('input', (event) => {
			event.target.value = extractNumbers(event.target.value);
		});
	}

	if (userHpInput) {
		userHpInput.addEventListener('input', (event) => {
			event.target.value = extractNumbers(event.target.value);
		});
	}


	if (!userTableBody) {
		console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다.");
		return;
	}
	if (!modalForm) {
		console.warn("모달 폼 요소(modalForm)를 찾을 수 없습니다. 폼 관련 기능이 작동하지 않습니다.");
	}
	if (!deleteButton) {
		console.warn("삭제 버튼 요소를 찾을 수 없습니다.");
	}


	const apiUrl = '/api/users';

	async function loadUsersTable(sortBy = currentSortBy, sortDirection = currentOrder) {
		try {
			const url = `${apiUrl}?sortBy=${sortBy}&sortDirection=${sortDirection}`;
			console.log("데이터 로드 URL:", url);

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const users = await response.json();
			userTableBody.innerHTML = '';

			// 초기 로드 또는 정렬 변경 시, 현재 정렬 상태를 UI에 반영
			const initialTh = document.querySelector(`th[data-sort-by="${currentSortBy}"]`);
			if (initialTh) {
				const initialArrow = initialTh.querySelector('a');
				if (initialArrow) {
					initialArrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
					initialArrow.style.visibility = 'visible';
				}
			}

			if (users && users.length > 0) {
				users.forEach(user => {
					const row = document.createElement('tr');
					// ★ 여기에서 data-userIdx 속성을 사용합니다. ★
					row.dataset.userIdx = user.userIdx; // 백엔드에서 넘어오는 user.userIdx 값을 사용
					row.onclick = () => openSharedModal('edit', user.userIdx); // 클릭 시 userIdx 전달

					const checkboxCell = document.createElement('td');
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
					checkbox.addEventListener('click', (event) => {
						event.stopPropagation(); // 체크박스 클릭 시 tr의 onclick 이벤트 방지
					});
					checkboxCell.appendChild(checkbox);
					row.appendChild(checkboxCell);

					const nameCell = document.createElement('td');
					nameCell.textContent = user.userNm || '';
					row.appendChild(nameCell);

					const userIdCell = document.createElement('td');
					userIdCell.textContent = user.userId || '';
					row.appendChild(userIdCell);

					const userTelCell = document.createElement('td');
					userTelCell.textContent = user.userTel || '';
					row.appendChild(userTelCell);

					const userHpCell = document.createElement('td');
					userHpCell.textContent = user.userHp || '';
					row.appendChild(userHpCell);

					const userDeptCell = document.createElement('td');
					userDeptCell.textContent = user.userDept || '';
					row.appendChild(userDeptCell);

					const userPositionCell = document.createElement('td');
					userPositionCell.textContent = user.userPosition || '';
					row.appendChild(userPositionCell);

					const userStatusCell = document.createElement('td');
					const statusCode = user.userStatus;

					let statusText = '';
					if (statusCode === '01') {
						statusText = '재직중';
					} else if (statusCode === '02') {
						statusText = '퇴사';
					} else if (statusCode === '03') {
						statusText = '휴직';
					} else if (statusCode === '04') {
						statusText = '대기';
					} else if (statusCode === '05') {
						statusText = '정직';
					}
					else if (statusCode) {
						statusText = `코드: ${statusCode}`;
					} else {
						statusText = '';
					}
					userStatusCell.textContent = statusText;

					row.appendChild(userStatusCell);
					userTableBody.appendChild(row);
				});
			} else {
				userTableBody.innerHTML = `
					<tr>
						<td class="nodata" style="grid-column: span 8;justify-content: center;">등록된 데이터가 없습니다.</td>
					</tr>
				`;
			}

		} catch (error) {
			console.error('데이터를 불러오는 중 오류가 발생했습니다:', error);
			userTableBody.innerHTML = '';
			const errorRow = document.createElement('tr');
			const errorCell = document.createElement('td');
			errorCell.colSpan = 8; // 8개 컬럼에 맞게 수정
			errorCell.textContent = '데이터 로딩 실패: ' + error.message;
			errorCell.style.color = 'red';
			errorCell.style.textAlign = 'center';
			errorRow.appendChild(errorCell);
			userTableBody.appendChild(errorRow);
		}
	}

	loadUsersTable(currentSortBy, currentOrder);


	// --- 폼 제출 핸들러 ---
	if (modalForm) {
		modalForm.addEventListener('submit', async (event) => {
			event.preventDefault();

			const formData = new FormData(modalForm);
			const userData = Object.fromEntries(formData.entries());

			// 유효성 검사
			if (userData.userTel) {
				if (!isValidPhoneNumber(userData.userTel)) {
					alert('직통번호는 숫자만 포함하여 10자 이상이어야 합니다.');
					if (userTelInput) userTelInput.focus();
					return;
				}
			}
			if (userData.userHp) {
				if (!isValidPhoneNumber(userData.userHp)) {
					alert('휴대폰 번호는 숫자만 포함하여 10자 이상이어야 합니다.');
					if (userHpInput) userHpInput.focus();
					return;
				}
			}

			if (userData.userEmail) {
				if (!isValidEmail(userData.userEmail)) {
					alert('유효한 이메일 주소를 입력해주세요.');
					if (userEmailInput) userEmailInput.focus();
					return;
				}
			}
			if (!userData.userIdx && (!userData.userPswd || userData.userPswd.trim() === '')) {
				alert('신규 등록 시 비밀번호는 필수입니다.');
				modalForm.querySelector('input[name="userPswd"]').focus();
				return;
			}

			const userIdxToProcess = userData.userIdx;

			let method;
			let submitApiUrl;
			let successMessage;
			let errorMessagePrefix;

			if (userIdxToProcess) {
				method = 'PUT';
				submitApiUrl = `${apiUrl}/${userIdxToProcess}`;
				successMessage = '사원 정보가 수정되었습니다.';
				errorMessagePrefix = '사원 수정';
				if (!userData.userPswd || userData.userPswd.trim() === '') {
					delete userData.userPswd; // 비밀번호 필드가 비어있으면 전송하지 않음 (기존 비밀번호 유지)
				}
			} else {
				method = 'POST';
				submitApiUrl = apiUrl;
				successMessage = '신규 사원이 등록되었습니다.';
				errorMessagePrefix = '신규 사원 등록';
				delete userData.userIdx; // 신규 등록 시 userIdx는 서버에서 생성
			}

			console.log(`${errorMessagePrefix} 데이터:`, userData);
			console.log(`API 호출: ${method} ${submitApiUrl}`);

			try {
				const response = await fetch(submitApiUrl, {
					method: method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(userData)
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
				}

				console.log(`${errorMessagePrefix} 성공`);
				alert(successMessage);

				closeModal();
				loadUsersTable(currentSortBy, currentOrder);

			} catch (error) {
				console.error(`${errorMessagePrefix} 중 오류 발생:`, error);
				alert(`${errorMessagePrefix}에 실패했습니다. 오류: ` + error.message);
			}
		});
	} else {
		console.warn("모달 폼 요소(modalForm)를 찾을 수 없습니다. 폼 제출 기능이 작동하지 않습니다.");
	}

	// --- 삭제 버튼 클릭 이벤트 리스너 ---
	if (deleteButton) {
		deleteButton.addEventListener('click', async () => {
			const checkedCheckboxes = document.querySelectorAll('#userTableBody input[type="checkbox"]:checked');
			const userIdxsToDelete = Array.from(checkedCheckboxes).map(checkbox => {
				// 체크박스의 부모 td의 부모 tr에서 data-userIdx 값을 가져옴
				return checkbox.closest('tr').dataset.userIdx;
			});

			if (userIdxsToDelete.length === 0) {
				alert('삭제할 사원을 선택해주세요.');
				return;
			}

			if (!confirm(`${userIdxsToDelete.length}명의 사원을 정말 삭제하시겠습니까?`)) {
				return;
			}

			try {
				// 백엔드 API가 배열을 받는다고 가정
				const response = await fetch(`${apiUrl}/delete`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(userIdxsToDelete) // 삭제할 userIdx 배열 전송
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
				}

				alert('선택된 사원 정보가 성공적으로 삭제되었습니다.');
				loadUsersTable(currentSortBy, currentOrder);

			} catch (error) {
				console.error('사원 삭제 중 오류 발생:', error);
				alert('사원 삭제에 실패했습니다. 오류: ' + error.message);
			}
		});
	}

	// 테이블 첫 번째 td (체크박스) 클릭 시 이벤트 전파 중지
	document.querySelectorAll('table').forEach(table => {
		const firstCells = table.querySelectorAll('tbody tr td:first-child');
		firstCells.forEach(td => {
			td.addEventListener('click', (event) => {
				event.stopPropagation();
			});
		});
	});

	// 전체 선택 체크박스
	const selectAllCheckbox = document.querySelector('thead input[type="checkbox"]');
	if (selectAllCheckbox) {
		selectAllCheckbox.addEventListener('change', (event) => {
			const isChecked = event.target.checked;
			const rowCheckboxes = document.querySelectorAll('#userTableBody input[type="checkbox"]');
			rowCheckboxes.forEach(checkbox => {
				checkbox.checked = isChecked;
			});
		});
	}

});