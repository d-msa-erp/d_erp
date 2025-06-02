package kr.co.d_erp.repository.oracle;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Mrp;
import kr.co.d_erp.domain.MrpDetailView;

@Repository
public interface MrpRepository extends JpaRepository<Mrp, Long> {
	List<Mrp> findByOrderIdx(Long orderIdx);

}
