package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.WarehouseInventoryDetailView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseInventoryDetailViewRepository extends JpaRepository<WarehouseInventoryDetailView, Long> {

    List<WarehouseInventoryDetailView> findByWhIdx(Long whIdx);
    List<WarehouseInventoryDetailView> findByWhCd(String whCd);

    // 참고: `findAll()`은 부모 인터페이스에 정의되어 있어 별도 선언 불필요
}