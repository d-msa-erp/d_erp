package kr.co.d_erp.repository.oracle;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.MrpDetailView;

@Repository
public interface MrpDetailViewRepository  extends JpaRepository<MrpDetailView, Long>, JpaSpecificationExecutor<MrpDetailView> {

	Page<MrpDetailView> findByOrderIdx(Long orderIdx, Pageable pageable);
	
	@Query("SELECT mdv FROM MrpDetailView mdv WHERE " +
		       "(:orderTypeFilter IS NULL OR mdv.orderType = :orderTypeFilter) AND " +
		       "(" +
		       "  (:searchKeyword IS NULL OR :searchKeyword = '') OR " + // 가독성을 위해 그룹화 (선택 사항)
		       "  LOWER(mdv.orderCode) LIKE LOWER('%' || :searchKeyword || '%') OR " +
		       "  LOWER(mdv.customerNm) LIKE LOWER('%' || :searchKeyword || '%') OR " +
		       "  LOWER(mdv.productItemNm) LIKE LOWER('%' || :searchKeyword || '%')" +
		       ")")
		Page<MrpDetailView> findOrdersForMrp(@Param("orderTypeFilter") String orderTypeFilter,
		                                     @Param("searchKeyword") String searchKeyword,
		                                     Pageable pageable);
}
