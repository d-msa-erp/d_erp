package kr.co.d_erp.repository.oracle;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.domain.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
	Optional<Inventory> findByWhIdxAndItemIdx(Long whIdx, Long itemIdx);
}