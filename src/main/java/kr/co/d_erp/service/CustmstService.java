package kr.co.d_erp.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.Custmst;
import kr.co.d_erp.dtos.CustomerDTO;
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
        Custmst existingCust = custmstRepository.findById(custIdx)
            .orElseThrow(() -> new RuntimeException("데이터를 찾을 수 없습니다: " + custIdx));

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

    // 거래처 목록 DTO (bizFlag=02)
    public List<CustomerDTO> getCustomerNamesWithCode(String bizFlag) {
        return custmstRepository.findCustIdxAndCustNmByBizFlag(bizFlag);
    }

    // Datalist용 거래처 정보 조회 메소드
    @Transactional(readOnly = true)
    public List<CustomerForSelectionDto> findActiveCustomersForSelection(String bizFlag) {
        Sort defaultSort = Sort.by(Sort.Direction.ASC, "custNm");
        List<Custmst> customers;

        if (bizFlag != null && !bizFlag.isEmpty()) {
            customers = custmstRepository.findByBizFlag(bizFlag, defaultSort);
        } else {
            customers = custmstRepository.findAll(defaultSort);
        }

        if (customers == null) {
            return List.of();
        }

        return customers.stream()
                .map(cust -> new CustomerForSelectionDto(
                        cust.getCustIdx(),
                        cust.getCustNm(),
                        cust.getCustCd()
                ))
                .collect(Collectors.toList());
    }
}
