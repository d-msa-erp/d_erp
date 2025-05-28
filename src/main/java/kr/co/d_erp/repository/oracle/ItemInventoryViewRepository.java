package kr.co.d_erp.repository.oracle;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.ItemInventoryView;

@Repository
public interface ItemInventoryViewRepository extends JpaRepository<ItemInventoryView, Long> {
    List<ItemInventoryView> findByItemFlag(String itemFlag);
    List<ItemInventoryView> findByStockQtyLessThan(int optimalInv);
}
