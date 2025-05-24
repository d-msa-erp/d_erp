package kr.co.d_erp.service;

import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.repository.oracle.ItemmstRepository; // ItemmstRepository (JPA)
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("itemJpaService") // 기존 ItemService와 빈 이름 충돌을 피하기 위해 이름 지정
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemJpaService { // 클래스 이름을 ItemJpaservice 또는 ItemDataListService 등으로 변경

    private final ItemmstRepository itemmstRepository; // JPA 리포지토리 주입

    /**
     * Datalist에 사용될 품목 목록을 조회합니다.
     * 특정 거래처 ID(custIdx)가 제공되면 해당 거래처의 품목만, 없으면 전체 (활성) 품목을 반환합니다.
     * @param custIdx 거래처 ID (선택 사항)
     * @return ItemForSelectionDto 리스트
     */
    public List<ItemForSelectionDto> findActiveItemsForSelection(Long custIdx) {
        Sort defaultSort = Sort.by(Sort.Direction.ASC, "itemNm"); // 품목명 오름차순 정렬

        List<ItemForSelectionDto> items;
        if (custIdx != null && custIdx > 0) {
            // ItemmstRepository에 findForSelectionByCustIdx 메소드가 ItemForSelectionDto 리스트를 반환하도록 정의되어 있어야 함
            items = itemmstRepository.findForSelectionByCustIdx(custIdx, defaultSort);
        } else {
            // ItemmstRepository에 findAllForSelection 메소드가 ItemForSelectionDto 리스트를 반환하도록 정의되어 있어야 함
            items = itemmstRepository.findAllForSelection(defaultSort);
        }

        if (items == null) {
            return List.of(); // null일 경우 빈 리스트 반환
        }
        return items;
    }
}