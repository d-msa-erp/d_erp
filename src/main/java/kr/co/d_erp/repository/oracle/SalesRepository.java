package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.SalesView;

@Repository
public interface SalesRepository extends JpaRepository<SalesView, String> {	
	List<SalesView> findByOrderType(String orderType, Sort sort);
}
