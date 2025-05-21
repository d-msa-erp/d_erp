package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // <-- 이 부분을 상속해야 합니다.
import org.springframework.stereotype.Repository;

// @Query나 @Param, Sort 등은 이제 Service에서 JpaSpecificationExecutor를 통해 처리하므로 여기서는 필요 없음.
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// import org.springframework.data.domain.Sort;

// JpaSpecificationExecutor를 상속하여 복잡한 동적 쿼리 (검색, 필터링 등)를 지원합니다.
@Repository
public interface WhmstRepository extends JpaRepository<Whmst, Long>, JpaSpecificationExecutor<Whmst> {

    // 기존의 findAllWarehousesByKeyword @Query 메서드는 Service에서 Specification으로 대체되었으므로 제거합니다.
    /*
    @Query("SELECT w FROM Whmst w WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(w.whNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.whCd) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.whLocation) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.remark) LIKE LOWER(CONCAT('%', :keyword, '%')))"
           )
    List<Whmst> findAllWarehousesByKeyword(@Param("keyword") String keyword, Sort sort);
    */
}