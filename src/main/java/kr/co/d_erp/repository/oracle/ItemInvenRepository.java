package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.InvenDto;

public interface ItemInvenRepository extends JpaRepository<InvenDto, Integer> {
    
}
