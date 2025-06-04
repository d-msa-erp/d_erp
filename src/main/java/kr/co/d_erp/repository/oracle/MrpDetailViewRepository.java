package kr.co.d_erp.repository.oracle;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.MrpDetailView;
import kr.co.d_erp.dtos.MrpFirstDtoProjection;


@Repository
public interface MrpDetailViewRepository  extends JpaRepository<MrpDetailView, Long>, JpaSpecificationExecutor<MrpDetailView> {

    // 기존 메소드: 특정 주문에 대한 모든 MRP 결과(자재 상세) 조회 시 사용 가능
    Page<MrpDetailView> findByOrderIdx(Long orderIdx, Pageable pageable);
    List<MrpDetailView> findByOrderIdx(Long orderIdx);

    // 기존 메소드: MRP_RESULT_DETAILS 뷰에서 자재 레벨로 검색하여 페이징.
    // 만약 /api/mrp/orders 가 고유 주문 목록을 반환해야 한다면, 이 메소드는 더 이상 그 용도로 사용되지 않음.
    // 다른 용도(예: 전체 MRP 결과 검색)가 있다면 유지.
    @Query("SELECT mdv FROM MrpDetailView mdv WHERE " +
           "(:orderTypeFilter IS NULL OR mdv.orderType = :orderTypeFilter) AND " +
           "(" +
           "  (:searchKeyword IS NULL OR :searchKeyword = '') OR " +
           "  LOWER(mdv.orderCode) LIKE LOWER('%' || :searchKeyword || '%') OR " +
           "  LOWER(mdv.customerNm) LIKE LOWER('%' || :searchKeyword || '%') OR " +
           "  LOWER(mdv.productItemNm) LIKE LOWER('%' || :searchKeyword || '%')" +
           ")")
    Page<MrpDetailView> findOrdersForMrp(@Param("orderTypeFilter") String orderTypeFilter,
                                         @Param("searchKeyword") String searchKeyword,
                                         Pageable pageable);

    // JAVASCRIPT 수정 및 백엔드 수정: 고유한 MRP 대상 주문/완제품 목록을 가져오는 네이티브 쿼리 추가
    @Query(value = """
    		SELECT DISTINCT
    		ord.ORDER_IDX AS orderIdx,
    		ord.ORDER_CODE AS orderCode,
    		prd.PROD_CODE AS prodCd,
    		ord.ORDER_TYPE AS orderType,
    		ord.ORDER_DATE AS orderDate,
    		ord.DELIVERY_DATE AS orderDeliveryDate,
    		cust.CUST_NM AS customerNm,
    		ord.ITEM_IDX AS productPrimaryItemIdx,
    		main_product.ITEM_CD AS productItemCd,
    		main_product.ITEM_NM AS productItemNm,
    		main_product.ITEM_SPEC AS productItemSpec,
    		ord.ORDER_QTY AS orderQty,
    		main_prod_unit.UNIT_NM AS productUnitNm,
    		inv.STOCK_QTY AS productCurrentStock,
    		main_product.CYCLE_TIME AS productivity,
    		ord.REMARK AS remark,
    		CASE ord.ORDER_STATUS
    		WHEN 'S1' THEN '출고대기'
    		WHEN 'S2' THEN '생산필요'
    		WHEN 'S3' THEN '출고완료'
    		ELSE ord.ORDER_STATUS
    		END AS orderStatusOverall
    		FROM
    		TB_ORDER ord
    		INNER JOIN
    		TB_ITEMMST main_product ON ord.ITEM_IDX = main_product.ITEM_IDX
    		INNER JOIN
    		TB_BOMDTL bom ON main_product.ITEM_IDX = bom.P_ITEM_IDX
    		LEFT JOIN
    		TB_CUSTMST cust ON ord.CUST_IDX = cust.CUST_IDX
    		LEFT JOIN
    		TB_UNIT_MST main_prod_unit ON main_product.ITEM_UNIT = main_prod_unit.UNIT_IDX
    		LEFT JOIN
    		TB_INVENTORY inv ON main_product.ITEM_IDX = inv.ITEM_IDX
    		LEFT JOIN
    		TB_PRODUCTION prd ON prd.ITEM_IDX = ord.ITEM_IDX
    		WHERE
    		ord.ORDER_TYPE = 'S' AND
    		(:orderTypeFilter IS NULL OR ord.ORDER_TYPE = :orderTypeFilter) AND
    		(
    		(:searchKeyword IS NULL OR :searchKeyword = '') OR
    		LOWER(ord.ORDER_CODE) LIKE ('%' || LOWER(:searchKeyword) || '%') OR
    		LOWER(cust.CUST_NM) LIKE ('%' || LOWER(:searchKeyword) || '%') OR
    		LOWER(main_product.ITEM_NM) LIKE ('%' || LOWER(:searchKeyword) || '%')
    		)
    		""",
    		countQuery = """
    		SELECT COUNT(DISTINCT ord.ORDER_IDX)
    		FROM
    		TB_ORDER ord
    		INNER JOIN
    		TB_ITEMMST main_product ON ord.ITEM_IDX = main_product.ITEM_IDX
    		INNER JOIN
    		TB_BOMDTL bom ON main_product.ITEM_IDX = bom.P_ITEM_IDX
    		LEFT JOIN
    		TB_CUSTMST cust ON ord.CUST_IDX = cust.CUST_IDX
    		WHERE
    		ord.ORDER_TYPE = 'S' AND
    		(:orderTypeFilter IS NULL OR ord.ORDER_TYPE = :orderTypeFilter) AND
    		(
    		(:searchKeyword IS NULL OR :searchKeyword = '') OR
    		LOWER(ord.ORDER_CODE) LIKE ('%' || LOWER(:searchKeyword) || '%') OR
    		LOWER(cust.CUST_NM) LIKE ('%' || LOWER(:searchKeyword) || '%') OR
    		LOWER(main_product.ITEM_NM) LIKE ('%' || LOWER(:searchKeyword) || '%')
    		)
    		""",
            nativeQuery = true)
    Page<MrpFirstDtoProjection> findUniqueMrpTargetOrders(@Param("orderTypeFilter") String orderTypeFilter,
                                                       @Param("searchKeyword") String searchKeyword,
                                                       Pageable pageable);
}
