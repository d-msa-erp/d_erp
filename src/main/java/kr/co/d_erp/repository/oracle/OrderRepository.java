package kr.co.d_erp.repository.oracle;

import java.sql.Timestamp;

import org.springframework.data.jpa.repository.Query;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Order;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
	
	@Query(value = "SELECT SYSDATE FROM DUAL", nativeQuery = true)
	Timestamp oracleTodayRaw();
	
	@Query("SELECT o FROM Order o LEFT JOIN FETCH o.customer c LEFT JOIN FETCH o.item i " + // "o.Customer"를 "o.customer"로 변경
		       "WHERE o.orderType = :orderType " +
		       "AND (:searchKeyword IS NULL OR o.orderCode LIKE %:searchKeyword% OR i.itemNm LIKE %:searchKeyword% OR c.custNm LIKE %:searchKeyword%)")
		Page<Order> findOrdersForMrpSummary(
		    @Param("orderType") String orderType,
		    @Param("searchKeyword") String searchKeyword,
		    Pageable pageable
		);
}
