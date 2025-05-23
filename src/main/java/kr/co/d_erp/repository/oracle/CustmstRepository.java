package kr.co.d_erp.repository.oracle;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.dtos.CustomerDTO;

import java.util.List;

@Repository
public interface CustmstRepository extends JpaRepository<Custmst, Long> {
	
	List<Custmst> findByBizFlag(String bizFlag, Sort sort);

	@Query("SELECT c FROM Custmst c WHERE c.bizFlag = :bizFlag AND " +
	       "(c.custNm LIKE :keyword OR c.presidentNm LIKE :keyword OR c.bizTel LIKE %:keyword% OR c.custEmail LIKE %:keyword%)")
	List<Custmst> findByBizFlagAndKeyword(@Param("bizFlag") String bizFlag,
	                                      @Param("keyword") String keyword,
	                                      Sort sort);
	
	// 거래처 목록
	@Query("SELECT new kr.co.d_erp.dtos.CustomerDTO(c.custIdx, c.custNm) FROM Custmst c WHERE c.bizFlag = :bizFlag")
	List<CustomerDTO> findCustIdxAndCustNmByBizFlag(@Param("bizFlag") String bizFlag);


}
