package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.dtos.Custmst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustmstRepository extends JpaRepository<Custmst, Long> {
    List<Custmst> findByBizFlag(String bizFlag); // 목록 조회
}
