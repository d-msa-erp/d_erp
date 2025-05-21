package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // <-- 이 부분을 상속해야 합니다.
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WarehouseResponseDto;

// @Query나 @Param, Sort 등은 이제 Service에서 JpaSpecificationExecutor를 통해 처리하므로 여기서는 필요 없음.
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// import org.springframework.data.domain.Sort;

// JpaSpecificationExecutor를 상속하여 복잡한 동적 쿼리 (검색, 필터링 등)를 지원합니다.
@Repository
public interface WhmstRepository extends JpaRepository<Whmst, Long>, JpaSpecificationExecutor<Whmst> {

	// 모든 창고 목록을 뷰에서 조회하여 DTO로 매핑하는 쿼리
    // `nativeQuery = true`를 사용하여 SQL 쿼리를 직접 작성합니다.
    // 정렬 및 검색 기능을 추가해야 합니다.
    @Query(value = "SELECT " +
                   "w.WH_IDX as whIdx, " +
                   "w.WH_CD as whCd, " +
                   "w.WH_NM as whNm, " +
                   "w.REMARK as remark, " +
                   "w.WH_TYPE1 as whType1, " +
                   "w.WH_TYPE2 as whType2, " +
                   "w.WH_TYPE3 as whType3, " +
                   "w.USE_FLAG as useFlag, " +
                   "w.WH_LOCATION as whLocation, " +
                   "w.WH_USER_IDX as whUserIdx, " +
                   "w.WH_USER_NM as whUserNm, " + // 뷰에서 가져오는 담당자 이름
                   "w.WH_USER_ID as whUserId " +   // 뷰에서 가져오는 담당자 ID
                   "FROM VW_WAREHOUSE_USER_INFO w " +
                   "WHERE (:keyword IS NULL OR :keyword = '' OR " +
                   "  w.WH_NM LIKE '%' || :keyword || '%' OR " +
                   "  w.WH_CD LIKE '%' || :keyword || '%' OR " +
                   "  w.WH_LOCATION LIKE '%' || :keyword || '%' OR " +
                   "  w.WH_USER_NM LIKE '%' || :keyword || '%') " + // 담당자 이름으로도 검색
                   "ORDER BY " +
                   "  CASE WHEN :sortBy = 'whIdx' THEN w.WH_IDX END, " +
                   "  CASE WHEN :sortBy = 'whCd' THEN w.WH_CD END, " +
                   "  CASE WHEN :sortBy = 'whNm' THEN w.WH_NM END, " +
                   "  CASE WHEN :sortBy = 'whType1' THEN w.WH_TYPE1 END, " +
                   "  CASE WHEN :sortBy = 'useFlag' THEN w.USE_FLAG END, " +
                   "  CASE WHEN :sortBy = 'whLocation' THEN w.WH_LOCATION END, " +
                   "  CASE WHEN :sortBy = 'remark' THEN w.REMARK END, " +
                   "  CASE WHEN :sortBy = 'whUserNm' THEN w.WH_USER_NM END " + // 담당자 이름으로 정렬
                   "  ASC, " + // 기본 오름차순, 실제 정렬은 아래 CASE WHEN으로 제어
                   "  CASE WHEN :sortDirection = 'asc' THEN 1 END ASC, " +
                   "  CASE WHEN :sortDirection = 'desc' THEN 1 END DESC",
            nativeQuery = true)
    List<WarehouseResponseDto> findAllWarehousesWithUserDetails(
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        @Param("keyword") String keyword);


    // 단일 창고 상세 정보를 뷰에서 조회하여 DTO로 매핑하는 쿼리 (수정 모달용)
    @Query(value = "SELECT " +
                   "w.WH_IDX as whIdx, " +
                   "w.WH_CD as whCd, " +
                   "w.WH_NM as whNm, " +
                   "w.REMARK as remark, " +
                   "w.WH_TYPE1 as whType1, " +
                   "w.WH_TYPE2 as whType2, " +
                   "w.WH_TYPE3 as whType3, " +
                   "w.USE_FLAG as useFlag, " +
                   "w.WH_LOCATION as whLocation, " +
                   "w.WH_USER_IDX as whUserIdx, " +
                   "w.WH_USER_NM as whUserNm, " +
                   "w.WH_USER_ID as whUserId " +
                   "FROM VW_WAREHOUSE_USER_INFO w " +
                   "WHERE w.WH_IDX = :whIdx",
            nativeQuery = true)
    WarehouseResponseDto findWarehouseDetailsById(@Param("whIdx") Long whIdx);
}