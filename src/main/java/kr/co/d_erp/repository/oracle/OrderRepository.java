package kr.co.d_erp.repository.oracle;

import java.sql.Timestamp;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Order;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
	
	@Query(value = "SELECT SYSDATE FROM DUAL", nativeQuery = true)
	Timestamp oracleTodayRaw();
}