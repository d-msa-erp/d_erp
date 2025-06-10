package kr.co.d_erp.repository.oracle;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.ItemInventoryView;
import kr.co.d_erp.dtos.ItemInventorySummaryDto;

@Repository
public interface ItemInventoryViewRepository extends JpaRepository<ItemInventoryView, Long> {
    List<ItemInventoryView> findByItemFlag(String itemFlag);
    List<ItemInventoryView> findByStockQtyLessThan(int optimalInv);
    
    
    @Query("""
    	    SELECT new kr.co.d_erp.dtos.ItemInventorySummaryDto(
    	        v.itemIdx,
    	        MAX(v.itemCd),
    	        MAX(v.itemNm),
    	        SUM(v.stockQty),
    	        MAX(v.optimalInv),
    	        MAX(v.itemCost)
    	    )
    	    FROM ItemInventoryView v
    	    WHERE v.itemFlag = '01'
    	    GROUP BY v.itemIdx
    	    HAVING SUM(v.stockQty) < MAX(v.optimalInv)
    	""")
    	List<ItemInventorySummaryDto> findItemsBelowOptimalInventory();
    
    @Query("SELECT SUM(v.stockQty) FROM ItemInventoryView v WHERE v.itemIdx = :itemIdx")
    Long getTotalStockQtyByItemIdx(@Param("itemIdx") Long itemIdx);
}
