// 프론트 코드 
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
	title.textContent = '신규 창고 등록';
	document.getElementById('modal').style.display = 'flex';
	document.querySelector('#modalForm button[name="save"]').style.display = 'flex';
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
	document.getElementById('modalTitle').textContent = '창고 수정';

	document.querySelector('#modalForm button[name="save"]').style.display = 'none';
	document.querySelector('#modalForm button[name="edit"]').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('table').forEach(table => {
		const firstCells = table.querySelectorAll('tbody tr td:first-child');
		firstCells.forEach(td => {
			td.setAttribute('onclick', 'event.stopPropagation()');
		});
	});
});

function toggleWarehouseInfo() {
			const section = document.getElementById('warehouseInfo');
			section.style.display = section.style.display === 'none' ? 'block' : 'none';
		}