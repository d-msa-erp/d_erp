package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface WhmstRepository extends JpaRepository<Whmst, Long> {

    // 전체 창고 리스트 조회 및 정렬 기능
    // 검색 기능도 미리 추가하여 나중에 확장하기 용이하게 합니다.
    @Query("SELECT w FROM Whmst w WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(w.whNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " + // 창고명으로 검색
           "LOWER(w.whCd) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " + // 창고코드로 검색
           "LOWER(w.whLocation) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " + // 창고 위치로 검색
           "LOWER(w.remark) LIKE LOWER(CONCAT('%', :keyword, '%')))" // 비고로 검색
           )
    List<Whmst> findAllWarehousesByKeyword(@Param("keyword") String keyword, Sort sort);
}