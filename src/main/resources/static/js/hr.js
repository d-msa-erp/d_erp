document.addEventListener('DOMContentLoaded', () => {
    // 데이터를 채울 tbody 요소를 가져옵니다.
    const userTableBody = document.getElementById('userTableBody');

    // userTableBody 요소가 없으면 스크립트 실행 중지 (th:if 때문에 없을 수 있음)
    if (!userTableBody) {
        console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다. th:if 조건 확인 필요.");
        return; // 요소가 없으면 더 이상 진행하지 않습니다.
    }

    // API 엔드포인트 URL 설정 (실제 백엔드 API URL로 변경해야 합니다!)
    // 예시: 백엔드 컨트롤러의 @RequestMapping과 @GetMapping 경로를 조합하세요.
    const apiUrl = '/api/users'; // <--- 실제 API 엔드포인트 URL로 변경하세요.

    // API를 호출하여 사용자 데이터를 가져오고 테이블을 업데이트하는 비동기 함수
    async function loadUsersTable() {
        try {
            // API 호출
            const response = await fetch(apiUrl);

            // 응답 상태 확인
            if (!response.ok) {
                // 200 OK가 아닌 경우 오류 처리
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 응답을 JSON 형식으로 파싱
            const users = await response.json();

            // 기존 tbody 내용을 지웁니다. (th:if가 false일 때 nodata 메시지가 있다면 남겨두는 것이 좋습니다.
            // 여기서는 th:if가 true일 때만 이 스크립트가 실행된다고 가정하고 tbody를 비웁니다.)
             userTableBody.innerHTML = '';


            // 가져온 사용자 데이터로 테이블 행 생성
            if (users && users.length > 0) {
                users.forEach(user => {
                    const row = document.createElement('tr');
                    // 클릭 이벤트 핸들러 연결 (opendatail 함수는 별도로 정의되어 있어야 합니다)
                    row.onclick = opendatail;

                    // 체크박스 셀 (첫 번째 컬럼)
                    const checkboxCell = document.createElement('td');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkboxCell.appendChild(checkbox);
                    row.appendChild(checkboxCell);

                    // 데이터 셀 추가 - Usermst 객체의 실제 필드명에 맞게 'user.필드명' 부분을 수정해야 합니다!
                    // HTML th 순서: 체크박스, 이름, ID, 직통번호, H.P, 부서, 직책, 재직상태 (총 8개)
                    // Usermst 객체에 다음 필드들이 있다고 가정합니다. 실제 Usermst에 맞춰 수정하세요.

                    const nameCell = document.createElement('td');
                    nameCell.textContent = user.name || ''; // 예: Usermst에 'name' 필드가 있다면
                    row.appendChild(nameCell);

                    const userIdCell = document.createElement('td');
                    userIdCell.textContent = user.userId || user.id || ''; // 예: 'userId' 또는 'id' 필드가 있다면
                    row.appendChild(userIdCell);

                    const phoneCell = document.createElement('td');
                    phoneCell.textContent = user.phone || ''; // 예: 'phone' 필드가 있다면
                    row.appendChild(phoneCell);

                    const mobileCell = document.createElement('td');
                    mobileCell.textContent = user.mobile || user.hp || ''; // 예: 'mobile' 또는 'hp' 필드가 있다면
                    row.appendChild(mobileCell);

                    const departmentCell = document.createElement('td');
                    // 만약 부서가 객체 { id: 1, name: '개발팀' } 형태라면 user.department.name || ''
                    departmentCell.textContent = user.department || ''; // 예: 'department' 필드가 있다면
                    row.appendChild(departmentCell);

                    const positionCell = document.createElement('td');
                    positionCell.textContent = user.position || ''; // 예: 'position' 필드가 있다면
                    row.appendChild(positionCell);

                    const statusCell = document.createElement('td');
                    // 재직상태 코드를 텍스트로 변환하는 로직이 필요할 수 있습니다.
                    statusCell.textContent = user.status || ''; // 예: 'status' 필드가 있다면
                    row.appendChild(statusCell);


                    // 생성된 행을 tbody에 추가
                    userTableBody.appendChild(row);
                });
            } else {
                // 데이터가 없을 경우 메시지 표시 (th:if 조건에 따라 이 부분은 필요 없을 수도 있습니다)
                // 만약 th:if 없이 항상 tbody가 있고, 데이터 없음을 js에서 처리한다면 이 코드를 사용합니다.
                 const noDataRow = document.createElement('tr');
                 const noDataCell = document.createElement('td');
                 noDataCell.colSpan = 8; // 테이블 컬럼 수에 맞게 colspan 조정 (체크박스 포함 총 8개 컬럼)
                 noDataCell.textContent = '등록된 데이터가 없습니다.';
                 noDataCell.style.textAlign = 'center';
                 noDataRow.appendChild(noDataCell);
                 userTableBody.appendChild(noDataRow);
            }

        } catch (error) {
            // 오류 발생 시 콘솔에 로그 출력 및 테이블에 오류 메시지 표시
            console.error('데이터를 불러오는 중 오류가 발생했습니다:', error);
             userTableBody.innerHTML = ''; // 기존 내용 지우기
             const errorRow = document.createElement('tr');
             const errorCell = document.createElement('td');
             errorCell.colSpan = 8; // 테이블 컬럼 수에 맞게 colspan 조정
             errorCell.textContent = '데이터 로딩 실패';
             errorCell.style.color = 'red';
             errorCell.style.textAlign = 'center';
             errorRow.appendChild(errorCell);
             userTableBody.appendChild(errorRow);
        }
    }

    // 페이지 로드 시 데이터 로딩 함수 호출
    loadUsersTable();
});

// opendatail 함수 정의 (테이블 행 클릭 시 실행될 함수)
// 이 함수는 별도의 <script> 태그나 파일에 정의되어 있을 수도 있습니다.
function opendatail() {
    // 클릭된 행에 대한 상세 정보를 처리하는 로직을 여기에 작성합니다.
    // 예: 클릭된 행의 데이터를 가져와서 상세 페이지로 이동하거나 모달 창을 띄우는 등
    console.log('테이블 행이 클릭되었습니다.');
    // this 는 클릭된 <tr> 요소를 가리킵니다.
    // 예: 두 번째 셀(인덱스 1)인 이름 가져오기
    // const userName = this.cells[1].textContent;
    // console.log('클릭된 사용자 이름:', userName);
}




// 프론트 자스코드 
let currentTh = null;
        let currentOrder = 'desc';

        function order(thValue) {//정렬
            const allArrows = document.querySelectorAll("th a");
            allArrows.forEach(a => a.textContent = '↓');

            if (currentTh === thValue) {
                currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
            } else {
                currentOrder = 'asc';
                currentTh = thValue;
            }

            const arrow = thValue.querySelector('a');
            arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
        }

        //Modal ~ 
        function openModal() {
            const title = document.getElementById('modalTitle');
            title.textContent = '신규 사원 등록';
            document.getElementById('modal').style.display = 'flex';
            document.querySelector('#modalForm button[name="save"]').style.display = 'block';
            document.querySelector('#modalForm button[name="edit"]').style.display = 'none';
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }

        function outsideClick(e) {
            if (e.target.id === 'modal') {
                closeModal();
            }
        }



        function submitModal(event) {
            event.preventDefault();
            const siteName = document.querySelector('#modalForm input[name="siteName"]').value;
            console.log(currentTab + ' 등록됨:', siteName);
            closeModal();
        }

        //테이블 클릭 시 출력되는 modal
        function opendatail() {
            openModal();
            document.getElementById('modalTitle').textContent = '사원 수정';

            document.querySelector('#modalForm button[name="save"]').style.display = 'none';
            document.querySelector('#modalForm button[name="edit"]').style.display = 'block';
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('table').forEach(table => {
                const firstCells = table.querySelectorAll('tbody tr td:first-child');
                firstCells.forEach(td => {
                    td.setAttribute('onclick', 'event.stopPropagation()');
                });
            });
        });