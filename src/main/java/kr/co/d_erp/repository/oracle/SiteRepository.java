package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Site;

@Repository
public interface SiteRepository extends JpaRepository<Site, String> {
    List<Site> findByBizFlag(String bizFlag);
}