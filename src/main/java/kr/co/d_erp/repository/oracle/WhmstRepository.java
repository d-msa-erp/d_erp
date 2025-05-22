package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.domain.Usermst; // Usermst 엔티티 import (쿼리에서 사용될 것임)
import kr.co.d_erp.dtos.WhmstDto; // WhmstDto 클래스 import (클래스로 변경된 것)
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

    @Query(value = "SELECT new kr.co.d_erp.dtos.WhmstDto(" +
                   "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
                   "w.useFlag, w.whLocation, " +
                   "w.whUser.userIdx, " + // Whmst 엔티티의 'whUser' 관계 필드를 통해 Usermst의 'userIdx' 접근
                   "w.whUser.userNm, " +  // Whmst 엔티티의 'whUser' 관계 필드를 통해 Usermst의 'userNm' 접근
                   "w.whUser.userId) " +   // Whmst 엔티티의 'whUser' 관계 필드를 통해 Usermst의 'userId' 접근
                   "FROM Whmst w " +
                   // 명시적인 LEFT JOIN FETCH는 필요 없지만, 검색 조건이나 정렬에 Usermst 필드가 사용되므로 명시적 조인 구문 추가.
                   // w.whUser를 바로 사용하는 것이 JPA가 조인을 처리하도록 하는 방법이지만,
                   // 아래 정렬/검색 조건에 wu.userNm을 쓰는 것을 위해 명시적 조인 추가.
                   "LEFT JOIN w.whUser wu " + // 'w.whUser'는 Whmst 엔티티 내 Usermst 엔티티 필드를 의미
                   "WHERE (:keyword IS NULL OR :keyword = '' OR " +
                   "  LOWER(w.whNm) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.whCd) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.whLocation) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(wu.userNm) LIKE '%' || LOWER(:keyword) || '%') " + // 조인된 별칭 'wu' 사용
                   "ORDER BY " +
                   "  CASE WHEN :sortBy = 'whIdx' AND :sortDirection = 'asc' THEN w.whIdx END ASC, " +
                   "  CASE WHEN :sortBy = 'whIdx' AND :sortDirection = 'desc' THEN w.whIdx END DESC, " +
                   "  CASE WHEN :sortBy = 'whCd' AND :sortDirection = 'asc' THEN w.whCd END ASC, " +
                   "  CASE WHEN :sortBy = 'whCd' AND :sortDirection = 'desc' THEN w.whCd END DESC, " +
                   "  CASE WHEN :sortBy = 'whNm' AND :sortDirection = 'asc' THEN w.whNm END ASC, " +
                   "  CASE WHEN :sortBy = 'whNm' AND :sortDirection = 'desc' THEN w.whNm END DESC, " +
                   "  CASE WHEN :sortBy = 'whType1' AND :sortDirection = 'asc' THEN w.whType1 END ASC, " +
                   "  CASE WHEN :sortBy = 'whType1' AND :sortDirection = 'desc' THEN w.whType1 END DESC, " +
                   "  CASE WHEN :sortBy = 'useFlag' AND :sortDirection = 'asc' THEN w.useFlag END ASC, " +
                   "  CASE WHEN :sortBy = 'useFlag' AND :sortDirection = 'desc' THEN w.useFlag END DESC, " +
                   "  CASE WHEN :sortBy = 'whLocation' AND :sortDirection = 'asc' THEN w.whLocation END ASC, " +
                   "  CASE WHEN :sortBy = 'whLocation' AND :sortDirection = 'desc' THEN w.whLocation END DESC, " +
                   "  CASE WHEN :sortBy = 'remark' AND :sortDirection = 'asc' THEN w.remark END ASC, " +
                   "  CASE WHEN :sortBy = 'remark' AND :sortDirection = 'desc' THEN w.remark END DESC, " +
                   "  CASE WHEN :sortBy = 'whUserNm' AND :sortDirection = 'asc' THEN wu.userNm END ASC, " +
                   "  CASE WHEN :sortBy = 'whUserNm' AND :sortDirection = 'desc' THEN wu.userNm END DESC"
                   )
    List<WhmstDto> findAllWarehousesWithUserDetails(
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        @Param("keyword") String keyword);

    @Query(value = "SELECT new kr.co.d_erp.dtos.WhmstDto(" +
                   "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
                   "w.useFlag, w.whLocation, " +
                   "w.whUser.userIdx, " +
                   "w.whUser.userNm, " +
                   "w.whUser.userId) " +
                   "FROM Whmst w " +
                   "LEFT JOIN w.whUser wu " +
                   "WHERE w.whIdx = :whIdx"
                   )
    WhmstDto findWarehouseDetailsById(@Param("whIdx") Long whIdx);
}