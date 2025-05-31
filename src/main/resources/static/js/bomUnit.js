console.log('bomUnit.js로드 확인');
//UNIT(단위 모달용)
document.addEventListener('DOMContentLoaded', () => {
	const modal = document.getElementById('modal-spec');
	const tbody = document.getElementById('UnitBody');
	const openBtn = document.querySelector('button[onclick="openSpecModal()"]');
	const closeAll = () => { modal.style.display = 'none'; };

	// 1) 모달 열기 함수 재정의: 렌더링 후 보이기
	window.openSpecModal = () => {
		loadAndRenderUnits();
		modal.style.display = 'flex';
	};

	// 2) 모달 외부 클릭 시 닫기
	modal.addEventListener('click', e => {
		if (e.target === modal) closeAll();
	});

	// 3) 단위 목록 로드 & 렌더링
	function loadAndRenderUnits() {
		tbody.innerHTML = '<tr><td colspan="3">단위 정보를 불러오는 중...</td></tr>';
		fetch('/api/unit/details')
			.then(res => {
				if (!res.ok) throw new Error(res.statusText);
				return res.json();
			})
			.then(units => {
				units.sort((a, b) => a.unitNm.localeCompare(b.unitNm));
				if (units.length === 0) {
					tbody.innerHTML = '<tr><td colspan="3">등록된 단위가 없습니다.</td></tr>';
					return;
				}
				tbody.innerHTML = '';
				units.forEach((unit, i) => {
					const tr = document.createElement('tr');
					tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${unit.unitNm}</td>
            <td>
			
              <button type="button"
                      class="delete-unit-btn"
                      data-idx="${unit.unitIdx}">
					  <span class="material-symbols-outlined">delete</span>
                삭제
              </button>
            </td>`;
					tbody.appendChild(tr);
				});
			})
			.catch(err => {
				tbody.innerHTML = `<tr>
          <td colspan="3">오류 발생: ${err.message}</td>
        </tr>`;
			});
	}

	// 4) 삭제 버튼 클릭 처리 (이벤트 위임)
	tbody.addEventListener('click', e => {
		if (!e.target.classList.contains('delete-unit-btn')) return;
		const unitIdx = e.target.dataset.idx;
		if (!confirm('정말 이 단위를 삭제하시겠습니까?')) return;
		fetch(`/api/unit/${unitIdx}`, { method: 'DELETE' })
			.then(res => {
				if (!res.ok) throw new Error(res.statusText);
				alert('삭제되었습니다.');
				loadAndRenderUnits();
			})
			.catch(err => {
				alert('삭제 실패: ' + err.message);
			});
	});

	// 5) 신규 단위 등록 폼 처리
	const form = modal.querySelector('form');
	form.addEventListener('submit', e => {
		console.log('test');
		e.preventDefault();
		const input = document.getElementById('new-spec-unit');
		const nm = input.value.trim();
		if (!nm) {
			alert('단위명을 입력하세요');
			return;
		}
		fetch('/api/unit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ unitNm: nm })
		})
			.then(res => {
				if (!res.ok) return res.json().then(j => { throw new Error(j.message || res.statusText) });
				return res.json();
			})
			.then(() => {
				alert(`'${nm}' 단위가 등록되었습니다.`);
				input.value = '';
				loadAndRenderUnits();
			})
			.catch(err => {
				alert('등록 실패: ' + err.message);
			});
	});
});