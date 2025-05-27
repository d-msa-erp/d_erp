package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.CustomerForItemDto;

public interface ItemCustomerRepository extends JpaRepository<CustomerForItemDto, Long> {
    // 필요시 정렬 추가
    @Override
    List<CustomerForItemDto> findAll(); // 필요시 OrderBy 추가 가능 (예: findAllByOrderByCustNmAsc())
}
