package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhmstRepository extends JpaRepository<Whmst, Long>, JpaSpecificationExecutor<Whmst> {

    Optional<Whmst> findByWhCd(String whCd);

    // ⭐ 수정: DTO 생성자 호출 제거 및 순수한 SQL 별칭 사용 ⭐
    @Query(value = "SELECT " +
                   "w.WH_IDX as whIdx, " + // ⭐ DTO 인터페이스의 getWhIdx()와 매핑 ⭐
                   "w.WH_CD as whCd, " +   // ⭐ DTO 인터페이스의 getWhCd()와 매핑 ⭐
                   "w.WH_NM as whNm, " +
                   "w.REMARK as remark, " +
                   "w.WH_TYPE1 as whType1, " +
                   "w.WH_TYPE2 as whType2, " +
                   "w.WH_TYPE3 as whType3, " +
                   "w.USE_FLAG as useFlag, " +
                   "w.WH_LOCATION as whLocation, " +
                   "w.WH_USER_IDX as whUserIdx, " +
                   "w.WH_USER_NM as whUserNm, " + // ⭐ DTO 인터페이스의 getWhUserNm()과 매핑 ⭐
                   "w.WH_USER_ID as whUserId " + // ⭐ DTO 인터페이스의 getWhUserId()와 매핑 ⭐
                   "FROM VW_WAREHOUSE_USER_INFO w " +
                   "WHERE (:keyword IS NULL OR :keyword = '' OR " +
                   "  LOWER(w.WH_NM) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.WH_CD) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.WH_LOCATION) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.WH_USER_NM) LIKE '%' || LOWER(:keyword) || '%') " +
                   "ORDER BY " +
                   "  CASE WHEN :sortBy = 'whIdx' AND :sortDirection = 'asc' THEN w.WH_IDX END ASC, " +
                   "  CASE WHEN :sortBy = 'whIdx' AND :sortDirection = 'desc' THEN w.WH_IDX END DESC, " +
                   "  CASE WHEN :sortBy = 'whCd' AND :sortDirection = 'asc' THEN w.WH_CD END ASC, " +
                   "  CASE WHEN :sortBy = 'whCd' AND :sortDirection = 'desc' THEN w.WH_CD END DESC, " +
                   "  CASE WHEN :sortBy = 'whNm' AND :sortDirection = 'asc' THEN w.WH_NM END ASC, " +
                   "  CASE WHEN :sortBy = 'whNm' AND :sortDirection = 'desc' THEN w.WH_NM END DESC, " +
                   "  CASE WHEN :sortBy = 'whType1' AND :sortDirection = 'asc' THEN w.WH_TYPE1 END ASC, " +
                   "  CASE WHEN :sortBy = 'whType1' AND :sortDirection = 'desc' THEN w.WH_TYPE1 END DESC, " +
                   "  CASE WHEN :sortBy = 'useFlag' AND :sortDirection = 'asc' THEN w.USE_FLAG END ASC, " +
                   "  CASE WHEN :sortBy = 'useFlag' AND :sortDirection = 'desc' THEN w.USE_FLAG END DESC, " +
                   "  CASE WHEN :sortBy = 'whLocation' AND :sortDirection = 'asc' THEN w.WH_LOCATION END ASC, " +
                   "  CASE WHEN :sortBy = 'whLocation' AND :sortDirection = 'desc' THEN w.WH_LOCATION END DESC, " +
                   "  CASE WHEN :sortBy = 'remark' AND :sortDirection = 'asc' THEN w.REMARK END ASC, " +
                   "  CASE WHEN :sortBy = 'remark' AND :sortDirection = 'desc' THEN w.REMARK END DESC, " +
                   "  CASE WHEN :sortBy = 'whUserNm' AND :sortDirection = 'asc' THEN w.WH_USER_NM END ASC, " +
                   "  CASE WHEN :sortBy = 'whUserNm' AND :sortDirection = 'desc' THEN w.WH_USER_NM END DESC",
            nativeQuery = true) // ⭐ nativeQuery = true 유지 ⭐
    List<WhmstDto> findAllWarehousesWithUserDetails(
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        @Param("keyword") String keyword);

    // ⭐ 수정: 단일 조회 쿼리도 동일하게 변경 ⭐
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
            nativeQuery = true) // ⭐ nativeQuery = true 유지 ⭐
    WhmstDto findWarehouseDetailsById(@Param("whIdx") Long whIdx);
}