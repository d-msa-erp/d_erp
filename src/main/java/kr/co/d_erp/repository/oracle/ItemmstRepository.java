package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Itemmst;
import kr.co.d_erp.dtos.ItemForSelectionDto;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemmstRepository extends JpaRepository<Itemmst, Long> {

    /**
     * Datalist에 사용할 모든 (또는 활성) 품목 정보를 DTO로 조회합니다.
     * 품목명으로 정렬합니다.
     * @param sort 정렬 정보
     * @return ItemForSelectionDto 리스트
     */
    @Query("SELECT new kr.co.d_erp.dtos.ItemForSelectionDto(i.itemIdx, i.itemNm, i.itemCd, i.cycleTime, i.itemCost) " + // itemCost, cycleTime 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
           "FROM Itemmst i " +
           "WHERE i.itemFlag IS NOT NULL") // 예시: 기본적인 활성 조건 (실제 '활성' 조건으로 변경 필요)
    List<ItemForSelectionDto> findAllForSelection(Sort sort);

    /**
     * 특정 거래처(custIdx)에 연결된 모든 (또는 활성) 품목 정보를 DTO로 조회합니다.
     * 품목명으로 정렬합니다.
     * @param custIdx 거래처 ID
     * @param sort 정렬 정보
     * @return ItemForSelectionDto 리스트
     */
    @Query("SELECT new kr.co.d_erp.dtos.ItemForSelectionDto(i.itemIdx, i.itemNm, i.itemCd, i.cycleTime, i.itemCost) " + // itemCost, cycleTime 필요해서 추가했습니다 문제 생기면 삭제해주세요. -민섭
           "FROM Itemmst i " +
           "WHERE i.custmst.custIdx = :custIdx " +
           "AND i.itemFlag IS NOT NULL") // 예시: 기본적인 활성 조건 (실제 '활성' 조건으로 변경 필요)
    List<ItemForSelectionDto> findForSelectionByCustIdx(@Param("custIdx") Long custIdx, Sort sort);

    // TODO: "활성(active)" 품목에 대한 정확한 기준(예: 특정 ITEM_FLAG 값, 사용 여부 컬럼 등)이 있다면
    //       위 @Query의 WHERE 절에 해당 조건을 추가해야 합니다.
    //       예: "WHERE i.custmst.custIdx = :custIdx AND i.useYn = 'Y'"
}