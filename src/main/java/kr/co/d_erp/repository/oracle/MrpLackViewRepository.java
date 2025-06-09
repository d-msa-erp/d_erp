package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.MrpLackView;

@Repository
public interface MrpLackViewRepository extends JpaRepository<MrpLackView, Long> {
    @Query("SELECT m FROM MrpLackView m")
    List<MrpLackView> findAllLackMaterials();
}
