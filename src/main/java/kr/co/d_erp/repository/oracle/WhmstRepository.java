package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.WhmstDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhmstRepository extends JpaRepository<Whmst, Long>, JpaSpecificationExecutor<Whmst> {

    Optional<Whmst> findByWhCd(String whCd);
    
    /**
     * 사용여부로 창고를 조회하고 창고명으로 정렬합니다
     * @param useFlag 사용 여부 ('Y' 또는 'N')
     * @return 정렬된 창고 목록
     */
    List<Whmst> findByUseFlagOrderByWhNmAsc(String useFlag);

    /**
     * 활성 창고 목록을 DTO로 조회합니다 (드롭다운/선택용)
     * @param useFlag 사용 여부 ('Y')
     * @param sort 정렬 정보
     * @return 활성 창고 DTO 목록
     */
    @Query("SELECT new kr.co.d_erp.dtos.WhmstDto(" +
           "w.whIdx, w.whCd, w.whNm, w.remark, w.whType1, w.whType2, w.whType3, " +
           "w.useFlag, w.whLocation, " +
           "CASE WHEN w.whUser IS NOT NULL THEN w.whUser.userIdx ELSE NULL END, " +
           "CASE WHEN w.whUser IS NOT NULL THEN w.whUser.userNm ELSE NULL END, " +
           "CASE WHEN w.whUser IS NOT NULL THEN w.whUser.userId ELSE NULL END) " +
           "FROM Whmst w " +
           "WHERE w.useFlag = :useFlag")
    List<WhmstDto> findActiveWarehouseDtosByUseFlag(@Param("useFlag") String useFlag, Sort sort);

    
    /**
     * 선택된 창고들의 사용여부를 N으로 변경합니다 (논리적 삭제)
     * @param whIdxes 삭제할 창고 ID 목록
     */
    @Query("UPDATE Whmst w SET w.useFlag = 'N' WHERE w.whIdx IN :whIdxes")
    @Modifying
    void updateUseFlagToN(@Param("whIdxes") List<Long> whIdxes);

    /**
     * 활성 창고만 페이징으로 조회합니다 (useFlag = 'Y')
     * @param useFlag 사용 여부 ('Y')
     * @param keyword 검색어
     * @param pageable 페이징 정보
     * @return 활성 창고 페이지
     */
    @Query("SELECT w FROM Whmst w LEFT JOIN FETCH w.whUser u " +
           "WHERE w.useFlag = :useFlag " +
           "AND (:keyword IS NULL OR " +
           "w.whCd LIKE %:keyword% OR " +
           "w.whNm LIKE %:keyword% OR " +
           "w.whLocation LIKE %:keyword% OR " +
           "w.remark LIKE %:keyword% OR " +
           "u.userNm LIKE %:keyword%)")
    Page<Whmst> findActiveWarehousesWithUserDetailsPageable(
        @Param("useFlag") String useFlag,
        @Param("keyword") String keyword, 
        Pageable pageable);
    
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

}