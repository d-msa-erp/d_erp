package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.OrderDetailView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDetailViewRepository extends JpaRepository<OrderDetailView, Long> {
    
}
