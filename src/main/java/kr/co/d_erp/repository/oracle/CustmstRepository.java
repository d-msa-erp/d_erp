package kr.co.d_erp.repository.oracle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
	
	Page<Custmst> findByBizFlag(String bizFlag, Pageable pageable);
	List<Custmst> findAll();

	@Query("SELECT c FROM Custmst c WHERE c.bizFlag = :bizFlag AND " +
	       "(c.custNm LIKE :keyword OR c.presidentNm LIKE :keyword OR c.bizTel LIKE %:keyword% OR c.custEmail LIKE %:keyword%)")
	Page<Custmst> findByBizFlagAndKeyword(@Param("bizFlag") String bizFlag,
            @Param("keyword") String keyword,
            Pageable pageable);
	
	// 거래처 목록
	@Query("SELECT new kr.co.d_erp.dtos.CustomerDTO(c.custIdx, c.custNm) FROM Custmst c WHERE c.bizFlag = :bizFlag")
	List<CustomerDTO> findCustIdxAndCustNmByBizFlag(@Param("bizFlag") String bizFlag);

	List<Custmst> findByCustIdxIn(List<Long> ids);

}
