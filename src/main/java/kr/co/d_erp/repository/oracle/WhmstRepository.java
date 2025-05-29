package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    /**
     * 창고 목록을 페이징하여 조회합니다 (검색 기능 포함)
     * 서비스에서 호출하는 findAllWarehousesWithUserDetailsPageable 메서드
     * @param keyword 검색어
     * @param pageable 페이징 정보 (정렬 포함)
     * @return 페이징된 창고 엔티티 목록
     */
    @Query("SELECT w FROM Whmst w " +
           "LEFT JOIN FETCH w.whUser wu " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(w.whNm) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(w.whCd) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(w.whLocation) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(wu.userNm) LIKE '%' || LOWER(:keyword) || '%')")
    Page<Whmst> findAllWarehousesWithUserDetailsPageable(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 창고 목록을 조회합니다 (검색 및 정렬 기능 포함) - 기존 메서드 개선
     * @param keyword 검색어
     * @param sort 정렬 정보
     * @return 창고 DTO 목록
     */
    @Query("SELECT new kr.co.d_erp.dtos.WhmstDto(" +
           "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
           "w.useFlag, w.whLocation, " +
           "w.whUser.userIdx, " +
           "w.whUser.userNm, " +
           "w.whUser.userId) " +
           "FROM Whmst w " +
           "LEFT JOIN w.whUser wu " +
           "WHERE (:keyword IS NULL OR :keyword = '' OR " +
           "  LOWER(w.whNm) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(w.whCd) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(w.whLocation) LIKE '%' || LOWER(:keyword) || '%' OR " +
           "  LOWER(wu.userNm) LIKE '%' || LOWER(:keyword) || '%')")
    List<WhmstDto> findAllWarehousesWithUserDetails(@Param("keyword") String keyword, Sort sort);

    /**
     * 특정 창고의 상세 정보를 조회합니다
     * @param whIdx 창고 고유 번호
     * @return 창고 DTO
     */
    @Query("SELECT new kr.co.d_erp.dtos.WhmstDto(" +
           "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
           "w.useFlag, w.whLocation, " +
           "w.whUser.userIdx, " +
           "w.whUser.userNm, " +
           "w.whUser.userId) " +
           "FROM Whmst w " +
           "LEFT JOIN w.whUser wu " +
           "WHERE w.whIdx = :whIdx")
    WhmstDto findWarehouseDetailsById(@Param("whIdx") Long whIdx);

    /**
     * 사용 중인(useFlag='Y') 창고 목록을 DTO 형태로 조회합니다.
     * Datalist용 활성 창고 목록 조회에 사용됩니다.
     * @param useFlag 조회할 사용 플래그 (예: "Y")
     * @param sort 정렬 정보
     * @return 정렬된 WhmstDto 리스트
     */
    @Query("SELECT new kr.co.d_erp.dtos.WhmstDto(" +
           "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
           "w.useFlag, w.whLocation, " +
           "wu.userIdx, " +
           "wu.userNm, " +
           "wu.userId) " +
           "FROM Whmst w LEFT JOIN w.whUser wu " +
           "WHERE w.useFlag = :useFlag")
    List<WhmstDto> findActiveWarehouseDtosByUseFlag(@Param("useFlag") String useFlag, Sort sort);
}