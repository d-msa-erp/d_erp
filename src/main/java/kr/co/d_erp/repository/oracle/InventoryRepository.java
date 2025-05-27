package kr.co.d_erp.repository.oracle;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import kr.co.d_erp.domain.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
	Optional<Inventory> findByWhIdxAndItemIdx(Long whIdx, Long itemIdx);

	@Query("SELECT COALESCE(SUM(i.stockQty), 0) FROM Inventory i WHERE i.itemIdx = :itemIdx")
    BigDecimal getTotalStockByItemIdx(@Param("itemIdx") Long itemIdx);
}