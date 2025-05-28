package kr.co.d_erp.repository.oracle;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.BomDtl;
import kr.co.d_erp.dtos.BomExcelViewProjection;
import kr.co.d_erp.dtos.BomListItemProjection;

@Repository
public interface BomDtlRepository extends JpaRepository<BomDtl, Long> {

    @Query(value = """
                SELECT
                    bom.P_ITEM_IDX     as parentItemIdx,
                    p_item.ITEM_CD     as parentItemCd,
                    p_item.ITEM_NM     as parentItemNm,
                    p_item.ITEM_FLAG   as parentItemFlag,
                    p_item.ITEM_SPEC   as parentItemSpec,
                    p_item.CYCLE_TIME  as parentCycleTime, 
                    p_item.REMARK      as parentRemark,   
                    bom.BOM_IDX        as bomIdx,
                    bom.S_ITEM_IDX     as subItemIdx,
                    s_item.ITEM_CD     as subItemCd,
                    s_item.ITEM_NM     as subItemNm,
                    bom.USE_QTY        as useQty,
                    unit.UNIT_NM       as unitNm,
                    s_item.ITEM_FLAG   as itemFlag,      -- 하위 품목의 ITEM_FLAG
                    s_item.ITEM_COST   as subItemMasterCost, -- 하위 품목의 마스터 코스트
                    inv.STOCK_QTY	   as subQty,		-- 희원 추가 (하위 품목의 현재고량)
                    bom.SEQ_NO         as seqNo,
                    bom.LOSS_RT        as lossRt,
                    bom.ITEM_PRICE     as itemPrice,
                    bom.REMARK         as remark         -- 하위 품목의 REMARK
                FROM
                    TB_BOMDTL bom
                JOIN
                    TB_ITEMMST p_item ON bom.P_ITEM_IDX = p_item.ITEM_IDX
                JOIN
                    TB_ITEMMST s_item ON bom.S_ITEM_IDX = s_item.ITEM_IDX
                LEFT JOIN
                    TB_UNIT_MST unit ON s_item.ITEM_UNIT = unit.UNIT_IDX
                LEFT JOIN
                	TB_INVENTORY inv ON s_item.ITEM_IDX = inv.ITEM_IDX
                WHERE
                    bom.P_ITEM_IDX = :parentItemIdx
                ORDER BY
                    bom.SEQ_NO ASC
                """, nativeQuery = true)
    List<BomListItemProjection> findBomListWithParentDetails(@Param("parentItemIdx") Long parentItemIdx);

    List<BomDtl> findByParentItemIdxOrderBySeqNoAsc(Long parentItemIdx);

    Optional<BomDtl> findByParentItemIdxAndSubItemIdx(Long parentItemIdx, Long subItemIdx);

    /**
     * V_BOM_EXCEL_DATA 뷰에서 특정 상위 품목 IDX들에 해당하는 모든 BOM 상세 라인을 조회.
     */
    @Query(value = "SELECT * FROM V_BOM_EXCEL_DATA WHERE parentItemIdx IN (:parentItemIdxList) ORDER BY parentItemIdx ASC, seqNo ASC", nativeQuery = true)
    List<BomExcelViewProjection> findExcelDataByParentItemIdxIn(@Param("parentItemIdxList") List<Long> parentItemIdxList);
}
