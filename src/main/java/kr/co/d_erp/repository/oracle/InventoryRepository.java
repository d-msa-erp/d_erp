package kr.co.d_erp.repository.oracle;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import kr.co.d_erp.domain.Inventory;
import kr.co.d_erp.dtos.StockProjection;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
	Optional<Inventory> findByWhIdxAndItemIdx(Long whIdx, Long itemIdx);

	@Query("SELECT COALESCE(SUM(i.stockQty), 0) FROM Inventory i WHERE i.itemIdx = :itemIdx")
    BigDecimal getTotalStockByItemIdx(@Param("itemIdx") Long itemIdx);
	
	@Query(value = "SELECT "
            + "item.ITEM_IDX AS itemIdx, "
            + "item.ITEM_NM AS itemNm, "
            + "item.ITEM_CD AS itemCd, "
            + "item.ITEM_COST AS itemCost, "
            + "unit.UNIT_NM AS unitNm, "
            + "inven.STOCK_QTY AS Qty, "
            + "item.OPTIMAL_INV AS Inv, "
            + "wh.WH_IDX AS whIdx, " 
            + "wh.WH_NM AS whNm, "
            + "item.ITEM_SPEC AS itemSpec, "
            + "item.CUST_IDX AS custIdxForItem, "
            + "inven.INV_IDX AS invIdx,"
            + "cust.CUST_NM AS custNm, "
            + "userMST.USER_NM AS userNm, "
            + "userMST.USER_TEL AS userTel, "
            + "userMST.USER_E_MAIL AS userMail, "
            + "item.REMARK AS reMark, "
            + "item.ITEM_UNIT AS unitIdx, "
            + "item.ITEM_FLAG AS itemFlag,"
            + "inv.TRANS_TYPE AS transType "
            + "FROM TB_INVENTORY inven "
            + "INNER JOIN TB_ITEMMST item ON item.ITEM_IDX = inven.ITEM_IDX "
            + "INNER JOIN TB_WHMST wh ON inven.WH_IDX = wh.WH_IDX "
            + "LEFT JOIN TB_UNIT_MST unit ON item.ITEM_UNIT = unit.UNIT_IDX "
            + "LEFT JOIN TB_CUSTMST cust ON item.CUST_IDX = cust.CUST_IDX "
            + "LEFT JOIN TB_USERMST userMST ON wh.WH_USER_IDX = userMST.USER_IDX " // 실제 USER PK 확인
            + "LEFT JOIN TB_INV_TRANS inv ON inv.INV_TRANS_IDX = inven.INV_IDX "
            + "WHERE "
            + "(:itemFlagFilter IS NULL OR inv.TRANS_TYPE = :itemFlagFilter) AND "
            + "(:searchKeyword IS NULL OR :searchKeyword = '' OR LOWER(item.ITEM_NM) LIKE ('%' || LOWER(:searchKeyword) || '%'))", // 검색어가 있으면 ITEM_NM만 검색
            countQuery = "SELECT COUNT(inven.ITEM_IDX) "
                    + "FROM TB_INVENTORY inven "
                    + "INNER JOIN TB_INV_TRANS inv ON inv.INV_TRANS_IDX = inven.INV_IDX "
                    + "INNER JOIN TB_ITEMMST item ON item.ITEM_IDX = inven.ITEM_IDX "
                    + "INNER JOIN TB_WHMST wh ON inven.WH_IDX = wh.WH_IDX "
                    + "WHERE "
                    + "(:itemFlagFilter IS NULL OR inv.TRANS_TYPE = :itemFlagFilter) AND "
                    + "(:searchKeyword IS NULL OR :searchKeyword = '' OR LOWER(item.ITEM_NM) LIKE ('%' || LOWER(:searchKeyword) || '%'))",
            nativeQuery = true)
    Page<StockProjection> findInventoryDetails(@Param("itemFlagFilter") String itemFlagFilter,
                                               @Param("searchKeyword") String searchKeyword,
                                               Pageable pageable);
	void deleteByInvIdxIn(List<Long> invIdxs);

	
	
}