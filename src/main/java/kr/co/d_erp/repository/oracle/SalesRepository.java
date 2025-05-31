package kr.co.d_erp.repository.oracle;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.SalesView;

@Repository
public interface SalesRepository extends JpaRepository<SalesView, String> {	
	Page<SalesView> findByOrderType(String orderType, Pageable pageable);
	List<SalesView> findByOrderType(String orderType);
	
	@Query("""
		    SELECT s FROM SalesView s
		    WHERE (
		        LOWER(s.orderCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.itemCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.itemName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        CAST(s.quantity AS string) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        CAST(s.orderDate AS string) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        CAST(s.totalPrice AS string) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.userName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.orderStatus) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
		        LOWER(s.orderType) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
		    )
		    AND (
		        (:dateType = 'orderDate' AND (:startDate IS NULL OR s.orderDate >= :startDate) AND (:endDate IS NULL OR s.orderDate <= :endDate))
		        OR
		        (:dateType = 'deliveryDate' AND (:startDate IS NULL OR s.deliveryDate >= :startDate) AND (:endDate IS NULL OR s.deliveryDate <= :endDate))
		    )
		""")
	Page<SalesView> searchWithDate(
		    @Param("searchTerm") String searchTerm,
		    @Param("dateType") String dateType,
		    @Param("startDate") LocalDate startDate,
		    @Param("endDate") LocalDate endDate,
		    Pageable pageable
		);
	
	
	@Query("SELECT s FROM SalesView s WHERE " +
		       "(:searchTerm IS NULL OR :searchTerm = '' OR s.itemName LIKE %:searchTerm%) AND " +
		       "(:transStatus IS NULL OR :transStatus = '' OR s.orderStatus = :transStatus) AND " +
		       "(:startDate IS NULL OR :endDate IS NULL OR s.orderDate BETWEEN :startDate AND :endDate)")
	Page<SalesView> searchByOrderDate(@Param("searchTerm") String searchTerm,
		                                  @Param("startDate") LocalDate startDate,
		                                  @Param("endDate") LocalDate endDate,
		                                  @Param("transStatus") String transStatus,
		                                  Pageable pageable);

	@Query("SELECT s FROM SalesView s WHERE " +
		       "(:searchTerm IS NULL OR :searchTerm = '' OR s.itemName LIKE %:searchTerm%) AND " +
		       "(:transStatus IS NULL OR :transStatus = '' OR s.orderStatus = :transStatus) AND " +
		       "(:startDate IS NULL OR :endDate IS NULL OR s.deliveryDate BETWEEN :startDate AND :endDate)")
	Page<SalesView> searchByDeliveryDate(@Param("searchTerm") String searchTerm,
		                                     @Param("startDate") LocalDate startDate,
		                                     @Param("endDate") LocalDate endDate,
		                                     @Param("transStatus") String transStatus,
		                                     Pageable pageable);
	
	@Query("SELECT DISTINCT s FROM SalesView s WHERE s.orderIdx IN :ids")
	List<SalesView> findByOrderIdxIn(@Param("ids") List<Long> ids);

}
