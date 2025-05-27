package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.VItemDetailsForBom; // 이름 변경된 엔티티 임포트
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VItemDetailsForBomRepository extends JpaRepository<VItemDetailsForBom, Long> { // 이름 변경

    /**
     * Datalist에 사용될 활성 품목 정보를 뷰(V_ITEM_DETAILS)에서 조회합니다.
     * DTO 변환은 서비스 계층에서 수행하므로, 여기서는 VItemDetailsForBom 엔티티 자체를 반환합니다.
     * @param sort 정렬 정보
     * @return VItemDetailsForBom 엔티티 리스트
     */
    @Query("SELECT v " + // VItemDetailsForBom 엔티티 자체를 반환
           "FROM VItemDetailsForBom v " + // JPQL 쿼리에서도 엔티티 이름 변경
           "WHERE v.itemFlag = '01' OR v.itemFlag = '02' " + // '01' 또는 '02'가 활성 품목을 나타낸다고 가정
           "ORDER BY v.itemNm ASC")
    List<VItemDetailsForBom> findAllActiveItemsInView(Sort sort);

    // CUST_IDX에 대한 필터링은 ItemmstRepository를 계속 사용합니다.
    // VItemDetailsForBom 뷰에 CUST_IDX가 없기 때문입니다.
}