package kr.co.d_erp.repository.oracle;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.dtos.Inven;

@Repository
public interface InventoryRepository extends JpaRepository<Inven, Long>{
	Optional<Inven> findByItemIdx(Long itemIdx);
}
