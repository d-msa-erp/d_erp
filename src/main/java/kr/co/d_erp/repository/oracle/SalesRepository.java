package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.SalesView;

@Repository
public interface SalesRepository extends JpaRepository<SalesView, String> {	
	List<SalesView> findByOrderType(String orderType, Sort sort);
	
	@Query("SELECT s FROM SalesView s WHERE " +
			   "LOWER(s.orderCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.itemCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.itemName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "CAST(s.quantity AS string) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(CAST(s.orderDate AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "CAST(s.totalPrice AS string) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.userName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.orderStatus) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
		       "LOWER(s.orderType) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
	List<SalesView> searchItems(@Param("searchTerm") String searchTerm);

}
