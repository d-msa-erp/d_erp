package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.dtos.CustomerForSelectionDto;
import kr.co.d_erp.repository.oracle.CustmstRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustmstService {

    
    private final CustmstRepository custmstRepository;

    public List<Custmst> getCustomers(String bizFlag, String sortKey, String sortDirection, String keyword) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Sort sort = Sort.by(direction, sortKey);

        if (keyword == null || keyword.isBlank()) {
            return custmstRepository.findByBizFlag(bizFlag, sort);
        } else {
            return custmstRepository.findByBizFlagAndKeyword(bizFlag, "%" + keyword + "%", sort);
        }
    }
    
    // 상세 조회
    public Optional<Custmst> getCustomerById(Long id) {
        return custmstRepository.findById(id);
    }
    
    // 등록
    public Custmst saveCustomer(Custmst custmst) {
        return custmstRepository.save(custmst);
    }
    
    // 수정
    public Custmst updateCustomer(Long custIdx, Custmst updatedCust) {
        // 기존 데이터 조회
        Custmst existingCust = custmstRepository.findById(custIdx)
            .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다: " + custIdx));

        // 수정할 필드들 업데이트
        existingCust.setCustNm(updatedCust.getCustNm());
        existingCust.setPresidentNm(updatedCust.getPresidentNm());
        existingCust.setBizNo(updatedCust.getBizNo());
        existingCust.setBizTel(updatedCust.getBizTel());
        existingCust.setCustEmail(updatedCust.getCustEmail());
        existingCust.setBizFax(updatedCust.getBizFax());
        existingCust.setBizCond(updatedCust.getBizCond());
        existingCust.setBizItem(updatedCust.getBizItem());
        existingCust.setCompEmpNm(updatedCust.getCompEmpNm());
        existingCust.setCompNo(updatedCust.getCompNo());
        existingCust.setBizAddr(updatedCust.getBizAddr());


        return custmstRepository.save(existingCust);
    }
    
    // 고객 삭제
    public void deleteCustomer(Long id) {
        custmstRepository.deleteById(id);
    }

    //Datalist용 거래처 정보 조회 메소드
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션
    public List<CustomerForSelectionDto> findActiveCustomersForSelection(String bizFlag) {
        // Datalist에서는 일반적으로 이름순 정렬이 유용합니다.
        Sort defaultSort = Sort.by(Sort.Direction.ASC, "custNm");
        List<Custmst> customers;

        if (bizFlag != null && !bizFlag.isEmpty()) {
            customers = custmstRepository.findByBizFlag(bizFlag, defaultSort);
        } else {
            // bizFlag가 제공되지 않은 경우, 모든 거래처를 가져오거나,
            // 또는 특정 기본값(예: 매입처와 매출처 모두)으로 조회할 수 있습니다.
            // 여기서는 모든 거래처를 가져오도록 합니다. 필요에 따라 수정하세요.
            customers = custmstRepository.findAll(defaultSort);
        }

        if (customers == null) {
            return List.of(); // null일 경우 빈 리스트 반환
        }

        return customers.stream()
                .map(cust -> new CustomerForSelectionDto(
                        cust.getCustIdx(),
                        cust.getCustNm(),
                        cust.getCustCd()
                ))
                .collect(Collectors.toList());
        
        // 참고: "active" 상태에 대한 별도의 필터링 로직 (예: 사용여부 플래그)이
        // TB_CUSTMST 테이블에 있다면, 여기에 추가하거나 Repository 쿼리를 수정해야 합니다.
        // 현재는 bizFlag를 기준으로 필터링합니다.
    }



}
