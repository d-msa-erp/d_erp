let currentTh = null;
let currentOrder = 'desc';







//Modal ~ 
function openModal() {
    const title = document.getElementById('modalTitle');
    title.textContent = '신규 자재/품목 등록';
    document.getElementById('modal').style.display = 'flex';
    document.querySelector('#modalForm Button[name="save"]').style.display = 'block';
    document.querySelector('#modalForm Button[name="edit"]').style.display = 'none';
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
    document.getElementById('modalTitle').textContent = '자재/품목 정보';
    
    document.querySelector('#modalForm Button[name="save"]').style.display = 'none';
    document.querySelector('#modalForm Button[name="edit"]').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
	  document.querySelectorAll('table').forEach(table => {
	    const firstCells = table.querySelectorAll('tbody tr td:first-child');
	    firstCells.forEach(td => {
	      td.setAttribute('onclick', 'event.stopPropagation()');
	    });
	  });
	});
	
	
	
	
	
	
	
	
	
	
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
		const tbody = document.getElementById('invenbody');
		const rows = Array.from(tbody.querySelectorAll('tr:not(#noinven)'));
		const headerText = thValue.textContent.replace(/[\u2193\u2191]/g, '').trim();
		
		let colIndex = -1;
		switch (headerText) {
		        case '자재/품목코드':
		            colIndex = 1;
		            break;
		        case '자재/품목명':
		            colIndex = 2;
		            break;
		        case '수량':
		            colIndex = 3;
		            break;
		        case '적정재고':
		            colIndex = 4;
		            break;
		        case '창고명':
		            colIndex = 5;
		            break;
		        case '단위':
		            colIndex = 6;
		            break;
		    }
			if (colIndex !== -1) {
			        rows.sort((a, b) => {
			            const aText = a.children[colIndex].textContent.trim();
			            const bText = b.children[colIndex].textContent.trim();

			            let compa = 0;

			            // 숫자형 데이터인지 확인 (수량, 적정재고)
			            if (['수량', '적정재고'].includes(headerText)) {
			                const aNum = parseInt(aText);
			                const bNum = parseInt(bText);
			                if (!isNaN(aNum) && !isNaN(bNum)) {
			                    compa = aNum - bNum;
			                } else {
			                    // 숫자가 아니면 문자열로 비교
			                    compa = aText.localeCompare(bText);
			                }
			            } else {
			                // 문자열 비교 (한글 포함)
			                compa = aText.localeCompare(bText);
			            }
			            return currentOrder === 'asc' ? compa : -compa;
			        });

			        // 정렬된 행들을 tbody에 다시 추가
			        rows.forEach(row => tbody.appendChild(row));
			    }
	}