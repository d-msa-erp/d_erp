package kr.co.d_erp.repository.oracle;



import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Itemmst;
import kr.co.d_erp.dtos.BomSummaryProjection;
import kr.co.d_erp.dtos.CatDto;
import kr.co.d_erp.dtos.CustomerForItemDto;
import kr.co.d_erp.dtos.ItemDto;
import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.dtos.ItemSelectionDto;
import kr.co.d_erp.dtos.ItemSelectionProjection;
import kr.co.d_erp.dtos.UnitForItemDto;

@Repository
public interface ItemmstRepository extends JpaRepository<ItemDto, Integer> {

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
    
    
    
    
    //추가 선익 BOM 요약 리스트를 가져오는 네이티브 쿼리 + 원가계산
    @Query(value = """
            SELECT DISTINCT
                p.ITEM_IDX     as itemIdx,
                p.ITEM_CD      as pitemCd,
                p.ITEM_NM      as pitemNm,
                cat.CAT_NM     as catNm,
                unit.UNIT_NM   as punitNm,
                -- ★★★ V_BOM_RAW_MATERIAL_COST 뷰와 조인하여 실제 원가 가져오기 ★★★
                COALESCE(cost.TOTAL_COST, 0) as ptotalRawMaterialCost
            FROM
                TB_ITEMMST p
            INNER JOIN
                TB_BOMDTL bom ON p.ITEM_IDX = bom.P_ITEM_IDX
            LEFT JOIN
                TB_ITEM_CAT cat ON p.ITEM_CAT1 = cat.CAT_IDX
            LEFT JOIN
                TB_UNIT_MST unit ON p.ITEM_UNIT = unit.UNIT_IDX
            LEFT JOIN -- <<<--- 새로 만든 뷰와 LEFT JOIN
                V_BOM_RAW_MATERIAL_COST cost ON p.ITEM_IDX = cost.ITEM_IDX
            WHERE
                p.ITEM_FLAG = '02'
            ORDER BY
                p.ITEM_CD
            """, nativeQuery = true)
    List<BomSummaryProjection> findBomSummaries();
    
    //ItemFlag기준으로 품목 선택용 DTO!!
    @Query(value = """
            SELECT
                i.ITEM_IDX as itemIdx,
                i.ITEM_CD as itemCd,
                i.ITEM_NM as itemNm,
                i.ITEM_SPEC as itemSpec,
                u.UNIT_NM as unitNm,
                i.ITEM_COST as itemCost   -- ★★★ 표준 원가 컬럼 추가 ★★★
            FROM
                TB_ITEMMST i
            LEFT JOIN
                TB_UNIT_MST u ON i.ITEM_UNIT = u.UNIT_IDX
            WHERE
                i.ITEM_FLAG = :itemFlag
            ORDER BY
                i.ITEM_NM ASC
            """, nativeQuery = true)
    List<ItemSelectionProjection> findItemsByFlagForSelection(@Param("itemFlag") String itemFlag);
    //여기까지 추가함 선익
    
    
    //----------------희원 추가 항목
    
    boolean existsByItemCd(String itemCd);
    
    // ITEM_CATX1, ITEM_CATX2 등은 실제 엔티티의 연관 필드명(예: catDto1.catNm)으로 변경 필요
    @Query("SELECT i FROM ItemDto i LEFT JOIN FETCH i.CustomerForItemDto c LEFT JOIN FETCH i.CatDto1 c1 LEFT JOIN FETCH i.CatDto2 c2 LEFT JOIN FETCH i.UnitForItemDto u LEFT JOIN FETCH i.InvenDto inv " +
           "WHERE (:CsearchItem IS NULL OR :CsearchItem = '' OR " +
           "(:CsearchCat = 'itemBigCat' AND c1.catNm LIKE %:CsearchItem%) OR " +
           "(:CsearchCat = 'itemSmallCat' AND c2.catNm LIKE %:CsearchItem%) OR " +
           "(:CsearchCat = 'ItemName' AND i.itemNm LIKE %:CsearchItem%) OR " +
           "(COALESCE(:CsearchCat, '') = '' AND i.itemNm LIKE %:CsearchItem%))")
    Page<ItemDto> findWithJoinsAndSearch(
            @Param("CsearchCat") String CsearchCat,
            @Param("CsearchItem") String CsearchItem,
            Pageable pageable
    );

    @Query("SELECT count(i) FROM ItemDto i LEFT JOIN i.CatDto1 c1 LEFT JOIN i.CatDto2 c2 " +
       "WHERE (:CsearchItem IS NULL OR :CsearchItem = '' OR " +
       "(:CsearchCat = 'itemBigCat' AND c1.catNm LIKE %:CsearchItem%) OR " +
       "(:CsearchCat = 'itemSmallCat' AND c2.catNm LIKE %:CsearchItem%) OR " +
       "(:CsearchCat = 'ItemName' AND i.itemNm LIKE %:CsearchItem%) OR " +
       "(COALESCE(:CsearchCat, '') = '' AND i.itemNm LIKE %:CsearchItem%))")
    long countWithSearch(
            @Param("CsearchCat") String CsearchCat,
            @Param("CsearchItem") String CsearchItem
    );

    // Excel 다운로드를 위한 검색 (페이징 없음)
     @Query("SELECT i FROM ItemDto i LEFT JOIN FETCH i.CustomerForItemDto c LEFT JOIN FETCH i.CatDto1 c1 LEFT JOIN FETCH i.CatDto2 c2 LEFT JOIN FETCH i.UnitForItemDto u LEFT JOIN FETCH i.InvenDto inv " +
           "WHERE (:CsearchItem IS NULL OR :CsearchItem = '' OR " +
           "(:CsearchCat = 'itemBigCat' AND c1.catNm LIKE %:CsearchItem%) OR " +
           "(:CsearchCat = 'itemSmallCat' AND c2.catNm LIKE %:CsearchItem%) OR " +
           "(:CsearchCat = 'ItemName' AND i.itemNm LIKE %:CsearchItem%) OR " +
           "(COALESCE(:CsearchCat, '') = '' AND i.itemNm LIKE %:CsearchItem%))")
    List<ItemDto> findForExcel(
            @Param("CsearchCat") String CsearchCat,
            @Param("CsearchItem") String CsearchItem
    );


    // 페이징 목록 (모든 아이템, 연관관계 Fetch Join 포함)
    @Query("SELECT i FROM ItemDto i LEFT JOIN FETCH i.CustomerForItemDto LEFT JOIN FETCH i.CatDto1 LEFT JOIN FETCH i.CatDto2 LEFT JOIN FETCH i.UnitForItemDto LEFT JOIN FETCH i.InvenDto")
    Page<ItemDto> findAllWithJoins(Pageable pageable);



    
     // TB_CUSTMST에서 모든 거래처 조회 (MyBatis의 selectALLCust)
     // CustomerRepository가 따로 있다면 거기서 처리하는 것이 더 적절합니다.
     @Query("SELECT c FROM CustomerForItemDto c ORDER BY c.custNm")
     List<CustomerForItemDto> findAllCustomers();

     // TB_ITEM_CAT에서 대분류 조회 (MyBatis의 selectALLcat1)
     @Query("SELECT ic FROM CatDto ic WHERE ic.parentIdx IS NULL OR ic.parentIdx = 0 ORDER BY ic.catIdx")
     List<CatDto> findAllParentCategories();


     // TB_UNIT_MST에서 모든 단위 조회 (MyBatis의 selectUnits)
     @Query("SELECT u FROM UnitForItemDto u ORDER BY u.unitIdx")
     List<UnitForItemDto> findAllUnits();
    
    // 희원 여기까지 --------------------------
    
}