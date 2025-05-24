package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto;
import org.springframework.data.domain.Sort; // Sort 임포트 추가
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
                   "LEFT JOIN w.whUser wu " + // 'w.whUser'는 Whmst 엔티티 내 Usermst 엔티티 필드를 의미, 별칭 wu 사용
                   "WHERE (:keyword IS NULL OR :keyword = '' OR " +
                   "  LOWER(w.whNm) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.whCd) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(w.whLocation) LIKE '%' || LOWER(:keyword) || '%' OR " +
                   "  LOWER(wu.userNm) LIKE '%' || LOWER(:keyword) || '%') " + // 조인된 별칭 'wu' 사용
                   "ORDER BY " + // JPQL에서 동적 정렬을 위해 CASE 문 사용 (Spring Data JPA의 Sort 객체와 함께 사용 시 주의)
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
                   "LEFT JOIN w.whUser wu " + // 일관성을 위해 별칭 wu 사용 (생략해도 w.whUser로 접근 가능)
                   "WHERE w.whIdx = :whIdx"
                   )
    WhmstDto findWarehouseDetailsById(@Param("whIdx") Long whIdx);

    // === Datalist용 활성 창고 DTO 목록 조회 메소드 (추가된 부분) ===
    /**
     * 사용 중인(useFlag='Y') 창고 목록을 DTO 형태로 조회합니다.
     * 담당자 정보(userIdx, userNm, userId)를 포함하며, 전달된 Sort 객체에 따라 정렬됩니다.
     * @param useFlag 조회할 사용 플래그 (예: "Y")
     * @param sort 정렬 정보
     * @return 정렬된 WhmstDto 리스트
     */
    @Query("SELECT new kr.co.d_erp.dtos.WhmstDto(" +
           "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
           "w.useFlag, w.whLocation, " +
           "wu.userIdx, " +  // Whmst 엔티티 내 'whUser' 필드를 통해 Usermst의 userIdx 접근 (별칭 wu 사용)
           "wu.userNm, " +   // Whmst 엔티티 내 'whUser' 필드를 통해 Usermst의 userNm 접근 (별칭 wu 사용)
           "wu.userId) " +   // Whmst 엔티티 내 'whUser' 필드를 통해 Usermst의 userId 접근 (별칭 wu 사용)
           "FROM Whmst w LEFT JOIN w.whUser wu " + // 명시적 조인과 별칭 wu 사용
           "WHERE w.useFlag = :useFlag")
    List<WhmstDto> findActiveWarehouseDtosByUseFlag(@Param("useFlag") String useFlag, Sort sort);
}